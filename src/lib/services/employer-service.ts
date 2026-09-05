import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  applications,
  companies,
  jobSkills,
  jobs,
  skillPassports,
  skills,
  users,
} from "@/db/schema";
import { ApiError } from "@/lib/api/response";
import { recordEvent } from "@/lib/events";
import { SKILL_LEVEL_LABELS } from "@/lib/assessment/skill-level";
import { getJobSkills } from "./job-service";
import { getUserSkills } from "./skill-service";
import { matchCandidateToRequirements, type MatchResult } from "./matching-service";

/** Assert this employer owns the job. Prevents cross-company data access. */
export async function assertJobOwnership(jobId: number, companyId: number) {
  const db = await getDb();
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) throw new ApiError("NOT_FOUND", "Job not found.");
  if (job.companyId !== companyId) {
    // Do not confirm the job exists for another company.
    throw new ApiError("NOT_FOUND", "Job not found.");
  }
  return job;
}

export interface CreateJobInput {
  title: string;
  description?: string;
  responsibilities?: string[];
  location?: string;
  workType: "remote" | "hybrid" | "onsite";
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  careerId?: number;
  requireHumanReview?: boolean;
  status?: "draft" | "active";
  skills: {
    slug: string;
    importance: "essential" | "important" | "helpful";
    requiredLevel: "beginner" | "intermediate" | "advanced" | "expert";
    requiredScore: number;
  }[];
}

export async function createJob(
  companyId: number,
  userId: number,
  input: CreateJobInput,
): Promise<{ jobId: number }> {
  const db = await getDb();

  const [job] = await db
    .insert(jobs)
    .values({
      title: input.title,
      companyId,
      careerId: input.careerId ?? null,
      createdByUserId: userId,
      description: input.description ?? null,
      responsibilities: input.responsibilities ?? [],
      location: input.location ?? null,
      workType: input.workType,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      experienceMin: input.experienceMin ?? 0,
      experienceMax: input.experienceMax ?? null,
      requireHumanReview: input.requireHumanReview ?? false,
      status: input.status ?? "active",
      isDemo: false,
    })
    .returning();

  await attachJobSkills(job.id, input.skills);
  await recordEvent({ type: "job.created", userId, jobId: job.id, payload: { title: input.title } });
  return { jobId: job.id };
}

export async function attachJobSkills(
  jobId: number,
  requirements: CreateJobInput["skills"],
): Promise<void> {
  const db = await getDb();
  if (requirements.length === 0) return;

  const slugs = requirements.map((r) => r.slug);
  const skillRows = await db.select().from(skills).where(inArray(skills.slug, slugs));
  const idBySlug = new Map(skillRows.map((s) => [s.slug, s.id]));

  for (const req of requirements) {
    const skillId = idBySlug.get(req.slug);
    if (!skillId) continue;
    await db
      .insert(jobSkills)
      .values({
        jobId,
        skillId,
        importance: req.importance,
        requiredLevel: req.requiredLevel,
        requiredScore: Math.max(0, Math.min(100, req.requiredScore)),
      })
      .onConflictDoUpdate({
        target: [jobSkills.jobId, jobSkills.skillId],
        set: {
          importance: req.importance,
          requiredLevel: req.requiredLevel,
          requiredScore: Math.max(0, Math.min(100, req.requiredScore)),
        },
      });
  }
}

export async function updateJobSkills(
  jobId: number,
  companyId: number,
  requirements: CreateJobInput["skills"],
): Promise<void> {
  const db = await getDb();
  await assertJobOwnership(jobId, companyId);
  await db.delete(jobSkills).where(eq(jobSkills.jobId, jobId));
  await attachJobSkills(jobId, requirements);
}

export async function listCompanyJobs(companyId: number) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.companyId, companyId))
    .orderBy(desc(jobs.postedAt));
  const skillMap = await getJobSkills(rows.map((r) => r.id));
  return rows.map((job) => ({ ...job, requiredSkills: skillMap.get(job.id) ?? [] }));
}

export interface CandidateCard {
  applicationId: number;
  userId: number;
  name: string;
  status: string;
  appliedAt: string;
  readiness: number;
  match: MatchResult;
  skills: {
    slug: string;
    name: string;
    score: number;
    level: string;
    confidence: string;
    verificationStatus: string;
    evidenceCount: number;
  }[];
  evidenceSummary: string[];
}

/**
 * Employer candidate view.
 *
 * Only candidates who have applied to THIS employer's job are visible, and only
 * skill/evidence data — never private contact details or unrelated attempts.
 */
export async function listJobCandidates(
  jobId: number,
  companyId: number,
): Promise<CandidateCard[]> {
  const db = await getDb();
  await assertJobOwnership(jobId, companyId);

  const rows = await db
    .select({ application: applications, user: users })
    .from(applications)
    .innerJoin(users, eq(users.id, applications.userId))
    .where(eq(applications.jobId, jobId))
    .orderBy(desc(applications.matchScore));

  const skillMap = await getJobSkills([jobId]);
  const required = skillMap.get(jobId) ?? [];

  const cards: CandidateCard[] = [];
  for (const row of rows) {
    const [passport] = await db
      .select()
      .from(skillPassports)
      .where(eq(skillPassports.userId, row.user.id))
      .limit(1);

    // Respect the candidate's employer-visibility control.
    if (passport && !passport.employerVisible) continue;

    const userSkills = await getUserSkills(row.user.id);
    const match = matchCandidateToRequirements(
      required,
      userSkills.map((s) => ({
        slug: s.slug,
        name: s.name,
        score: s.score,
        level: s.level,
        confidence: s.confidence,
        verificationStatus: s.verificationStatus,
      })),
    );

    const evidenceSummary = Array.from(
      new Set(
        userSkills.flatMap((s) =>
          s.verificationStatus === "self_reported" ? [] : [verificationLabel(s.verificationStatus)],
        ),
      ),
    );

    cards.push({
      applicationId: row.application.id,
      userId: row.user.id,
      name: row.user.name,
      status: row.application.status,
      appliedAt: row.application.appliedAt.toISOString(),
      readiness: passport?.readiness ?? 0,
      match,
      skills: userSkills
        .filter((s) => required.some((r) => r.slug === s.slug))
        .map((s) => ({
          slug: s.slug,
          name: s.name,
          score: s.score,
          level: SKILL_LEVEL_LABELS[s.level],
          confidence: s.confidence,
          verificationStatus: s.verificationStatus,
          evidenceCount: s.evidenceCount,
        })),
      evidenceSummary,
    });
  }

  return cards.sort((a, b) => b.match.score - a.match.score);
}

function verificationLabel(status: string): string {
  const labels: Record<string, string> = {
    assessed: "Assessment evidence",
    project_verified: "Project evidence",
    employer_verified: "Employer-verified evidence",
  };
  return labels[status] ?? status;
}

export async function updateApplicationStatus(
  applicationId: number,
  companyId: number,
  status: "reviewing" | "shortlisted" | "interviewing" | "offered" | "hired" | "rejected",
  notes?: string,
): Promise<void> {
  const db = await getDb();
  const [row] = await db
    .select({ application: applications, job: jobs })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!row || row.job.companyId !== companyId) {
    throw new ApiError("NOT_FOUND", "Application not found.");
  }

  await db
    .update(applications)
    .set({ status, employerNotes: notes ?? row.application.employerNotes, updatedAt: new Date() })
    .where(eq(applications.id, applicationId));

  if (status === "shortlisted" || status === "hired") {
    await recordEvent({
      type: status === "hired" ? "candidate.hired" : "candidate.shortlisted",
      userId: row.application.userId,
      jobId: row.job.id,
    });
  }
}

export async function getCompanyForUser(userId: number) {
  const db = await getDb();
  const [row] = await db
    .select({ company: companies })
    .from(users)
    .innerJoin(companies, eq(companies.id, users.companyId))
    .where(eq(users.id, userId))
    .limit(1);
  return row?.company ?? null;
}

/** Compare a set of candidates on the same job's requirements. */
export async function compareCandidates(
  jobId: number,
  companyId: number,
  userIds: number[],
): Promise<{ required: string[]; candidates: CandidateCard[] }> {
  const all = await listJobCandidates(jobId, companyId);
  const filtered = userIds.length > 0 ? all.filter((c) => userIds.includes(c.userId)) : all;
  const skillMap = await getJobSkills([jobId]);
  return {
    required: (skillMap.get(jobId) ?? []).map((r) => r.name),
    candidates: filtered,
  };
}

export async function findApplicationsForCompany(companyId: number) {
  const db = await getDb();
  return db
    .select({ application: applications, job: jobs, user: users })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .innerJoin(users, eq(users.id, applications.userId))
    .where(eq(jobs.companyId, companyId))
    .orderBy(desc(applications.appliedAt));
}
