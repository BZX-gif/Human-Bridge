import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { evaluateAttempt, generateDefense } from "@/lib/services/evaluation-service";
import { evaluateSchema } from "@/lib/validation/assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Server-side evaluation. Runs deterministic grading + rubric evaluation, then
 * prepares the defense round. The client contributes nothing but the attempt id.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = evaluateSchema.parse(await request.json());

    const result = await evaluateAttempt(body.attemptId, user.id);
    const defenseQuestions = await generateDefense(body.attemptId, user.id);

    return ok({ result, defenseQuestions });
  });
}
