import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { skillEvidence, skillPassports, skillScores, skills } from "@/db/schema";
import { recordEvent } from "@/lib/events";
import { clampScore } from "@/lib/assessment/rubric-engine";
import { resolveConfidence, resolveSkillLevel } from "@/lib/assessment/skill-level";
import type {
  AttemptResult,
  Confidence,
  EvidenceSource,
  SectionKind,
  SkillLevel,
} from "@/lib/assessment/types";
import { randomBytes } from "node:crypto";

/** Strength ranking used when deciding a skill's verification status. */
const VERIFICATION_RANK: Record<EvidenceSource, number> = {
  SELF_REPORTED: 0,
  ASSESSED: 1,
  PROJECT_VERIFIED: 2,
  EMPLOYER_VERIFIED: 3,
};

const STATUS_BY_SOURCE: Record<
  EvidenceSource,
  "self_reported" | "assessed" | "project_verified" | "employer_verified"
> = {
  SELF_REPORTED: "self_reported",
  ASSESSED: "assessed",
  PROJECT_VERIFIED: "project_verified",
  EMPLOYER_VERIFIED: "employer_verified",
};

async function skillIdBySlug(slug: string): Promise<number | null> {
  const db = await getDb();
  const [row] = await db.select({ id: skills.id }).from(skills).where(eq(skills.slug, slug)).limit(1);
  return row?.id ?? null;
}

/**
 * Write evidence rows for a completed attempt, then recompute the affected
 * skill scores from ALL evidence the user has (not just this attempt).
 */
export async function applyAttemptEvidence(
  userId: number,
  attemptId: number,
  assessmentTitle: string,
  result: AttemptResult,
): Promise<void> {
  const db = await getDb();

  // Clear this attempt's previous evidence so re-evaluation does not double count.
  await db.delete(skillEvidence).where(eq(skillEvidence.attemptId, attemptId));

  const touchedSkillIds: number[] = [];

  for (const skill of result.skillScores) {
    const skillId = await skillIdBySlug(skill.skillSlug);
    if (skillId === null) continue;
    touchedSkillIds.push(skillId);

    for (const entry of skill.breakdown) {
      await db.insert(skillEvidence).values({
        userId,
        skillId,
        source: "ASSESSED",
        label: `${assessmentTitle} — ${sectionKindLabel(entry.sectionKind)}`,
        detail: `Scored ${entry.score} on the ${entry.sectionKey} section.`,
        score: entry.score,
        weight: entry.weight,
        attemptId,
      });
    }
  }

  await recomputeSkillScores(userId, Array.from(new Set(touchedSkillIds)));
  await refreshPassport(userId);

  await recordEvent({
    type: "skill.verified",
    userId,
    attemptId,
    payload: { skills: result.skillScores.map((s) => ({ slug: s.skillSlug, score: s.score })) },
  });
}

function sectionKindLabel(kind: SectionKind): string {
  const labels: Record<SectionKind, string> = {
    knowledge: "Knowledge check",
    investigation: "Data investigation",
    practical: "Practical work",
    reasoning: "Business reasoning",
    defense: "Defense round",
  };
  return labels[kind];
}

/** Add a manual/self-reported or externally verified piece of evidence. */
export async function addEvidence(input: {
  userId: number;
  skillSlug: string;
  source: EvidenceSource;
  label: string;
  detail?: string;
  score?: number;
  weight?: number;
  projectId?: number;
  jobId?: number;
  verifiedByUserId?: number;
}): Promise<void> {
  const db = await getDb();
  const skillId = await skillIdBySlug(input.skillSlug);
  if (skillId === null) return;

  await db.insert(skillEvidence).values({
    userId: input.userId,
    skillId,
    source: input.source,
    label: input.label,
    detail: input.detail,
    score: input.score ?? null,
    weight: input.weight ?? 100,
    projectId: input.projectId ?? null,
    jobId: input.jobId ?? null,
    verifiedByUserId: input.verifiedByUserId ?? null,
  });

  await recomputeSkillScores(input.userId, [skillId]);
  await refreshPassport(input.userId);
}

/**
 * Recompute a user's skill scores from their evidence ledger.
 *
 * Self-reported evidence NEVER contributes to the numeric score — a resume
 * claiming "Expert SQL" cannot become a verified level. It is recorded so the
 * passport can show the claim, marked as self-reported.
 */
export async function recomputeSkillScores(
  userId: number,
  skillIds?: number[],
): Promise<void> {
  const db = await getDb();

  const evidenceRows = await db
    .select()
    .from(skillEvidence)
    .where(
      skillIds && skillIds.length > 0
        ? and(eq(skillEvidence.userId, userId), inArray(skillEvidence.skillId, skillIds))
        : eq(skillEvidence.userId, userId),
    );

  const bySkill = new Map<number, typeof evidenceRows>();
  for (const row of evidenceRows) {
    const list = bySkill.get(row.skillId) ?? [];
    list.push(row);
    bySkill.set(row.skillId, list);
  }

  for (const [skillId, rows] of bySkill) {
    const scoring = rows.filter((r) => r.source !== "SELF_REPORTED" && r.score !== null);

    let score = 0;
    let level: SkillLevel = "not_evaluated";
    let confidence: Confidence = "low";

    if (scoring.length > 0) {
      const totalWeight = scoring.reduce((sum, r) => sum + r.weight, 0);
      score = clampScore(
        scoring.reduce((sum, r) => sum + (r.score ?? 0) * r.weight, 0) / (totalWeight || 1),
      );
      const kinds = inferEvidenceKinds(scoring.map((r) => r.label));
      level = resolveSkillLevel(score, kinds);
      confidence = resolveConfidence(kinds, scoring.length);
    }

    const strongest = rows.reduce<EvidenceSource>(
      (best, r) =>
        VERIFICATION_RANK[r.source as EvidenceSource] > VERIFICATION_RANK[best]
          ? (r.source as EvidenceSource)
          : best,
      "SELF_REPORTED",
    );

    const assessedRows = rows.filter((r) => r.source === "ASSESSED");
    const lastVerified = scoring.length
      ? scoring.reduce(
          (latest, r) => (r.createdAt > latest ? r.createdAt : latest),
          scoring[0].createdAt,
        )
      : null;
    const lastAssessedAt = assessedRows.length
      ? assessedRows.reduce(
          (latest, r) => (r.createdAt > latest ? r.createdAt : latest),
          assessedRows[0].createdAt,
        )
      : null;

    const evidenceBreakdown = rows.map((r) => ({
      source: r.source,
      label: r.label,
      score: r.score,
      weight: r.weight,
      attemptId: r.attemptId,
      projectId: r.projectId,
      jobId: r.jobId,
      createdAt: r.createdAt,
    }));

    await db
      .insert(skillScores)
      .values({
        userId,
        skillId,
        score,
        level,
        confidence,
        evidenceCount: rows.length,
        assessmentCount: assessedRows.length,
        verificationStatus: STATUS_BY_SOURCE[strongest],
        breakdown: evidenceBreakdown,
        lastVerifiedAt: lastVerified,
        lastAssessedAt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [skillScores.userId, skillScores.skillId],
        set: {
          score,
          level,
          confidence,
          evidenceCount: rows.length,
          assessmentCount: assessedRows.length,
          verificationStatus: STATUS_BY_SOURCE[strongest],
          breakdown: evidenceBreakdown,
          lastVerifiedAt: lastVerified,
          lastAssessedAt,
          updatedAt: new Date(),
        },
      });
  }
}

function inferEvidenceKinds(labels: string[]): SectionKind[] {
  const kinds = new Set<SectionKind>();
  for (const label of labels) {
    const lower = label.toLowerCase();
    if (lower.includes("knowledge")) kinds.add("knowledge");
    if (lower.includes("investigation")) kinds.add("investigation");
    if (lower.includes("practical") || lower.includes("project")) kinds.add("practical");
    if (lower.includes("reasoning")) kinds.add("reasoning");
    if (lower.includes("defense")) kinds.add("defense");
  }
  return Array.from(kinds);
}

export interface UserSkillView {
  skillId: number;
  slug: string;
  name: string;
  score: number;
  level: SkillLevel;
  confidence: Confidence;
  evidenceCount: number;
  assessmentCount: number;
  verificationStatus: "self_reported" | "assessed" | "project_verified" | "employer_verified";
  lastVerifiedAt: Date | null;
  lastAssessedAt: Date | null;
}

export async function getUserSkills(userId: number): Promise<UserSkillView[]> {
  const db = await getDb();
  const rows = await db
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
    .where(eq(skillScores.userId, userId));

  return rows.sort((a, b) => b.score - a.score);
}

export async function getSkillEvidence(userId: number, skillId: number) {
  const db = await getDb();
  return db
    .select()
    .from(skillEvidence)
    .where(and(eq(skillEvidence.userId, userId), eq(skillEvidence.skillId, skillId)));
}

/** Ensure a passport row exists and refresh its readiness figure. */
export async function refreshPassport(userId: number): Promise<void> {
  const db = await getDb();
  const { users, careerSkills } = await import("@/db/schema");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return;

  const userSkills = await getUserSkills(userId);
  const skillBySlug = new Map(userSkills.map((s) => [s.slug, s]));

  let readiness = 0;
  if (user.targetCareerId) {
    const required = await db
      .select({
        slug: skills.slug,
        importance: careerSkills.importance,
        requiredScore: careerSkills.requiredScore,
      })
      .from(careerSkills)
      .innerJoin(skills, eq(skills.id, careerSkills.skillId))
      .where(eq(careerSkills.careerId, user.targetCareerId));

    readiness = computeCareerReadiness(required, skillBySlug);
  } else if (userSkills.length > 0) {
    readiness = clampScore(
      userSkills.reduce((sum, s) => sum + s.score, 0) / userSkills.length,
    );
  }

  const [existing] = await db
    .select()
    .from(skillPassports)
    .where(eq(skillPassports.userId, userId))
    .limit(1);

  if (existing) {
    await db
      .update(skillPassports)
      .set({ readiness, careerId: user.targetCareerId, updatedAt: new Date() })
      .where(eq(skillPassports.userId, userId));
  } else {
    await db.insert(skillPassports).values({
      userId,
      publicId: randomBytes(9).toString("base64url"),
      careerId: user.targetCareerId,
      readiness,
      isPublic: false,
      visibility: { skills: true, evidence: true, assessments: true, projects: true, contact: false },
    });
  }

  await recordEvent({ type: "passport.updated", userId, payload: { readiness } });
}

const IMPORTANCE_WEIGHT: Record<"essential" | "important" | "helpful", number> = {
  essential: 3,
  important: 2,
  helpful: 1,
};

export function computeCareerReadiness(
  required: { slug: string; importance: "essential" | "important" | "helpful"; requiredScore: number }[],
  userSkills: Map<string, { score: number }>,
): number {
  if (required.length === 0) return 0;
  let total = 0;
  let weightSum = 0;
  for (const req of required) {
    const weight = IMPORTANCE_WEIGHT[req.importance];
    const have = userSkills.get(req.slug)?.score ?? 0;
    const ratio = req.requiredScore === 0 ? 1 : Math.min(1, have / req.requiredScore);
    total += ratio * weight;
    weightSum += weight;
  }
  return clampScore((total / weightSum) * 100);
}
