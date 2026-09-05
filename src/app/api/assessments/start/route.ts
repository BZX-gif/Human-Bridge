import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { startAttempt } from "@/lib/services/assessment-service";
import { startAttemptSchema } from "@/lib/validation/assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = startAttemptSchema.parse(await request.json());
    const attempt = await startAttempt(user.id, body.blueprint, body.jobId);
    return ok(attempt, attempt.resumed ? 200 : 201);
  });
}
