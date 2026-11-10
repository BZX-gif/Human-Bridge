import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { requestMemo } from "@/lib/server-cache";
import { getDb } from "@/db";
import {
  careerRoadmaps,
  careerSkills,
  careerTracks,
  careers,
  learningResources,
  plannerTasks,
  projects,
  roadmapMilestones,
  roadmapStages,
  skills,
  users,
} from "@/db/schema";
import { ApiError } from "@/lib/api/response";
import { recordEvent } from "@/lib/events";
import { getUserSkills } from "@/lib/services/skill-service";
import {
  buildRoadmap,
  roadmapProgress,
  type PlannedRoadmap,
  type RoadmapProjectInput,
  type RoadmapResourceInput,
  type RoadmapSkillInput,
  type StartingLevel,
} from "@/lib/career/roadmap-template";

export interface RoadmapMilestoneView {
  id: number;
  stageId: number;
  title: string;
  objective: string;
  whyItMatters: string | null;
  skillSlugs: string[];
  resources: {
    title: string;
    provider?: string;
    url?: string;
    type?: string;
    note?: string;
    isDemo?: boolean;
  }[];
  exercises: string[];
  projectSlugs: string[];
  estimatedHours: number;
  completionCriteria: string[];
  dependsOn: string[];
  status: "not_started" | "in_progress" | "completed" | "skipped";
  ordering: number;
  completedAt: string | null;
  openTaskCount: number;
  doneTaskCount: number;
}

export interface RoadmapStageView {
  id: number;
  title: string;
  description: string | null;
  ordering: number;
  estimatedWeeks: number | null;
  milestones: RoadmapMilestoneView[];
  completedCount: number;
}

export interface RoadmapView {
  id: number;
  title: string;
  summary: string | null;
  careerId: number;
  careerName: string;
  careerSlug: string;
  hoursPerWeek: number;
  startingLevel: string;
  estimatedWeeks: number | null;
  status: string;
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  totalMilestones: number;
  completedMilestones: number;
  totalEstimatedHours: number;
  remainingEstimatedHours: number;
  stages: RoadmapStageView[];
  currentMilestone: RoadmapMilestoneView | null;
}

async function loadCareerData(careerId: number) {
  const db = await getDb();
  const [career] = await db.select().from(careers).where(eq(careers.id, careerId)).limit(1);
  if (!career) throw new ApiError("NOT_FOUND", "Career not found.");

  // Track, skills and projects are independent once the career is known.
  const [trackRows, skillRows, projectRows] = await Promise.all([
    career.trackId
      ? db
          .select({ slug: careerTracks.slug })
          .from(careerTracks)
          .where(eq(careerTracks.id, career.trackId))
          .limit(1)
      : Promise.resolve([]),
    db
      .select({
        skillId: skills.id,
        slug: skills.slug,
        name: skills.name,
        importance: careerSkills.importance,
        requiredLevel: careerSkills.requiredLevel,
        requiredScore: careerSkills.requiredScore,
        skillType: skills.skillType,
        difficulty: skills.difficulty,
        whyEmployersWant: skills.whyEmployersWant,
        categoryLabel: careerSkills.categoryLabel,
      })
      .from(careerSkills)
      .innerJoin(skills, eq(skills.id, careerSkills.skillId))
      .where(eq(careerSkills.careerId, careerId))
      .orderBy(asc(careerSkills.order)),
    db.select().from(projects).where(eq(projects.careerId, careerId)),
  ]);
  const trackSlug: string | null = trackRows[0]?.slug ?? null;

  const skillIds = skillRows.map((row) => row.skillId);
  const resourceRows =
    skillIds.length > 0
      ? await db.select().from(learningResources).where(inArray(learningResources.skillId, skillIds))
      : [];

  const resourcesBySlug: Record<string, RoadmapResourceInput[]> = {};
  for (const row of skillRows) {
    resourcesBySlug[row.slug] = resourceRows
      .filter((resource) => resource.skillId === row.skillId)
      .map((resource) => ({
        title: resource.title,
        provider: resource.provider,
        url: resource.url,
        type: resource.type,
        isDemo: resource.isDemo,
      }));
  }

  const projectInputs: RoadmapProjectInput[] = projectRows.map((project) => ({
    slug: project.slug,
    title: project.title,
    description: project.description,
    difficulty: project.difficulty,
    estimatedHours: project.estimatedHours,
    skillSlugs: Array.isArray(project.skillSlugs) ? (project.skillSlugs as string[]) : [],
    deliverables: Array.isArray(project.deliverables) ? (project.deliverables as string[]) : [],
  }));

  return { career, trackSlug, skillRows, resourcesBySlug, projectInputs };
}

function toSkillInputs(rows: Awaited<ReturnType<typeof loadCareerData>>["skillRows"]): RoadmapSkillInput[] {
  return rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    importance: row.importance,
    requiredLevel: row.requiredLevel,
    requiredScore: row.requiredScore,
    skillType: row.skillType,
    difficulty: row.difficulty,
    whyEmployersWant: row.whyEmployersWant,
    requiredCategory: row.categoryLabel,
  }));
}

/** Build an in-memory preview. Used on career pages; writes nothing. */
export const previewRoadmapForCareer = requestMemo(
  async (
    careerId: number,
    options: { hoursPerWeek?: number; startingLevel?: StartingLevel } = {},
  ): Promise<PlannedRoadmap> => {
  const data = await loadCareerData(careerId);
  return buildRoadmap({
    career: {
      name: data.career.name,
      slug: data.career.slug,
      tagline: data.career.tagline,
      description: data.career.description,
      trackSlug: data.trackSlug,
    },
    skills: toSkillInputs(data.skillRows),
    projects: data.projectInputs,
    resourcesBySkill: data.resourcesBySlug,
    startingLevel: options.startingLevel ?? "beginner",
    hoursPerWeek: options.hoursPerWeek ?? 5,
  });
  },
);

/**
 * Create (or return) the signed-in user's roadmap for a career.
 *
 * Idempotent per user+career. `regenerate` rebuilds from current evidence and
 * deletes the previous plan; planner tasks survive because their FK is SET NULL.
 */
export async function ensureRoadmapForUser(
  userId: number,
  careerId: number,
  options: { hoursPerWeek?: number; startingLevel?: StartingLevel; regenerate?: boolean } = {},
): Promise<{ roadmapId: number; created: boolean }> {
  const db = await getDb();
  const [userRows, existingRows] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db
      .select({ id: careerRoadmaps.id, status: careerRoadmaps.status })
      .from(careerRoadmaps)
      .where(and(eq(careerRoadmaps.userId, userId), eq(careerRoadmaps.careerId, careerId)))
      .limit(1),
  ]);
  const [user] = userRows;
  if (!user) throw new ApiError("NOT_FOUND", "User not found.");
  const [existing] = existingRows;

  if (existing && !options.regenerate && existing.status === "active") {
    return { roadmapId: existing.id, created: false };
  }

  const data = await loadCareerData(careerId);
  const hoursPerWeek = Math.min(40, Math.max(1, options.hoursPerWeek ?? user.weeklyHours ?? 5));
  const startingLevel: StartingLevel = options.startingLevel ?? "beginner";

  const userSkills = await getUserSkills(userId);
  const verifiedScores: Record<string, number> = {};
  for (const skill of userSkills) {
    if (skill.verificationStatus !== "self_reported" && skill.score > 0) {
      verifiedScores[skill.slug] = skill.score;
    }
  }

  const plan = buildRoadmap({
    career: {
      name: data.career.name,
      slug: data.career.slug,
      tagline: data.career.tagline,
      description: data.career.description,
      trackSlug: data.trackSlug,
    },
    skills: toSkillInputs(data.skillRows),
    projects: data.projectInputs,
    resourcesBySkill: data.resourcesBySlug,
    startingLevel,
    hoursPerWeek,
    verifiedScores,
  });

  if (existing) {
    await db.delete(careerRoadmaps).where(eq(careerRoadmaps.id, existing.id));
  }

  const [roadmap] = await db
    .insert(careerRoadmaps)
    .values({
      userId,
      careerId,
      title: plan.title,
      summary: plan.summary,
      startingLevel,
      hoursPerWeek,
      estimatedWeeks: plan.estimatedWeeks,
      status: "active",
      generatedBy: "template",
    })
    .returning();

  // Batched writes: one INSERT for all stages, one for all milestones.
  // The old code issued ~25 sequential round-trips here (~1s+ on hosted Postgres).
  const insertedStages = await db
    .insert(roadmapStages)
    .values(
      plan.stages.map((stage, stageIndex) => ({
        roadmapId: roadmap.id,
        title: stage.title,
        description: stage.description,
        ordering: stageIndex,
        estimatedWeeks: stage.estimatedWeeks,
      })),
    )
    .returning();
  // Match by explicit ordering, never by RETURNING order (which is unspecified).
  const stageIdByOrder = new Map(insertedStages.map((row) => [row.ordering, row.id]));

  const milestoneValues = plan.stages.flatMap((stage, stageIndex) =>
    stage.milestones.map((milestone) => ({
      roadmapId: roadmap.id,
      stageId: stageIdByOrder.get(stageIndex) ?? insertedStages[stageIndex].id,
      title: milestone.title,
      objective: milestone.objective,
      whyItMatters: milestone.whyItMatters,
      skillSlugs: milestone.skillSlugs,
      resources: milestone.resources,
      exercises: milestone.exercises,
      projectSlugs: milestone.projectSlugs,
      estimatedHours: milestone.estimatedHours,
      completionCriteria: milestone.completionCriteria,
      dependsOn: milestone.dependsOn,
      status: (milestone.status === "completed" ? "completed" : "not_started") as
        | "completed"
        | "not_started",
      ordering: milestone.ordering,
    })),
  );
  if (milestoneValues.length > 0) {
    await db.insert(roadmapMilestones).values(milestoneValues);
  }

  await db
    .update(users)
    .set({ targetCareerId: careerId, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await recordEvent({
    type: "roadmap.created",
    userId,
    payload: { careerId, roadmapId: roadmap.id, milestones: plan.stages.flatMap((s) => s.milestones).length },
  });

  return { roadmapId: roadmap.id, created: true };
}

function toMilestoneView(
  row: typeof roadmapMilestones.$inferSelect,
  taskCounts: Map<number, { open: number; done: number }>,
): RoadmapMilestoneView {
  const counts = taskCounts.get(row.id) ?? { open: 0, done: 0 };
  return {
    id: row.id,
    stageId: row.stageId,
    title: row.title,
    objective: row.objective,
    whyItMatters: row.whyItMatters,
    skillSlugs: Array.isArray(row.skillSlugs) ? (row.skillSlugs as string[]) : [],
    resources: Array.isArray(row.resources) ? (row.resources as RoadmapMilestoneView["resources"]) : [],
    exercises: Array.isArray(row.exercises) ? (row.exercises as string[]) : [],
    projectSlugs: Array.isArray(row.projectSlugs) ? (row.projectSlugs as string[]) : [],
    estimatedHours: row.estimatedHours,
    completionCriteria: Array.isArray(row.completionCriteria)
      ? (row.completionCriteria as string[])
      : [],
    dependsOn: Array.isArray(row.dependsOn) ? (row.dependsOn as string[]) : [],
    status: row.status,
    ordering: row.ordering,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    openTaskCount: counts.open,
    doneTaskCount: counts.done,
  };
}

function assembleRoadmap(
  roadmap: typeof careerRoadmaps.$inferSelect,
  career: { name: string; slug: string },
  stageRows: (typeof roadmapStages.$inferSelect)[],
  milestoneRows: (typeof roadmapMilestones.$inferSelect)[],
  taskCounts: Map<number, { open: number; done: number }>,
): RoadmapView {
  const stages: RoadmapStageView[] = stageRows.map((stage) => {
    const milestones = milestoneRows
      .filter((milestone) => milestone.stageId === stage.id)
      .sort((a, b) => a.ordering - b.ordering)
      .map((milestone) => toMilestoneView(milestone, taskCounts));
    return {
      id: stage.id,
      title: stage.title,
      description: stage.description,
      ordering: stage.ordering,
      estimatedWeeks: stage.estimatedWeeks,
      milestones,
      completedCount: milestones.filter((m) => m.status === "completed").length,
    };
  });

  const all = stages.flatMap((stage) => stage.milestones);
  const totalEstimatedHours = all.reduce((sum, m) => sum + Math.max(1, m.estimatedHours), 0);
  const remainingEstimatedHours = all
    .filter((m) => m.status !== "completed" && m.status !== "skipped")
    .reduce((sum, m) => sum + Math.max(1, m.estimatedHours), 0);
  const currentMilestone =
    all.find((m) => m.status === "in_progress") ??
    all.find((m) => m.status !== "completed" && m.status !== "skipped") ??
    null;

  return {
    id: roadmap.id,
    title: roadmap.title,
    summary: roadmap.summary,
    careerId: roadmap.careerId,
    careerName: career.name,
    careerSlug: career.slug,
    hoursPerWeek: roadmap.hoursPerWeek,
    startingLevel: roadmap.startingLevel,
    estimatedWeeks: roadmap.estimatedWeeks,
    status: roadmap.status,
    generatedBy: roadmap.generatedBy,
    createdAt: roadmap.createdAt.toISOString(),
    updatedAt: roadmap.updatedAt.toISOString(),
    progress: roadmapProgress(all),
    totalMilestones: all.length,
    completedMilestones: all.filter((m) => m.status === "completed").length,
    totalEstimatedHours,
    remainingEstimatedHours,
    stages,
    currentMilestone,
  };
}

/** Active roadmap for a user, preferring their current target career. */
/**
 * Uncached roadmap read. Used after writes in the same request (roadmap
 * creation, milestone updates) where the memoized `getRoadmapForUser` would
 * correctly-but-stalely return the pre-write result.
 */
export async function loadRoadmapForUser(
  userId: number,
  careerId?: number,
): Promise<RoadmapView | null> {
  const db = await getDb();
  // The user's target and their latest active roadmap are independent.
  const [userRows, latestRows] = await Promise.all([
    db.select({ targetCareerId: users.targetCareerId }).from(users).where(eq(users.id, userId)).limit(1),
    db
      .select()
      .from(careerRoadmaps)
      .where(and(eq(careerRoadmaps.userId, userId), eq(careerRoadmaps.status, "active")))
      .orderBy(desc(careerRoadmaps.updatedAt))
      .limit(1),
  ]);

  const preferredCareerId = careerId ?? userRows[0]?.targetCareerId ?? null;

  let roadmap: typeof careerRoadmaps.$inferSelect | undefined = latestRows[0];
  if (preferredCareerId && roadmap?.careerId !== preferredCareerId) {
    // Latest plan is for another career — fetch the preferred one explicitly.
    // (Same preference order as before: preferred career first, else latest.)
    [roadmap] = await db
      .select()
      .from(careerRoadmaps)
      .where(
        and(
          eq(careerRoadmaps.userId, userId),
          eq(careerRoadmaps.careerId, preferredCareerId),
          eq(careerRoadmaps.status, "active"),
        ),
      )
      .limit(1);
    if (!roadmap) roadmap = latestRows[0];
  }
  if (!roadmap) return null;

  // Career, stages and milestones are independent once the roadmap is known.
  const [careerRows, stageRows, milestoneRows] = await Promise.all([
    db
      .select({ name: careers.name, slug: careers.slug })
      .from(careers)
      .where(eq(careers.id, roadmap.careerId))
      .limit(1),
    db
      .select()
      .from(roadmapStages)
      .where(eq(roadmapStages.roadmapId, roadmap.id))
      .orderBy(asc(roadmapStages.ordering)),
    db
      .select()
      .from(roadmapMilestones)
      .where(eq(roadmapMilestones.roadmapId, roadmap.id))
      .orderBy(asc(roadmapMilestones.ordering)),
  ]);
  const [career] = careerRows;
  if (!career) return null;

  const taskRows =
    milestoneRows.length > 0
      ? await db
          .select({
            milestoneId: plannerTasks.milestoneId,
            status: plannerTasks.status,
          })
          .from(plannerTasks)
          .where(
            and(
              eq(plannerTasks.userId, userId),
              inArray(
                plannerTasks.milestoneId,
                milestoneRows.map((m) => m.id),
              ),
            ),
          )
      : [];

  const taskCounts = new Map<number, { open: number; done: number }>();
  for (const task of taskRows) {
    if (task.milestoneId === null) continue;
    const current = taskCounts.get(task.milestoneId) ?? { open: 0, done: 0 };
    if (task.status === "done") current.done += 1;
    else current.open += 1;
    taskCounts.set(task.milestoneId, current);
  }

  return assembleRoadmap(roadmap, career, stageRows, milestoneRows, taskCounts);
}

/** Request-deduped roadmap read for pages and GET routes. */
export const getRoadmapForUser = requestMemo(loadRoadmapForUser);

export async function updateMilestoneStatus(
  userId: number,
  milestoneId: number,
  status: "not_started" | "in_progress" | "completed" | "skipped",
): Promise<RoadmapView | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      milestone: roadmapMilestones,
      roadmap: careerRoadmaps,
    })
    .from(roadmapMilestones)
    .innerJoin(careerRoadmaps, eq(careerRoadmaps.id, roadmapMilestones.roadmapId))
    .where(eq(roadmapMilestones.id, milestoneId))
    .limit(1);

  if (!row || row.roadmap.userId !== userId) {
    throw new ApiError("NOT_FOUND", "Milestone not found.");
  }

  await db
    .update(roadmapMilestones)
    .set({
      status,
      completedAt: status === "completed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(roadmapMilestones.id, milestoneId));

  await db
    .update(careerRoadmaps)
    .set({ updatedAt: new Date() })
    .where(eq(careerRoadmaps.id, row.roadmap.id));

  await recordEvent({
    type: status === "completed" ? "milestone.completed" : "milestone.updated",
    userId,
    payload: { milestoneId, roadmapId: row.roadmap.id, status, title: row.milestone.title },
  });

  // Fresh read: this request just wrote, so bypass the request memo.
  return loadRoadmapForUser(userId, row.roadmap.careerId);
}

/** Compact context for the dashboard and mentor. Never includes unverified claims. */
export async function getRoadmapContext(userId: number) {
  const roadmap = await getRoadmapForUser(userId);
  if (!roadmap) return null;
  const all = roadmap.stages.flatMap((stage) => stage.milestones);
  return {
    roadmap,
    currentMilestone: roadmap.currentMilestone,
    nextThree: all
      .filter((m) => m.status !== "completed" && m.status !== "skipped")
      .slice(0, 3),
    completed: all.filter((m) => m.status === "completed"),
  };
}
