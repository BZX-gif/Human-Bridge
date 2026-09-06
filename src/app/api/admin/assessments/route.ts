import { handleRoute, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { createAssessment } from "@/lib/services/taxonomy-service";
import { createAssessmentSchema } from "@/lib/validation/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Create an assessment definition (metadata + skill links; content via blueprint tooling). */
export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireAdmin();
    const body = createAssessmentSchema.parse(await request.json());
    return ok(await createAssessment(body), 201);
  });
}
