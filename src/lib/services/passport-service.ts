import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  assessmentAttempts,
  assessmentBlueprints,
  careers,
  skillEvidence,
  skillPassports,
  skills,
  users,
} from "@/db/schema";
import { ApiError } from "@/lib/api/response";
import { SKILL_LEVEL_LABELS } from "@/lib/assessment/skill-level";
import { getUserSkills, refreshPassport } from "./skill-service";
import { getCareerSkills } from "./career-service";
import { computeSkillGaps } from "./matching-service";
import { toCandidateSkills } from "./job-service";

export interface PassportSkillView {
  slug: string;
  name: string;
  score: number;
  level: string;
  levelKey: string;
  confidence: "low" | "medium" | "high";
  verificationStatus: string;
  evidenceCount: number;
  assessmentCount: number;
  lastVerifiedAt: string | null;
  lastAssessedAt: string | null;
  evidence: { source: string; label: string; detail: string | null; score: number | null; createdAt: string }[];
}

export interface PassportView {
  publicId: string;
  ownerName: string;
  targetRole: string | null;
  readiness: number;
  isPublic: boolean;
  visibility: Record<string, boolean>;
  skills: PassportSkillView[];
  assessments: {
    title: string;
    version: number;
    completedAt: string | null;
    overallScore: number | null;
    readinessScore: number | null;
    passed: boolean | null;
    status: string;
  }[];
  gaps: { name: string; status: string; currentScore: number; requiredScore: number }[];
  /** Nothing here is a claim we cannot back with a row in skill_evidence. */
  evidenceDisclaimer: string;
}

const DISCLAIMER =
  "Every score on this passport is derived from evidence recorded by Human Bridge. Self-reported claims are shown as self-reported and never counted toward a verified level.";

export async function getPassportForUser(userId: number): Promise<PassportView> {
  const db = await getDb();

  let [passport] = await db
    .select()
    .from(skillPassports)
    .where(eq(skillPassports.userId, userId))
    .limit(1);

  if (!passport) {
    await refreshPassport(userId);
    [passport] = await db
      .select()
      .from(skillPassports)
      .where(eq(skillPassports.userId, userId))
      .limit(1);
  }
  if (!passport) throw new ApiError("NOT_FOUND", "Passport not found.");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new ApiError("NOT_FOUND", "User not found.");

  return buildPassport(passport, user, { includeAll: true });
}

/** Public passport — exposes only what the candidate has chosen to expose. */
export async function getPublicPassport(publicId: string): Promise<PassportView> {
  const db = await getDb();
  const [passport] = await db
    .select()
    .from(skillPassports)
    .where(eq(skillPassports.publicId, publicId))
    .limit(1);

  if (!passport || !passport.isPublic) {
    throw new ApiError("NOT_FOUND", "This passport is not available.");
  }

  const [user] = await db.select().from(users).where(eq(users.id, passport.userId)).limit(1);
  if (!user) throw new ApiError("NOT_FOUND", "This passport is not available.");

  return buildPassport(passport, user, { includeAll: false });
}

type PassportRow = typeof skillPassports.$inferSelect;
type UserRow = typeof users.$inferSelect;

async function buildPassport(
  passport: PassportRow,
  user: UserRow,
  options: { includeAll: boolean },
): Promise<PassportView> {
  const db = await getDb();
  const visibility = (passport.visibility as Record<string, boolean>) ?? {
    skills: true,
    evidence: true,
    assessments: true,
    projects: true,
    contact: false,
  };

  const show = (key: string) => options.includeAll || visibility[key] !== false;

  const userSkills = show("skills") ? await getUserSkills(user.id) : [];

  const evidenceRows = show("evidence")
    ? await db
        .select({ evidence: skillEvidence, slug: skills.slug })
        .from(skillEvidence)
        .innerJoin(skills, eq(skills.id, skillEvidence.skillId))
        .where(eq(skillEvidence.userId, user.id))
    : [];

  const skillViews: PassportSkillView[] = userSkills.map((s) => ({
    slug: s.slug,
    name: s.name,
    score: s.score,
    level: SKILL_LEVEL_LABELS[s.level],
    levelKey: s.level,
    confidence: s.confidence,
    verificationStatus: s.verificationStatus,
    evidenceCount: s.evidenceCount,
    assessmentCount: s.assessmentCount,
    lastVerifiedAt: s.lastVerifiedAt?.toISOString() ?? null,
    lastAssessedAt: s.lastAssessedAt?.toISOString() ?? null,
    evidence: evidenceRows
      .filter((e) => e.slug === s.slug)
      .map((e) => ({
        source: e.evidence.source,
        label: e.evidence.label,
        detail: e.evidence.detail,
        score: e.evidence.score,
        createdAt: e.evidence.createdAt.toISOString(),
      })),
  }));

  const attemptRows = show("assessments")
    ? await db
        .select({ attempt: assessmentAttempts, blueprint: assessmentBlueprints })
        .from(assessmentAttempts)
        .innerJoin(
          assessmentBlueprints,
          eq(assessmentBlueprints.id, assessmentAttempts.blueprintId),
        )
        .where(eq(assessmentAttempts.userId, user.id))
    : [];

  let targetRole: string | null = null;
  let gaps: PassportView["gaps"] = [];
  if (passport.careerId) {
    const [career] = await db
      .select()
      .from(careers)
      .where(eq(careers.id, passport.careerId))
      .limit(1);
    targetRole = career?.name ?? null;
    if (career) {
      const required = await getCareerSkills(career.id);
      const candidate = await toCandidateSkills(user.id);
      gaps = computeSkillGaps(required, candidate).map((g) => ({
        name: g.name,
        status: g.status,
        currentScore: g.currentScore,
        requiredScore: g.requiredScore,
      }));
    }
  }

  return {
    publicId: passport.publicId,
    ownerName: user.name,
    targetRole,
    readiness: passport.readiness,
    isPublic: passport.isPublic,
    visibility,
    skills: skillViews,
    assessments: attemptRows
      .filter((r) => r.attempt.status !== "in_progress")
      .map((r) => ({
        title: r.blueprint.title,
        version: r.attempt.blueprintVersion,
        completedAt: r.attempt.completedAt?.toISOString() ?? null,
        overallScore: r.attempt.overallScore,
        readinessScore: r.attempt.readinessScore,
        passed: r.attempt.passed,
        status: r.attempt.status,
      })),
    gaps,
    evidenceDisclaimer: DISCLAIMER,
  };
}

export async function updatePassportPrivacy(
  userId: number,
  input: { isPublic?: boolean; visibility?: Record<string, boolean>; employerVisible?: boolean },
): Promise<void> {
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(skillPassports)
    .where(eq(skillPassports.userId, userId))
    .limit(1);
  if (!existing) throw new ApiError("NOT_FOUND", "Passport not found.");

  await db
    .update(skillPassports)
    .set({
      isPublic: input.isPublic ?? existing.isPublic,
      employerVisible: input.employerVisible ?? existing.employerVisible,
      visibility: input.visibility
        ? { ...(existing.visibility as Record<string, boolean>), ...input.visibility }
        : existing.visibility,
      updatedAt: new Date(),
    })
    .where(eq(skillPassports.userId, userId));
}
