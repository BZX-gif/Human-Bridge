import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { submitAttempt, submitSection } from "@/lib/services/assessment-service";
import { submitAttemptSchema } from "@/lib/validation/assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = submitAttemptSchema.parse(await request.json());

    for (const section of body.sections ?? []) {
      await submitSection(body.attemptId, user.id, section);
    }
    await submitAttempt(body.attemptId, user.id, body.totalTimeSeconds);

    return ok({ attemptId: body.attemptId, status: "submitted" });
  });
}
