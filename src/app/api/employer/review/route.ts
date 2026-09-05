import { handleRoute, ok } from "@/lib/api/response";
import { requireEmployer } from "@/lib/auth/session";
import { submitHumanReview } from "@/lib/services/evaluation-service";
import { humanReviewSchema } from "@/lib/validation/assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Human-in-the-loop review of an AI or deterministic evaluation. */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const employer = await requireEmployer();
    const body = humanReviewSchema.parse(await request.json());
    await submitHumanReview(body.evaluationId, employer.id, {
      score: body.score,
      notes: body.notes,
    });
    return ok({ reviewed: true });
  });
}
