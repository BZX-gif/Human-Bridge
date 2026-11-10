import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { requestMemo } from "@/lib/server-cache";
import { getDb } from "@/db";
import {
  careerRoadmaps,
  careers,
  plannerTasks,
  projects,
  roadmapMilestones,
  skillEvidence,
  skillPassports,
  skills,
  userProjects,
  users,
} from "@/db/schema";
import { ApiError } from "@/lib/api/response";
import { recordEvent } from "@/lib/events";
import { getUserSkills, refreshPassport, recomputeSkillScores } from "./skill-service";
import { getPassportForUser } from "./passport-service";
import type { ProfessionalLink } from "@/db/schema";

export interface PortfolioProjectView {
  id: number;
  title: string;
  description: string | null;
  status: "planned" | "in_progress" | "completed";
  difficulty: string | null;
  skillSlugs: string[];
  projectUrl: string | null;
  repositoryUrl: string | null;
  reflection: string | null;
  deliverables: string[];
  estimatedHours: number | null;
  verified: boolean;
  isPublic: boolean;
  source: "catalogue" | "custom";
  completedAt: string | null;
  createdAt: string;
}

export interface PortfolioActivity {
  id: string;
  type: "task" | "milestone" | "project" | "skill";
  label: string;
  detail: string | null;
  at: string;
}

export interface PortfolioView {
  profile: {
    name: string;
    headline: string | null;
    about: string | null;
    location: string | null;
    links: ProfessionalLink[];
    weeklyHours: number;
    currentLevel: string;
    initials: string;
  };
  career: { id: number; name: string; slug: string } | null;
  roadmap: { id: number; progress: number; completed: number; total: number } | null;
  readiness: number;
  publicId: string | null;
  isPublic: boolean;
  employerVisible: boolean;
  visibility: Record<string, boolean>;
  skills: {
    slug: string;
    name: string;
    score: number;
    level: string;
    verificationStatus: string;
    evidenceCount: number;
    assessmentCount: number;
  }[];
  selfReportedSkills: {
    slug: string;
    name: string;
    learningStatus: string | null;
    note: string | null;
  }[];
  projects: PortfolioProjectView[];
  milestones: { title: string; completedAt: string }[];
  stats: {
    tasksCompleted: number;
    projectsCompleted: number;
    milestonesCompleted: number;
    verifiedSkills: number;
    selfReportedSkills: number;
  };
  activity: PortfolioActivity[];
}

async function evidenceForProjects(userId: number, projectId: number, title: string, slugs: string[]) {
  const db = await getDb();
  // Replace this project's evidence instead of duplicating it.
  await db
    .delete(skillEvidence)
    .where(and(eq(skillEvidence.userId, userId), eq(skillEvidence.projectId, projectId)));
  if (slugs.length === 0) return;

  const rows = await db
    .select({ id: skills.id, slug: skills.slug })
    .from(skills)
    .where(inArray(skills.slug, slugs));

  if (rows.length > 0) {
    await db.insert(skillEvidence).values(
      rows.map((row) => ({
        userId,
        skillId: row.id,
        source: "SELF_REPORTED" as const,
        label: `Portfolio project: ${title}`,
        detail:
          "Self-attested project work. This is evidence of practice, not a verified assessment result.",
        projectId,
      })),
    );
  }
  await recomputeSkillScores(userId, rows.map((row) => row.id));
  await refreshPassport(userId);
}

export async function loadPortfolioForUser(userId: number): Promise<PortfolioView> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new ApiError("NOT_FOUND", "User not found.");

  // Wave 1: passport, skills, target career and active roadmap are independent.
  const [passport, userSkills, careerRows, roadmapRows] = await Promise.all([
    getPassportForUser(userId),
    getUserSkills(userId),
    user.targetCareerId
      ? db.select().from(careers).where(eq(careers.id, user.targetCareerId)).limit(1)
      : Promise.resolve([] as (typeof careers.$inferSelect)[]),
    db
      .select()
      .from(careerRoadmaps)
      .where(and(eq(careerRoadmaps.userId, userId), eq(careerRoadmaps.status, "active")))
      .orderBy(desc(careerRoadmaps.updatedAt))
      .limit(1),
  ]);
  const [career] = careerRows;
  const [roadmap] = roadmapRows;

  // Wave 2: milestones, projects and completed tasks are independent. The two
  // old milestone queries (summary + recent completions) are merged into one.
  const [milestoneRows, projectRows, doneTasks] = await Promise.all([
    roadmap
      ? db
          .select({
            status: roadmapMilestones.status,
            estimatedHours: roadmapMilestones.estimatedHours,
            title: roadmapMilestones.title,
            completedAt: roadmapMilestones.completedAt,
          })
          .from(roadmapMilestones)
          .where(eq(roadmapMilestones.roadmapId, roadmap.id))
      : Promise.resolve([] as { status: string; estimatedHours: number; title: string; completedAt: Date | null }[]),
    db
      .select({ userProject: userProjects, catalogue: projects })
      .from(userProjects)
      .leftJoin(projects, eq(projects.id, userProjects.projectId))
      .where(eq(userProjects.userId, userId))
      .orderBy(desc(userProjects.createdAt)),
    db
      .select()
      .from(plannerTasks)
      .where(and(eq(plannerTasks.userId, userId), eq(plannerTasks.status, "done")))
      .orderBy(desc(plannerTasks.completedAt))
      .limit(30),
  ]);

  let roadmapSummary: PortfolioView["roadmap"] = null;
  let milestonesCompleted = 0;
  if (roadmap) {
    milestonesCompleted = milestoneRows.filter((m) => m.status === "completed").length;
    const total = milestoneRows.reduce((sum, m) => sum + Math.max(1, m.estimatedHours), 0);
    const done = milestoneRows
      .filter((m) => m.status === "completed")
      .reduce((sum, m) => sum + Math.max(1, m.estimatedHours), 0);
    roadmapSummary = {
      id: roadmap.id,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
      completed: milestonesCompleted,
      total: milestoneRows.length,
    };
  }

  const projectViews: PortfolioProjectView[] = projectRows.map(({ userProject, catalogue }) => ({
    id: userProject.id,
    title: userProject.title ?? catalogue?.title ?? "Untitled project",
    description: userProject.description ?? catalogue?.description ?? null,
    status: userProject.status,
    difficulty: catalogue?.difficulty ?? null,
    skillSlugs: Array.isArray(userProject.skillSlugs) ? (userProject.skillSlugs as string[]) : [],
    projectUrl: userProject.projectUrl,
    repositoryUrl: userProject.repositoryUrl,
    reflection: userProject.reflection,
    deliverables: catalogue && Array.isArray(catalogue.deliverables) ? (catalogue.deliverables as string[]) : [],
    estimatedHours: catalogue?.estimatedHours ?? null,
    verified: userProject.verified,
    isPublic: userProject.isPublic,
    source: userProject.projectId ? "catalogue" : "custom",
    completedAt: userProject.completedAt ? userProject.completedAt.toISOString() : null,
    createdAt: userProject.createdAt.toISOString(),
  }));

  const activity: PortfolioActivity[] = [
    ...doneTasks.slice(0, 8).map((task) => ({
      id: `task-${task.id}`,
      type: "task" as const,
      label: task.title,
      detail: `Completed · ${task.estimatedMinutes} min`,
      at: (task.completedAt ?? task.updatedAt).toISOString(),
    })),
    ...projectViews.slice(0, 5).map((project) => ({
      id: `project-${project.id}`,
      type: "project" as const,
      label: project.title,
      detail: project.status === "completed" ? "Project completed" : "Project added",
      at: (project.completedAt ?? project.createdAt) as string,
    })),
  ];

  // Recent completions come from the same milestone rows fetched above — no
  // second query. (Same semantics: completed, newest first, max 8.)
  const completedMilestones: { title: string; completedAt: string }[] = roadmap
    ? milestoneRows
        .filter((milestone) => milestone.status === "completed" && milestone.completedAt)
        .sort(
          (a, b) => (b.completedAt as Date).getTime() - (a.completedAt as Date).getTime(),
        )
        .slice(0, 8)
        .map((milestone) => {
          const at = (milestone.completedAt as Date).toISOString();
          activity.push({
            id: `milestone-${milestone.title}`,
            type: "milestone",
            label: milestone.title,
            detail: "Milestone completed",
            at,
          });
          return { title: milestone.title, completedAt: at };
        })
    : [];

  activity.sort((a, b) => (a.at < b.at ? 1 : -1));

  const verifiedSkills = userSkills.filter(
    (skill) => skill.verificationStatus !== "self_reported" && skill.score > 0,
  );
  const selfReportedSkills = userSkills.filter((skill) => skill.verificationStatus === "self_reported");

  return {
    profile: {
      name: user.name,
      headline: user.headline,
      about: user.about,
      location: user.location,
      links: Array.isArray(user.links) ? (user.links as ProfessionalLink[]) : [],
      weeklyHours: user.weeklyHours,
      currentLevel: user.currentLevel,
      initials: user.avatarInitials ?? initials(user.name),
    },
    career: career ? { id: career.id, name: career.name, slug: career.slug } : null,
    roadmap: roadmapSummary,
    readiness: passport.readiness,
    publicId: passport.publicId,
    isPublic: passport.isPublic,
    employerVisible: passport.employerVisible,
    visibility: passport.visibility,
    skills: verifiedSkills.map((skill) => ({
      slug: skill.slug,
      name: skill.name,
      score: skill.score,
      level: skill.level,
      verificationStatus: skill.verificationStatus,
      evidenceCount: skill.evidenceCount,
      assessmentCount: skill.assessmentCount,
    })),
    selfReportedSkills: selfReportedSkills.map((skill) => ({
      slug: skill.slug,
      name: skill.name,
      learningStatus: null,
      note: null,
    })),
    projects: projectViews,
    milestones: completedMilestones,
    stats: {
      tasksCompleted: doneTasks.length,
      projectsCompleted: projectViews.filter((project) => project.status === "completed").length,
      milestonesCompleted,
      verifiedSkills: verifiedSkills.length,
      selfReportedSkills: selfReportedSkills.length,
    },
    activity: activity.slice(0, 12),
  };
}

/** Request-deduped portfolio read for pages and GET routes. */
export const getPortfolioForUser = requestMemo(loadPortfolioForUser);

/** Public view. Only fields the owner has chosen to expose are read. */
export async function loadPublicPortfolio(publicId: string): Promise<PortfolioView> {
  const db = await getDb();
  const [passport] = await db
    .select()
    .from(skillPassports)
    .where(eq(skillPassports.publicId, publicId))
    .limit(1);
  if (!passport || !passport.isPublic) {
    throw new ApiError("NOT_FOUND", "This portfolio is not publicly available.");
  }
  const view = await getPortfolioForUser(passport.userId);
  const visibility = view.visibility;

  return {
    ...view,
    profile: {
      ...view.profile,
      location: visibility.contact === false ? null : view.profile.location,
      links: visibility.contact === false ? [] : view.profile.links,
    },
    selfReportedSkills: visibility.skills === false ? [] : view.selfReportedSkills,
    skills: visibility.skills === false ? [] : view.skills,
    projects: visibility.projects === false ? [] : view.projects.filter((project) => project.isPublic),
    roadmap: visibility.journey === false ? null : view.roadmap,
    milestones: visibility.journey === false ? [] : view.milestones,
    activity: [],
  };
}

export const getPublicPortfolio = requestMemo(loadPublicPortfolio);

export async function addProject(
  userId: number,
  input: {
    projectId?: number | null;
    title?: string;
    description?: string | null;
    skillSlugs?: string[];
    projectUrl?: string | null;
    repositoryUrl?: string | null;
    status?: "planned" | "in_progress" | "completed";
  },
): Promise<{ id: number }> {
  const db = await getDb();

  let title = input.title?.trim() ?? "";
  let description = input.description ?? null;
  let skillSlugs = input.skillSlugs ?? [];
  let catalogueTitle: string | null = null;

  if (input.projectId) {
    const [catalogue] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1);
    if (!catalogue) throw new ApiError("NOT_FOUND", "Project not found.");

    const [existing] = await db
      .select({ id: userProjects.id })
      .from(userProjects)
      .where(and(eq(userProjects.userId, userId), eq(userProjects.projectId, input.projectId)))
      .limit(1);
    if (existing) throw new ApiError("CONFLICT", "This project is already in your portfolio.");

    catalogueTitle = catalogue.title;
    title = catalogue.title;
    description = catalogue.description;
    skillSlugs = Array.isArray(catalogue.skillSlugs) ? (catalogue.skillSlugs as string[]) : [];
  }

  if (!title) throw new ApiError("VALIDATION_ERROR", "A project title is required.");

  const validSlugs = skillSlugs.length
    ? (
        await db
          .select({ slug: skills.slug })
          .from(skills)
          .where(inArray(skills.slug, skillSlugs))
      ).map((row) => row.slug)
    : [];

  const status = input.status ?? "planned";
  const [row] = await db
    .insert(userProjects)
    .values({
      userId,
      projectId: input.projectId ?? null,
      title,
      description,
      skillSlugs: validSlugs,
      projectUrl: input.projectUrl ?? null,
      repositoryUrl: input.repositoryUrl ?? null,
      status,
      startedAt: status !== "planned" ? new Date() : null,
      completedAt: status === "completed" ? new Date() : null,
    })
    .returning();

  if (status === "completed") {
    await evidenceForProjects(userId, row.id, title, validSlugs);
  }

  await recordEvent({
    type: "project.created",
    userId,
    payload: { projectId: row.id, title: title ?? catalogueTitle },
  });

  return { id: row.id };
}

export async function updateProject(
  userId: number,
  id: number,
  patch: {
    title?: string;
    description?: string | null;
    skillSlugs?: string[];
    projectUrl?: string | null;
    repositoryUrl?: string | null;
    reflection?: string | null;
    status?: "planned" | "in_progress" | "completed";
    isPublic?: boolean;
  },
): Promise<void> {
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(userProjects)
    .where(and(eq(userProjects.id, id), eq(userProjects.userId, userId)))
    .limit(1);
  if (!existing) throw new ApiError("NOT_FOUND", "Project not found.");

  const validSlugs =
    patch.skillSlugs !== undefined
      ? patch.skillSlugs.length
        ? (
            await db
              .select({ slug: skills.slug })
              .from(skills)
              .where(inArray(skills.slug, patch.skillSlugs))
          ).map((row) => row.slug)
        : []
      : undefined;

  const status = patch.status ?? existing.status;

  await db
    .update(userProjects)
    .set({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(validSlugs !== undefined ? { skillSlugs: validSlugs } : {}),
      ...(patch.projectUrl !== undefined ? { projectUrl: patch.projectUrl } : {}),
      ...(patch.repositoryUrl !== undefined ? { repositoryUrl: patch.repositoryUrl } : {}),
      ...(patch.reflection !== undefined ? { reflection: patch.reflection } : {}),
      ...(patch.isPublic !== undefined ? { isPublic: patch.isPublic } : {}),
      status,
      ...(status !== "planned" && !existing.startedAt ? { startedAt: new Date() } : {}),
      completedAt: status === "completed" ? existing.completedAt ?? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(userProjects.id, id), eq(userProjects.userId, userId)));

  const title = patch.title ?? existing.title ?? "Untitled project";
  const slugs = validSlugs ?? (Array.isArray(existing.skillSlugs) ? (existing.skillSlugs as string[]) : []);

  if (status === "completed") {
    await evidenceForProjects(userId, id, title, slugs);
    await recordEvent({ type: "project.completed", userId, payload: { projectId: id, title } });
  } else {
    await db
      .delete(skillEvidence)
      .where(and(eq(skillEvidence.userId, userId), eq(skillEvidence.projectId, id)));
    await recomputeSkillScores(userId);
    await refreshPassport(userId);
  }
}

export async function deleteProject(userId: number, id: number): Promise<void> {
  const db = await getDb();
  const result = await db
    .delete(userProjects)
    .where(and(eq(userProjects.id, id), eq(userProjects.userId, userId)))
    .returning();
  if (result.length === 0) throw new ApiError("NOT_FOUND", "Project not found.");
  await db
    .delete(skillEvidence)
    .where(and(eq(skillEvidence.userId, userId), eq(skillEvidence.projectId, id)));
  await recomputeSkillScores(userId);
  await refreshPassport(userId);
}

/** Curated project catalogue, optionally scoped to a career. */
export async function loadProjectCatalogue(careerId?: number): Promise<
  {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    difficulty: string | null;
    estimatedHours: number | null;
    skillSlugs: string[];
    deliverables: string[];
    careerName: string | null;
    instructions: string | null;
  }[]
> {
  const db = await getDb();
  const rows = await db
    .select({ project: projects, careerName: careers.name })
    .from(projects)
    .leftJoin(careers, eq(careers.id, projects.careerId))
    .where(careerId ? eq(projects.careerId, careerId) : undefined)
    .orderBy(asc(projects.difficulty), asc(projects.title));

  return rows.map(({ project, careerName }) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    description: project.description,
    difficulty: project.difficulty,
    estimatedHours: project.estimatedHours,
    skillSlugs: Array.isArray(project.skillSlugs) ? (project.skillSlugs as string[]) : [],
    deliverables: Array.isArray(project.deliverables) ? (project.deliverables as string[]) : [],
    careerName,
    instructions: project.instructions,
  }));
}

export const listProjectCatalogue = requestMemo(loadProjectCatalogue);

export async function updateProfessionalProfile(
  userId: number,
  patch: {
    name?: string;
    headline?: string | null;
    about?: string | null;
    location?: string | null;
    links?: { label: string; url: string }[];
    weeklyHours?: number;
    currentLevel?: string;
  },
): Promise<void> {
  const db = await getDb();
  await db
    .update(users)
    .set({
      ...(patch.name !== undefined ? { name: patch.name, avatarInitials: initials(patch.name) } : {}),
      ...(patch.headline !== undefined ? { headline: patch.headline } : {}),
      ...(patch.about !== undefined ? { about: patch.about } : {}),
      ...(patch.location !== undefined ? { location: patch.location } : {}),
      ...(patch.links !== undefined ? { links: patch.links } : {}),
      ...(patch.weeklyHours !== undefined ? { weeklyHours: patch.weeklyHours } : {}),
      ...(patch.currentLevel !== undefined ? { currentLevel: patch.currentLevel } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  await recordEvent({ type: "profile.updated", userId });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
