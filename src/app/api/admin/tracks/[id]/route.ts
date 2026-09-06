import { handleRoute, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { updateTrack } from "@/lib/services/taxonomy-service";
import { updateTrackSchema } from "@/lib/validation/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = updateTrackSchema.parse(await request.json());
    return ok(await updateTrack(Number(id), body));
  });
}
