import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, companies, jobSkills, jobs, skills } from "@/db/schema";
import { ApiError } from "@/lib/api/response";
import { recordEvent } from "@/lib/events";
import {
  matchCandidateToRequirements,
  type CandidateSkill,
  type MatchResult,
  type RequiredSkill,
} from "./matching-service";
import { getUserSkills } from "./skill-service";

export interface JobSummary {
  id: number;
  title: string;
  companyName: string;
  companyInitials: string | null;
  companyColor: string | null;
  location: string | null;
  workType: "remote" | "hybrid" | "onsite";
  salaryMin: number | null;
  salaryMax: number | null;
  salaryUnit: string | null;
  experienceMin: number;
  experienceMax: number | null;
  postedAt: Date;
  isDemo: boolean;
  requiredSkills: RequiredSkill[];
}

export async function listJobs(): Promise<JobSummary[]> {
  const db = await getDb();
  const rows = await db
    .select({ job: jobs, company: companies })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(eq(jobs.status, "active"))
    .orderBy(desc(jobs.postedAt));

  if (rows.length === 0) return [];
  const skillRows = await getJobSkills(rows.map((r) => r.job.id));

  return rows.map((row) => ({
    id: row.job.id,
    title: row.job.title,
    companyName: row.company.name,
    companyInitials: row.company.logoInitials,
    companyColor: row.company.logoColor,
    location: row.job.location,
    workType: row.job.workType,
    salaryMin: row.job.salaryMin,
    salaryMax: row.job.salaryMax,
    salaryUnit: row.job.salaryUnit,
    experienceMin: row.job.experienceMin ?? 0,
    experienceMax: row.job.experienceMax,
    postedAt: row.job.postedAt,
    isDemo: row.job.isDemo,
    requiredSkills: skillRows.get(row.job.id) ?? [],
  }));
}

export async function getJobSkills(jobIds: number[]): Promise<Map<number, RequiredSkill[]>> {
  const db = await getDb();
  const map = new Map<number, RequiredSkill[]>();
  if (jobIds.length === 0) return map;

  const rows = await db
    .select({
      jobId: jobSkills.jobId,
      slug: skills.slug,
      name: skills.name,
      importance: jobSkills.importance,
      requiredLevel: jobSkills.requiredLevel,
      requiredScore: jobSkills.requiredScore,
    })
    .from(jobSkills)
    .innerJoin(skills, eq(skills.id, jobSkills.skillId))
    .where(inArray(jobSkills.jobId, jobIds));

  for (const row of rows) {
    const list = map.get(row.jobId) ?? [];
    list.push({
      slug: row.slug,
      name: row.name,
      importance: row.importance,
      requiredLevel: row.requiredLevel,
      requiredScore: row.requiredScore,
    });
    map.set(row.jobId, list);
  }
  return map;
}

export async function getJob(jobId: number) {
  const db = await getDb();
  const [row] = await db
    .select({ job: jobs, company: companies })
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(eq(jobs.id, jobId))
    .limit(1);
  if (!row) throw new ApiError("NOT_FOUND", "Job not found.");
  const skillMap = await getJobSkills([jobId]);
  return { ...row, requiredSkills: skillMap.get(jobId) ?? [] };
}

export async function toCandidateSkills(userId: number): Promise<CandidateSkill[]> {
  const userSkills = await getUserSkills(userId);
  return userSkills.map((s) => ({
    slug: s.slug,
    name: s.name,
    score: s.score,
    level: s.level,
    confidence: s.confidence,
    verificationStatus: s.verificationStatus,
  }));
}

export interface JobWithMatch extends JobSummary {
  match: MatchResult | null;
}

export async function listJobsWithMatch(userId: number | null): Promise<JobWithMatch[]> {
  const jobList = await listJobs();
  if (userId === null) return jobList.map((job) => ({ ...job, match: null }));

  const candidate = await toCandidateSkills(userId);
  return jobList
    .map((job) => ({
      ...job,
      match: matchCandidateToRequirements(job.requiredSkills, candidate),
    }))
    .sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0));
}

export async function applyToJob(
  userId: number,
  jobId: number,
  coverNote?: string,
): Promise<{ applicationId: number; matchScore: number }> {
  const db = await getDb();
  const job = await getJob(jobId);
  const candidate = await toCandidateSkills(userId);
  const match = matchCandidateToRequirements(job.requiredSkills, candidate);

  const existing = await db
    .select()
    .from(applications)
    .where(and(eq(applications.userId, userId), eq(applications.jobId, jobId)))
    .limit(1);
  if (existing.length > 0) {
    throw new ApiError("CONFLICT", "You have already applied to this job.");
  }

  const [created] = await db
    .insert(applications)
    .values({
      userId,
      jobId,
      matchScore: match.score,
      matchExplanation: match,
      coverNote: coverNote ?? null,
    })
    .returning();

  await recordEvent({
    type: "job.applied",
    userId,
    jobId,
    payload: { matchScore: match.score, eligible: match.eligible },
  });

  return { applicationId: created.id, matchScore: match.score };
}

export async function listUserApplications(userId: number) {
  const db = await getDb();
  return db
    .select({ application: applications, job: jobs, company: companies })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.appliedAt));
}
