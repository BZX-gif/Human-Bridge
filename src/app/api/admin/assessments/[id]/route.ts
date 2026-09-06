import { handleRoute, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { updateAssessmentStatus } from "@/lib/services/taxonomy-service";
import { updateAssessmentStatusSchema } from "@/lib/validation/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Manage assessment status (draft / published / archived). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = updateAssessmentStatusSchema.parse(await request.json());
    return ok(await updateAssessmentStatus(Number(id), body.status));
  });
}
