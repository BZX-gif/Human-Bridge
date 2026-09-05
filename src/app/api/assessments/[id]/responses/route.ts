import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { saveResponses } from "@/lib/services/assessment-service";
import { saveResponsesSchema } from "@/lib/validation/assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Autosave answers. The body cannot contain a score — see the schema. */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = saveResponsesSchema.parse(await request.json());
    const result = await saveResponses(
      body.attemptId,
      user.id,
      body.sectionKey,
      body.responses,
    );
    return ok(result);
  });
}
