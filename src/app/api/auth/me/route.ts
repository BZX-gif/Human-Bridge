import { handleRoute, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const user = await getCurrentUser();
    return ok({ user });
  });
}
