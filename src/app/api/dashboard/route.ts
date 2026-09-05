import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { careers, users } from "@/db/schema";
import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { getCareerGapForUser, getLearningPath } from "@/lib/services/career-service";
import { listJobsWithMatch, listUserApplications } from "@/lib/services/job-service";
import { getUserSkills } from "@/lib/services/skill-service";
import { getPassportForUser } from "@/lib/services/passport-service";
import { listUserAttempts } from "@/lib/services/assessment-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const sessionUser = await requireUser();
    const db = await getDb();

    const [user] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
    const passport = await getPassportForUser(sessionUser.id);
    const userSkills = await getUserSkills(sessionUser.id);
    const applications = await listUserApplications(sessionUser.id);
    const attempts = await listUserAttempts(sessionUser.id);

    let targetCareer = null;
    let gaps: Awaited<ReturnType<typeof getCareerGapForUser>> = [];
    let learning: Awaited<ReturnType<typeof getLearningPath>> = [];
    if (user?.targetCareerId) {
      const [career] = await db
        .select()
        .from(careers)
        .where(eq(careers.id, user.targetCareerId))
        .limit(1);
      targetCareer = career ?? null;
      gaps = await getCareerGapForUser(user.targetCareerId, sessionUser.id);
      learning = await getLearningPath(user.targetCareerId, sessionUser.id);
    }

    const jobs = await listJobsWithMatch(sessionUser.id);
    const recommendedJobs = jobs.filter((j) => (j.match?.score ?? 0) >= 40);

    return ok({
      user: { name: sessionUser.name, onboardingComplete: sessionUser.onboardingComplete },
      targetCareer,
      readiness: passport.readiness,
      verifiedSkillCount: userSkills.filter(
        (s) => s.verificationStatus !== "self_reported" && s.score > 0,
      ).length,
      skillGapCount: gaps.filter((g) => g.status !== "ready").length,
      gaps: gaps.slice(0, 6),
      learningCount: learning.length,
      recommendedJobCount: recommendedJobs.length,
      recommendedJobs: recommendedJobs.slice(0, 4),
      applicationCount: applications.length,
      attempts: attempts.map((a) => ({
        id: a.attempt.id,
        title: a.blueprint.title,
        slug: a.blueprint.slug,
        status: a.attempt.status,
        readinessScore: a.attempt.readinessScore,
        startedAt: a.attempt.startedAt,
      })),
    });
  });
}
