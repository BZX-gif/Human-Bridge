import { handleRoute, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { createTrack } from "@/lib/services/taxonomy-service";
import { createTrackSchema } from "@/lib/validation/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireAdmin();
    const body = createTrackSchema.parse(await request.json());
    return ok(await createTrack(body), 201);
  });
}
