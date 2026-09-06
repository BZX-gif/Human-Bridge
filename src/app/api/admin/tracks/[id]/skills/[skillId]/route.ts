import { handleRoute, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { unlinkSkillFromTrack } from "@/lib/services/taxonomy-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; skillId: string }> },
) {
  return handleRoute(async () => {
    await requireAdmin();
    const { id, skillId } = await params;
    await unlinkSkillFromTrack(Number(id), Number(skillId));
    return ok({ unlinked: true });
  });
}
