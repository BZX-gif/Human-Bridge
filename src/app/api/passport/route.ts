import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { getPassportForUser } from "@/lib/services/passport-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    return ok(await getPassportForUser(user.id));
  });
}
