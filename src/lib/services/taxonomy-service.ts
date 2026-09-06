import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  assessmentBlueprintSkills,
  assessmentBlueprints,
  assessmentItems,
  careerTracks,
  careers,
  skillCapabilities,
  skillCategories,
  skillScores,
  skills,
  subSkills,
  trackSkills,
  users,
} from "@/db/schema";
import { ApiError } from "@/lib/api/response";
import { clampScore } from "@/lib/assessment/rubric-engine";
import type { SkillLevel } from "@/lib/assessment/types";
import { getUserSkills, type UserSkillView } from "./skill-service";

/**
 * Skills & Assessments taxonomy service.
 *
 * Read paths are public. Write paths are admin-only — the API layer enforces
 * `requireAdmin()` before calling them. Everything keeps relationships in
 * normalised tables:
 *   track → track_skills → skill → sub_skills / skill_capabilities
 *   skill → assessment_blueprint_skills → assessment_blueprints
 */

// ─── Public reads ─────────────────────────────────────────────────────────

export interface TrackView {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  difficultyLevels: string[];
  status: string;
  ordering: number;
  icon: string | null;
  color: string | null;
  skillCount: number;
  roles: { id: number; name: string; slug: string }[];
}

export async function listCareerTracks(): Promise<TrackView[]> {
  const db = await getDb();
  const rows = await db
    .select({
      track: careerTracks,
      skillCount: count(trackSkills.id),
    })
    .from(careerTracks)
    .leftJoin(trackSkills, eq(trackSkills.trackId, careerTracks.id))
    .where(eq(careerTracks.status, "active"))
    .groupBy(careerTracks.id)
    .orderBy(careerTracks.ordering, careerTracks.name);

  return rows.map((r) => ({
    id: r.track.id,
    name: r.track.name,
    slug: r.track.slug,
    description: r.track.description,
    category: r.track.category,
    difficultyLevels: (r.track.difficultyLevels as string[]) ?? [],
    status: r.track.status,
    ordering: r.track.ordering,
    icon: r.track.icon,
    color: r.track.color,
    skillCount: Number(r.skillCount),
    roles: [],
  }));
}

export interface TrackSkillView {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  skillType: string;
  difficulty: string;
  importance: string;
  marketRelevance: string;
  requiredLevel: SkillLevel;
  categoryLabel: string | null;
  ordering: number;
  candidateScore: number | null;
  subSkills: { id: number; name: string; slug: string; description: string | null }[];
  capabilities: { id: number; dimension: string; title: string; description: string | null }[];
}

export async function getCareerTrackBySlug(
  slug: string,
  userId?: number,
): Promise<{ track: TrackView; skills: TrackSkillView[] }> {
  const db = await getDb();
  const [track] = await db
    .select()
    .from(careerTracks)
    .where(and(eq(careerTracks.slug, slug), eq(careerTracks.status, "active")))
    .limit(1);
  if (!track) throw new ApiError("NOT_FOUND", "Career track not found.");

  const roleRows = await db
    .select({ id: careers.id, name: careers.name, slug: careers.slug })
    .from(careers)
    .where(eq(careers.trackId, track.id))
    .orderBy(careers.name);

  const skillRows = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      name: skills.name,
      description: skills.description,
      skillType: skills.skillType,
      difficulty: skills.difficulty,
      importance: skills.importance,
      marketRelevance: skills.marketRelevance,
      requiredLevel: trackSkills.requiredLevel,
      categoryLabel: trackSkills.categoryLabel,
      ordering: trackSkills.ordering,
    })
    .from(trackSkills)
    .innerJoin(skills, eq(skills.id, trackSkills.skillId))
    .where(and(eq(trackSkills.trackId, track.id), eq(skills.status, "active")))
    .orderBy(trackSkills.ordering);

  const skillIds = skillRows.map((s) => s.id);
  const subRows = skillIds.length
    ? await db
        .select()
        .from(subSkills)
        .where(and(inArray(subSkills.skillId, skillIds), eq(subSkills.status, "active")))
        .orderBy(subSkills.ordering)
    : [];
  const capRows = skillIds.length
    ? await db
        .select()
        .from(skillCapabilities)
        .where(
          and(inArray(skillCapabilities.skillId, skillIds), eq(skillCapabilities.status, "active")),
        )
        .orderBy(skillCapabilities.ordering)
    : [];

  const mySkills = userId ? await getUserSkills(userId) : [];
  const myBySlug = new Map(mySkills.map((s) => [s.slug, s]));

  const skillsView: TrackSkillView[] = skillRows.map((row) => ({
    ...row,
    candidateScore: myBySlug.get(row.slug)?.score ?? null,
    subSkills: subRows
      .filter((s) => s.skillId === row.id)
      .map((s) => ({ id: s.id, name: s.name, slug: s.slug, description: s.description })),
    capabilities: capRows
      .filter((c) => c.skillId === row.id)
      .map((c) => ({
        id: c.id,
        dimension: c.dimension,
        title: c.title,
        description: c.description,
      })),
  }));

  return {
    track: {
      id: track.id,
      name: track.name,
      slug: track.slug,
      description: track.description,
      category: track.category,
      difficultyLevels: (track.difficultyLevels as string[]) ?? [],
      status: track.status,
      ordering: track.ordering,
      icon: track.icon,
      color: track.color,
      skillCount: skillRows.length,
      roles: roleRows.map((r) => ({ id: r.id, name: r.name, slug: r.slug })),
    },
    skills: skillsView,
  };
}

export interface SkillListItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  skillType: string;
  difficulty: string;
  importance: string;
  marketRelevance: string;
  status?: string;
  whyEmployersWant?: string | null;
  categoryName?: string | null;
  trackSlug?: string | null;
  trackName?: string | null;
  requiredLevel?: SkillLevel | null;
}

export async function listSkills(filters?: {
  trackSlug?: string;
  skillType?: "domain" | "tool" | "human" | "ai_fluency";
}): Promise<SkillListItem[]> {
  const db = await getDb();
  if (filters?.trackSlug) {
    return db
      .select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
        description: skills.description,
        skillType: skills.skillType,
        difficulty: skills.difficulty,
        importance: skills.importance,
        marketRelevance: skills.marketRelevance,
        status: skills.status,
        whyEmployersWant: skills.whyEmployersWant,
        categoryName: skillCategories.name,
        trackSlug: careerTracks.slug,
        trackName: careerTracks.name,
        requiredLevel: trackSkills.requiredLevel,
      })
      .from(trackSkills)
      .innerJoin(skills, eq(skills.id, trackSkills.skillId))
      .leftJoin(skillCategories, eq(skillCategories.id, skills.categoryId))
      .innerJoin(careerTracks, eq(careerTracks.id, trackSkills.trackId))
      .where(
        and(
          eq(careerTracks.slug, filters.trackSlug),
          eq(skills.status, "active"),
          filters.skillType ? eq(skills.skillType, filters.skillType) : undefined,
        ),
      )
      .orderBy(trackSkills.ordering);
  }

  return db
    .select({
      id: skills.id,
      name: skills.name,
      slug: skills.slug,
      description: skills.description,
      skillType: skills.skillType,
      difficulty: skills.difficulty,
      importance: skills.importance,
      marketRelevance: skills.marketRelevance,
      status: skills.status,
      whyEmployersWant: skills.whyEmployersWant,
      categoryName: skillCategories.name,
    })
    .from(skills)
    .leftJoin(skillCategories, eq(skillCategories.id, skills.categoryId))
    .where(
      and(
        eq(skills.status, "active"),
        filters?.skillType ? eq(skills.skillType, filters.skillType) : undefined,
      ),
    )
    .orderBy(skills.name);
}

export interface SkillDetailView {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  whyEmployersWant: string | null;
  skillType: string;
  difficulty: string;
  importance: string;
  marketRelevance: string;
  status: string;
  categoryName: string | null;
  tracks: {
    id: number;
    name: string;
    slug: string;
    requiredLevel: SkillLevel;
    importance: string;
  }[];
  subSkills: { id: number; name: string; slug: string; description: string | null }[];
  capabilities: {
    id: number;
    dimension: string;
    title: string;
    description: string | null;
    definition: Record<string, unknown> | null;
  }[];
  assessments: {
    id: number;
    slug: string;
    title: string;
    version: number;
    assessmentType: string;
    difficulty: string;
    status: string;
  }[];
  /** Skills with no attachment to a blueprint are still fully measurable. */
  assessmentReadiness: number;
  candidate: UserSkillView | null;
}

export async function getSkillBySlug(slug: string, userId?: number): Promise<SkillDetailView> {
  const db = await getDb();
  const [skill] = await db
    .select({
      skill: skills,
      categoryName: skillCategories.name,
    })
    .from(skills)
    .leftJoin(skillCategories, eq(skillCategories.id, skills.categoryId))
    .where(and(eq(skills.slug, slug), eq(skills.status, "active")))
    .limit(1);
  if (!skill) throw new ApiError("NOT_FOUND", "Skill not found.");

  const [trackLinks, subRows, capRows, assessmentRows] = await Promise.all([
    db
      .select({
        id: careerTracks.id,
        name: careerTracks.name,
        slug: careerTracks.slug,
        requiredLevel: trackSkills.requiredLevel,
        importance: trackSkills.importance,
      })
      .from(trackSkills)
      .innerJoin(careerTracks, eq(careerTracks.id, trackSkills.trackId))
      .where(eq(trackSkills.skillId, skill.skill.id))
      .orderBy(careerTracks.ordering),
    db
      .select()
      .from(subSkills)
      .where(and(eq(subSkills.skillId, skill.skill.id), eq(subSkills.status, "active")))
      .orderBy(subSkills.ordering),
    db
      .select()
      .from(skillCapabilities)
      .where(and(eq(skillCapabilities.skillId, skill.skill.id), eq(skillCapabilities.status, "active")))
      .orderBy(skillCapabilities.ordering),
    db
      .select({
        id: assessmentBlueprints.id,
        slug: assessmentBlueprints.slug,
        title: assessmentBlueprints.title,
        version: assessmentBlueprints.version,
        assessmentType: assessmentBlueprints.assessmentType,
        difficulty: assessmentBlueprints.difficulty,
        status: assessmentBlueprints.status,
      })
      .from(assessmentBlueprintSkills)
      .innerJoin(assessmentBlueprints, eq(assessmentBlueprints.id, assessmentBlueprintSkills.blueprintId))
      .where(eq(assessmentBlueprintSkills.skillId, skill.skill.id))
      .orderBy(desc(assessmentBlueprints.updatedAt)),
  ]);

  const candidate = userId !== undefined ? await getUserSkillForCandidate(userId, skill.skill.id) : null;

  // Assessment readiness: also count legacy item skillSlug references so the
  // existing seeded blueprint (which predates the normalised link table) shows up.
  const legacyLinked = await db
    .select({ id: assessmentItems.id })
    .from(assessmentItems)
    .where(sql`${assessmentItems.skillSlugs}::text ILIKE ${`%"${slug}"%`}`)
    .limit(1);

  return {
    id: skill.skill.id,
    name: skill.skill.name,
    slug: skill.skill.slug,
    description: skill.skill.description,
    whyEmployersWant: skill.skill.whyEmployersWant,
    skillType: skill.skill.skillType,
    difficulty: skill.skill.difficulty,
    importance: skill.skill.importance,
    marketRelevance: skill.skill.marketRelevance,
    status: skill.skill.status,
    categoryName: skill.categoryName,
    tracks: trackLinks,
    subSkills: subRows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
    })),
    capabilities: capRows.map((c) => ({
      id: c.id,
      dimension: c.dimension,
      title: c.title,
      description: c.description,
      definition: (c.definition as Record<string, unknown>) ?? null,
    })),
    assessments: assessmentRows,
    assessmentReadiness: assessmentRows.length > 0 || legacyLinked.length > 0 ? 1 : 0,
    candidate,
  };
}

async function getUserSkillForCandidate(
  userId: number,
  skillId: number,
): Promise<UserSkillView | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      skillId: skillScores.skillId,
      slug: skills.slug,
      name: skills.name,
      score: skillScores.score,
      level: skillScores.level,
      confidence: skillScores.confidence,
      evidenceCount: skillScores.evidenceCount,
      assessmentCount: skillScores.assessmentCount,
      verificationStatus: skillScores.verificationStatus,
      lastVerifiedAt: skillScores.lastVerifiedAt,
      lastAssessedAt: skillScores.lastAssessedAt,
    })
    .from(skillScores)
    .innerJoin(skills, eq(skills.id, skillScores.skillId))
    .where(and(eq(skillScores.userId, userId), eq(skillScores.skillId, skillId)))
    .limit(1);
  return row ?? null;
}

export async function getTrackSkills(trackSlug: string): Promise<SkillListItem[]> {
  const db = await getDb();
  const [track] = await db
    .select({ id: careerTracks.id })
    .from(careerTracks)
    .where(and(eq(careerTracks.slug, trackSlug), eq(careerTracks.status, "active")))
    .limit(1);
  if (!track) throw new ApiError("NOT_FOUND", "Career track not found.");

  return db
    .select({
      id: skills.id,
      name: skills.name,
      slug: skills.slug,
      description: skills.description,
      skillType: skills.skillType,
      difficulty: skills.difficulty,
      importance: trackSkills.importance,
      marketRelevance: skills.marketRelevance,
      requiredLevel: trackSkills.requiredLevel,
    })
    .from(trackSkills)
    .innerJoin(skills, eq(skills.id, trackSkills.skillId))
    .where(and(eq(trackSkills.trackId, track.id), eq(skills.status, "active")))
    .orderBy(trackSkills.ordering);
}

export async function getCareerReadinessForTrack(
  trackSlug: string,
  userId: number,
): Promise<{ readiness: number | null; gaps: { slug: string; name: string; score: number; requiredLevel: SkillLevel }[] }> {
  const db = await getDb();
  const [track] = await db
    .select({ id: careerTracks.id })
    .from(careerTracks)
    .where(eq(careerTracks.slug, trackSlug))
    .limit(1);
  if (!track) throw new ApiError("NOT_FOUND", "Career track not found.");

  const required = await db
    .select({
      slug: skills.slug,
      name: skills.name,
      requiredLevel: trackSkills.requiredLevel,
    })
    .from(trackSkills)
    .innerJoin(skills, eq(skills.id, trackSkills.skillId))
    .where(eq(trackSkills.trackId, track.id));

  const mine = await getUserSkills(userId);
  const bySlug = new Map(mine.map((s) => [s.slug, s]));

  const gaps = required.map((r) => ({
    slug: r.slug,
    name: r.name,
    score: bySlug.get(r.slug)?.score ?? 0,
    requiredLevel: r.requiredLevel,
  }));

  const scored = gaps.filter((g) => g.score > 0);
  const readiness = scored.length === 0 ? null : clampScore(scored.reduce((sum, g) => sum + g.score, 0) / scored.length);
  return { readiness, gaps };
}

// ─── AI Fluency (cross-functional capability) ─────────────────────────────

export interface AiFluencySummary {
  skillCount: number;
  assessedCount: number;
  averageScore: number | null;
  strongestLevel: SkillLevel;
  verificationStatus: string | null;
  capabilities: UserSkillView[];
}

/**
 * AI Fluency is not a career track — it is an aggregation across every skill
 * tagged `ai_fluency` that the candidate has evidence for. It can be shown on
 * the verified profile and queried by future employer search.
 */
export async function getAiFluencyProfile(userId: number): Promise<AiFluencySummary> {
  const db = await getDb();
  const all = await getUserSkills(userId);

  const rows = await db
    .select({ id: skills.id })
    .from(skills)
    .where(and(eq(skills.skillType, "ai_fluency"), eq(skills.status, "active")));
  const aiSkillIds = new Set(rows.map((r) => r.id));

  const capabilities = all.filter((s) => aiSkillIds.has(s.skillId));
  const assessed = capabilities.filter(
    (s) => s.assessmentCount > 0 || s.verificationStatus !== "self_reported",
  );
  const averageScore = assessed.length
    ? clampScore(assessed.reduce((sum, s) => sum + s.score, 0) / assessed.length)
    : null;

  let strongestLevel: SkillLevel = "not_evaluated";
  let verificationStatus: string | null = null;
  if (assessed.length > 0) {
    const strongest = [...assessed].sort((a, b) => b.score - a.score)[0];
    strongestLevel = strongest.level;
    verificationStatus = strongest.verificationStatus;
  }

  return {
    skillCount: capabilities.length,
    assessedCount: assessed.length,
    averageScore,
    strongestLevel,
    verificationStatus,
    capabilities,
  };
}

// ─── Admin write paths ─────────────────────────────────────────────────────

export interface CreateSkillInput {
  name: string;
  slug: string;
  description?: string;
  whyEmployersWant?: string;
  categorySlug?: string;
  skillType?: "domain" | "tool" | "human" | "ai_fluency";
  difficulty?: "beginner" | "intermediate" | "advanced";
  importance?: "essential" | "important" | "helpful";
  marketRelevance?: "very_high" | "high" | "medium" | "low";
  status?: "active" | "disabled" | "archived";
}

export async function createSkill(input: CreateSkillInput) {
  const db = await getDb();
  const existing = await db
    .select({ id: skills.id })
    .from(skills)
    .where(eq(skills.slug, input.slug))
    .limit(1);
  if (existing.length > 0) {
    throw new ApiError("CONFLICT", `A skill with slug "${input.slug}" already exists.`);
  }

  const categoryId = input.categorySlug
    ? (
        await db
          .select({ id: skillCategories.id })
          .from(skillCategories)
          .where(eq(skillCategories.slug, input.categorySlug))
          .limit(1)
      )[0]?.id ?? null
    : null;

  const [row] = await db
    .insert(skills)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      whyEmployersWant: input.whyEmployersWant ?? null,
      categoryId,
      skillType: input.skillType ?? "domain",
      difficulty: input.difficulty ?? "beginner",
      importance: input.importance ?? "important",
      marketRelevance: input.marketRelevance ?? "medium",
      status: input.status ?? "active",
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function updateSkill(id: number, input: Partial<Omit<CreateSkillInput, "slug">>) {
  const db = await getDb();
  const [existing] = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
  if (!existing) throw new ApiError("NOT_FOUND", "Skill not found.");

  const categoryId = input.categorySlug
    ? (
        await db
          .select({ id: skillCategories.id })
          .from(skillCategories)
          .where(eq(skillCategories.slug, input.categorySlug))
          .limit(1)
      )[0]?.id ?? existing.categoryId
    : existing.categoryId;

  const [row] = await db
    .update(skills)
    .set({
      name: input.name ?? existing.name,
      description: input.description !== undefined ? input.description : existing.description,
      whyEmployersWant:
        input.whyEmployersWant !== undefined ? input.whyEmployersWant : existing.whyEmployersWant,
      categoryId,
      skillType: input.skillType ?? existing.skillType,
      difficulty: input.difficulty ?? existing.difficulty,
      importance: input.importance ?? existing.importance,
      marketRelevance: input.marketRelevance ?? existing.marketRelevance,
      status: input.status ?? existing.status,
      updatedAt: new Date(),
    })
    .where(eq(skills.id, id))
    .returning();
  return row;
}

export interface CreateTrackInput {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  icon?: string;
  color?: string;
  ordering?: number;
  difficultyLevels?: string[];
}

export async function createTrack(input: CreateTrackInput) {
  const db = await getDb();
  const existing = await db
    .select({ id: careerTracks.id })
    .from(careerTracks)
    .where(eq(careerTracks.slug, input.slug))
    .limit(1);
  if (existing.length > 0) {
    throw new ApiError("CONFLICT", `A track with slug "${input.slug}" already exists.`);
  }

  const [row] = await db
    .insert(careerTracks)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      category: input.category ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      ordering: input.ordering ?? 0,
      status: "active",
      difficultyLevels: (input.difficultyLevels as ("beginner" | "intermediate" | "advanced")[]) ?? [
        "beginner",
        "intermediate",
        "advanced",
      ],
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function updateTrack(
  id: number,
  input: Partial<Omit<CreateTrackInput, "slug">> & {
    status?: "active" | "inactive" | "archived";
  },
) {
  const db = await getDb();
  const [existing] = await db.select().from(careerTracks).where(eq(careerTracks.id, id)).limit(1);
  if (!existing) throw new ApiError("NOT_FOUND", "Career track not found.");

  const [row] = await db
    .update(careerTracks)
    .set({
      name: input.name ?? existing.name,
      description: input.description !== undefined ? input.description : existing.description,
      category: input.category !== undefined ? input.category : existing.category,
      icon: input.icon !== undefined ? input.icon : existing.icon,
      color: input.color !== undefined ? input.color : existing.color,
      ordering: input.ordering ?? existing.ordering,
      status: input.status ?? existing.status,
      difficultyLevels: input.difficultyLevels
        ? (input.difficultyLevels as ("beginner" | "intermediate" | "advanced")[])
        : existing.difficultyLevels,
      updatedAt: new Date(),
    })
    .where(eq(careerTracks.id, id))
    .returning();
  return row;
}

export async function linkSkillToTrack(
  trackId: number,
  skillId: number,
  input: {
    importance?: "essential" | "important" | "helpful";
    requiredLevel?: SkillLevel;
    categoryLabel?: string;
    ordering?: number;
  } = {},
) {
  const db = await getDb();
  const [skill] = await db.select({ id: skills.id }).from(skills).where(eq(skills.id, skillId)).limit(1);
  if (!skill) throw new ApiError("NOT_FOUND", "Skill not found.");

  let ordering = input.ordering;
  if (ordering === undefined) {
    const [row] = await db
      .select({ next: sql<number>`coalesce(max(${trackSkills.ordering}), -1) + 1` })
      .from(trackSkills)
      .where(eq(trackSkills.trackId, trackId));
    ordering = Number(row?.next ?? 0);
  }

  const [linked] = await db
    .insert(trackSkills)
    .values({
      trackId,
      skillId,
      importance: input.importance ?? "important",
      requiredLevel: input.requiredLevel ?? "intermediate",
      categoryLabel: input.categoryLabel ?? null,
      ordering,
    })
    .onConflictDoUpdate({
      target: [trackSkills.trackId, trackSkills.skillId],
      set: {
        importance: input.importance ?? "important",
        requiredLevel: input.requiredLevel ?? "intermediate",
        categoryLabel: input.categoryLabel ?? null,
        ordering,
      },
    })
    .returning();
  return linked;
}

export async function unlinkSkillFromTrack(trackId: number, skillId: number) {
  const db = await getDb();
  const deleted = await db
    .delete(trackSkills)
    .where(and(eq(trackSkills.trackId, trackId), eq(trackSkills.skillId, skillId)))
    .returning();
  if (deleted.length === 0) throw new ApiError("NOT_FOUND", "Skill is not linked to this track.");
}

export async function createSubSkill(
  skillId: number,
  input: { name: string; slug: string; description?: string },
) {
  const db = await getDb();
  const [skill] = await db.select({ id: skills.id }).from(skills).where(eq(skills.id, skillId)).limit(1);
  if (!skill) throw new ApiError("NOT_FOUND", "Skill not found.");

  const existing = await db
    .select({ id: subSkills.id })
    .from(subSkills)
    .where(and(eq(subSkills.skillId, skillId), eq(subSkills.slug, input.slug)))
    .limit(1);
  if (existing.length > 0) {
    throw new ApiError("CONFLICT", `A sub-skill with slug "${input.slug}" already exists on this skill.`);
  }

  const [row] = await db
    .insert(subSkills)
    .values({
      skillId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      status: "active",
      updatedAt: new Date(),
    })
    .returning();
  return row;
}

export async function createSkillCapability(
  skillId: number,
  input: {
    dimension:
      | "knowledge"
      | "practical_capability"
      | "real_world_task"
      | "reasoning"
      | "communication"
      | "verification";
    title: string;
    description?: string;
    definition?: Record<string, unknown>;
  },
) {
  const db = await getDb();
  const [skill] = await db.select({ id: skills.id }).from(skills).where(eq(skills.id, skillId)).limit(1);
  if (!skill) throw new ApiError("NOT_FOUND", "Skill not found.");

  const [row] = await db
    .insert(skillCapabilities)
    .values({
      skillId,
      dimension: input.dimension,
      title: input.title,
      description: input.description ?? null,
      definition: input.definition ?? null,
      status: "active",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [skillCapabilities.skillId, skillCapabilities.dimension],
      set: {
        title: input.title,
        description: input.description ?? null,
        definition: input.definition ?? null,
        status: "active",
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export async function deleteSubSkill(id: number) {
  const db = await getDb();
  await db.delete(subSkills).where(eq(subSkills.id, id));
}

export async function deleteSkillCapability(id: number) {
  const db = await getDb();
  await db.delete(skillCapabilities).where(eq(skillCapabilities.id, id));
}

export interface CreateAssessmentInput {
  slug: string;
  title: string;
  description?: string;
  skillSlugs?: string[];
  careerSlug?: string;
  assessmentType?:
    | "mcq"
    | "short_answer"
    | "coding"
    | "data_analysis"
    | "case_study"
    | "simulation"
    | "practical_task"
    | "ai_evaluation"
    | "oral_verification";
  difficulty?: "beginner" | "intermediate" | "advanced";
  scoringMethod?: "weighted_rubric" | "deterministic" | "ai_assisted" | "human_review" | "hybrid";
  durationMinutes?: number;
  passingPolicy?: Record<string, unknown>;
  antiCheatConfig?: Record<string, boolean>;
  status?: "draft" | "published" | "archived";
}

/**
 * Create an assessment blueprint (definition + metadata only — sections/items
 * are added by blueprint content tooling or seeds once the content exists).
 */
export async function createAssessment(input: CreateAssessmentInput) {
  const db = await getDb();
  const careerId = input.careerSlug
    ? (
        await db
          .select({ id: careerTracks.id })
          .from(careerTracks)
          .where(eq(careerTracks.slug, input.careerSlug))
          .limit(1)
      )[0]?.id ?? null
    : null;

  const [row] = await db
    .insert(assessmentBlueprints)
    .values({
      slug: input.slug,
      version: 1,
      title: input.title,
      summary: input.description ?? null,
      careerId,
      durationMinutes: input.durationMinutes ?? 120,
      passingPolicy: (input.passingPolicy ?? {
        minOverall: 65,
        minPractical: 60,
        essentialSkillFloor: 55,
        minDefense: 50,
        blockOnIntegrityFlag: true,
      }) as never,
      assessmentType: input.assessmentType ?? "practical_task",
      difficulty: input.difficulty ?? "intermediate",
      scoringMethod: input.scoringMethod ?? "weighted_rubric",
      antiCheatConfig: (input.antiCheatConfig ?? {}) as never,
      status: input.status ?? "draft",
      updatedAt: new Date(),
    })
    .returning();

  if (input.skillSlugs?.length) {
    const found = await db
      .select({ id: skills.id, slug: skills.slug })
      .from(skills)
      .where(inArray(skills.slug, input.skillSlugs));
    for (const skill of found) {
      await db.insert(assessmentBlueprintSkills).values({
        blueprintId: row.id,
        skillId: skill.id,
        weight: 100,
      });
    }
  }

  return row;
}

export async function updateAssessmentStatus(
  id: number,
  status: "draft" | "published" | "archived",
) {
  const db = await getDb();
  const [row] = await db
    .update(assessmentBlueprints)
    .set({ status, updatedAt: new Date() })
    .where(eq(assessmentBlueprints.id, id))
    .returning();
  if (!row) throw new ApiError("NOT_FOUND", "Assessment not found.");
  return row;
}

// ─── Employer search foundation ────────────────────────────────────────────

export interface CandidateSearchFilters {
  trackSlug?: string;
  minScore?: number;
  verifiedOnly?: boolean;
  location?: string;
  experienceMin?: number;
  skills?: { slug: string; minScore: number; minLevel?: SkillLevel }[];
  limit?: number;
}

export interface CandidateSearchResult {
  userId: number;
  name: string;
  location: string | null;
  experienceYears: number;
  targetTrack: string | null;
  skillMatches: {
    slug: string;
    score: number;
    level: SkillLevel;
    verified: boolean;
    meets: boolean;
  }[];
  matchedSkillCount: number;
  requiredSkillCount: number;
  qualified: boolean;
}

/**
 * Foundation for employer search by track / skill / level / minimum score /
 * verification status. Deterministic relationship-based query — no name
 * matching, no opaque AI. Employers filter by what candidates DEMONSTRATED.
 */
export async function searchCandidatesBySkillEvidence(
  filters: CandidateSearchFilters,
): Promise<CandidateSearchResult[]> {
  const db = await getDb();
  const limit = filters.limit ?? 50;
  const requiredSkills = filters.skills ?? [];

  const candidateRows = await db
    .select({
      userId: users.id,
      name: users.name,
      location: users.location,
      experienceYears: users.experienceYears,
      trackSlug: careerTracks.slug,
      slug: skills.slug,
      score: skillScores.score,
      level: skillScores.level,
      verificationStatus: skillScores.verificationStatus,
    })
    .from(skillScores)
    .innerJoin(users, eq(users.id, skillScores.userId))
    .innerJoin(skills, eq(skills.id, skillScores.skillId))
    .leftJoin(trackSkills, eq(trackSkills.skillId, skillScores.skillId))
    .leftJoin(careerTracks, eq(careerTracks.id, trackSkills.trackId))
    .where(
      and(
        filters.verifiedOnly
          ? sql`${skillScores.verificationStatus} <> 'self_reported'`
          : undefined,
        filters.minScore !== undefined
          ? sql`${skillScores.score} >= ${filters.minScore}`
          : undefined,
        filters.experienceMin !== undefined
          ? sql`${users.experienceYears} >= ${filters.experienceMin}`
          : undefined,
        filters.location ? sql`${users.location} ILIKE ${`%${filters.location}%`}` : undefined,
        filters.trackSlug ? eq(careerTracks.slug, filters.trackSlug) : undefined,
      ),
    );

  const grouped = new Map<number, CandidateSearchResult>();
  for (const row of candidateRows) {
    const existing = grouped.get(row.userId);
    const entry: CandidateSearchResult =
      existing ?? {
        userId: row.userId,
        name: row.name,
        location: row.location,
        experienceYears: row.experienceYears ?? 0,
        targetTrack: row.trackSlug ?? null,
        skillMatches: [],
        matchedSkillCount: 0,
        requiredSkillCount: requiredSkills.length,
        qualified: false,
      };
    if (!existing) grouped.set(row.userId, entry);
    const verified = row.verificationStatus !== "self_reported";
    const req = requiredSkills.find((r) => r.slug === row.slug);
    entry.skillMatches.push({
      slug: row.slug,
      score: row.score,
      level: row.level,
      verified,
      meets: req === undefined ? true : row.score >= req.minScore,
    });
  }

  const results: CandidateSearchResult[] = [];
  for (const entry of grouped.values()) {
    const bySlug = new Map(entry.skillMatches.map((m) => [m.slug, m]));
    const matched = requiredSkills.filter((r) => {
      const have = bySlug.get(r.slug);
      if (!have) return false;
      if (have.score < r.minScore) return false;
      if (r.minLevel && LEVEL_RANK[have.level] < LEVEL_RANK[r.minLevel]) return false;
      if (filters.verifiedOnly && !have.verified) return false;
      return true;
    });
    entry.matchedSkillCount = matched.length;
    // "meets" on the displayed rows should reflect the required filter, not any match.
    entry.qualified = requiredSkills.length === 0 || matched.length === requiredSkills.length;
    results.push(entry);
  }

  return results
    .filter((r) => r.qualified)
    .sort(
      (a, b) =>
        b.matchedSkillCount - a.matchedSkillCount || b.skillMatches.length - a.skillMatches.length,
    )
    .slice(0, limit);
}

const LEVEL_RANK: Record<SkillLevel, number> = {
  not_evaluated: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};
