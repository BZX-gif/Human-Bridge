import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { listUserAttempts } from "@/lib/services/assessment-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The candidate's assessment attempt history with results (score, readiness, pass). */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    const attempts = await listUserAttempts(user.id);
    return ok({
      attempts: attempts.map(({ attempt, blueprint }) => ({
        attemptId: attempt.id,
        blueprintSlug: blueprint.slug,
        blueprintTitle: blueprint.title,
        blueprintVersion: attempt.blueprintVersion,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        completedAt: attempt.completedAt,
        overallScore: attempt.overallScore,
        readinessScore: attempt.readinessScore,
        passed: attempt.passed,
        integrityStatus: attempt.integrityStatus,
        evaluatorType: attempt.evaluatorType,
      })),
    });
  });
}
