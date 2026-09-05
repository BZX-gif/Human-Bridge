import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  assessmentBlueprints,
  careerSkills,
  careers,
  learningResources,
  skills,
} from "@/db/schema";
import { ApiError } from "@/lib/api/response";
import {
  computeSkillGaps,
  type RequiredSkill,
  type SkillGapItem,
} from "./matching-service";
import { toCandidateSkills } from "./job-service";

export async function listCareers() {
  const db = await getDb();
  return db.select().from(careers).orderBy(careers.name);
}

export async function getCareerSkills(careerId: number): Promise<RequiredSkill[]> {
  const db = await getDb();
  const rows = await db
    .select({
      slug: skills.slug,
      name: skills.name,
      description: skills.description,
      importance: careerSkills.importance,
      requiredLevel: careerSkills.requiredLevel,
      requiredScore: careerSkills.requiredScore,
      order: careerSkills.order,
    })
    .from(careerSkills)
    .innerJoin(skills, eq(skills.id, careerSkills.skillId))
    .where(eq(careerSkills.careerId, careerId))
    .orderBy(careerSkills.order);
  return rows;
}

export async function getCareerBySlug(slug: string) {
  const db = await getDb();
  const [career] = await db.select().from(careers).where(eq(careers.slug, slug)).limit(1);
  if (!career) throw new ApiError("NOT_FOUND", "Career not found.");

  const requiredSkills = await getCareerSkills(career.id);

  const [blueprint] = await db
    .select({
      slug: assessmentBlueprints.slug,
      title: assessmentBlueprints.title,
      summary: assessmentBlueprints.summary,
      durationMinutes: assessmentBlueprints.durationMinutes,
      version: assessmentBlueprints.version,
    })
    .from(assessmentBlueprints)
    .where(eq(assessmentBlueprints.careerId, career.id))
    .orderBy(desc(assessmentBlueprints.version))
    .limit(1);

  return { career, requiredSkills, blueprint: blueprint ?? null };
}

export async function getCareerGapForUser(
  careerId: number,
  userId: number,
): Promise<SkillGapItem[]> {
  const required = await getCareerSkills(careerId);
  const candidate = await toCandidateSkills(userId);
  return computeSkillGaps(required, candidate);
}

export interface LearningRecommendation {
  skillSlug: string;
  skillName: string;
  status: SkillGapItem["status"];
  deficit: number;
  whatToLearn: string;
  resources: {
    title: string;
    type: string | null;
    provider: string | null;
    url: string | null;
    duration: string | null;
    free: boolean;
    isDemo: boolean;
  }[];
}

/**
 * Learning is driven by measured gaps, not by a catalogue. We only recommend
 * for skills where the candidate actually falls short of the role requirement.
 */
export async function getLearningPath(
  careerId: number,
  userId: number,
): Promise<LearningRecommendation[]> {
  const db = await getDb();
  const gaps = (await getCareerGapForUser(careerId, userId)).filter(
    (g) => g.status !== "ready",
  );
  if (gaps.length === 0) return [];

  const allSkills = await db.select().from(skills);
  const skillBySlug = new Map(allSkills.map((s) => [s.slug, s]));

  const resources = await db.select().from(learningResources);

  return gaps.map((gap) => {
    const skill = skillBySlug.get(gap.slug);
    const matching = resources.filter((r) => r.skillId === skill?.id);
    return {
      skillSlug: gap.slug,
      skillName: gap.name,
      status: gap.status,
      deficit: gap.deficit,
      whatToLearn:
        gap.status === "not_started"
          ? `Start from the fundamentals of ${gap.name}. You need to reach ${gap.requiredScore} for this role.`
          : `Close a ${gap.deficit}-point gap in ${gap.name} to reach the ${gap.requiredScore} this role requires.`,
      resources: matching.map((r) => ({
        title: r.title,
        type: r.type,
        provider: r.provider,
        url: r.url,
        duration: r.duration,
        free: r.free,
        isDemo: r.isDemo,
      })),
    };
  });
}
