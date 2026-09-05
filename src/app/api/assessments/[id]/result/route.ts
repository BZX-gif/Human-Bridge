import { ApiError, handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { getBlueprint, getOwnedAttempt } from "@/lib/services/assessment-service";
import { getAttemptEvaluations } from "@/lib/services/evaluation-service";
import { isAiConfigured } from "@/lib/ai";
import type { AttemptResult } from "@/lib/assessment/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A user can only ever read their own attempt result. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const attemptId = Number(id);
    if (!Number.isInteger(attemptId)) {
      throw new ApiError("VALIDATION_ERROR", "Invalid attempt id.");
    }

    const attempt = await getOwnedAttempt(attemptId, user.id);
    const blueprint = await getBlueprint(String(attempt.blueprintId));
    const evaluations = await getAttemptEvaluations(attemptId);

    return ok({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        attemptNumber: attempt.attemptNumber,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        completedAt: attempt.completedAt,
        timeSpentSeconds: attempt.timeSpentSeconds,
        overallScore: attempt.overallScore,
        readinessScore: attempt.readinessScore,
        passed: attempt.passed,
        integrityStatus: attempt.integrityStatus,
        integritySignals: attempt.integritySignals,
        evaluatorType: attempt.evaluatorType,
      },
      blueprint: {
        title: blueprint.title,
        version: attempt.blueprintVersion,
        targetRole: blueprint.targetRole,
        passingPolicy: blueprint.passingPolicy,
      },
      result: (attempt.resultSummary as AttemptResult | null) ?? null,
      evaluations: evaluations.map((e) => ({
        sectionId: e.sectionId,
        evaluatorType: e.evaluatorType,
        status: e.status,
        score: e.score,
        confidence: e.confidence,
        rubricScores: e.rubricScores,
        evidence: e.evidence,
        gaps: e.gaps,
        feedback: e.feedback,
        unavailableReason: e.unavailableReason,
        humanReviewRequired: e.humanReviewRequired,
      })),
      aiEvaluationAvailable: isAiConfigured(),
    });
  });
}
