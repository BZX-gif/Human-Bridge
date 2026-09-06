import { handleRoute, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { deleteSubSkill } from "@/lib/services/taxonomy-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    await deleteSubSkill(Number(id));
    return ok({ deleted: true });
  });
}
