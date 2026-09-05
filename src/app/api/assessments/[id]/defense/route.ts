import { ApiError, handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import {
  answerDefense,
  evaluateAttempt,
  generateDefense,
} from "@/lib/services/evaluation-service";
import { getOwnedAttempt } from "@/lib/services/assessment-service";
import { defenseAnswerSchema } from "@/lib/validation/assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Fetch the defense questions for an attempt. */
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
    const questions = await generateDefense(attemptId, user.id);
    return ok({ questions });
  });
}

/**
 * Answer a defense question. When the final question is answered the attempt is
 * re-evaluated so the defense score folds into the final result.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = defenseAnswerSchema.parse(await request.json());

    const outcome = await answerDefense(body.attemptId, user.id, {
      questionId: body.questionId,
      answer: body.answer,
      timeSpentSeconds: body.timeSpentSeconds,
    });

    if (outcome.remaining === 0) {
      const result = await evaluateAttempt(body.attemptId, user.id);
      const attempt = await getOwnedAttempt(body.attemptId, user.id);
      return ok({ remaining: 0, complete: true, status: attempt.status, result });
    }

    return ok({ remaining: outcome.remaining, complete: false });
  });
}
