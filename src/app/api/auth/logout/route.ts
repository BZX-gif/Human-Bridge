import { handleRoute, ok } from "@/lib/api/response";
import { destroySession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return handleRoute(async () => {
    await destroySession();
    return ok({ signedOut: true });
  });
}
