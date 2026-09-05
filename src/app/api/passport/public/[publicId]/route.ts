import { handleRoute, ok } from "@/lib/api/response";
import { getPublicPassport } from "@/lib/services/passport-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public, unauthenticated. Only returns data the candidate chose to expose. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  return handleRoute(async () => {
    const { publicId } = await params;
    return ok(await getPublicPassport(publicId));
  });
}
