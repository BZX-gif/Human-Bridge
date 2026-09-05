import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { updatePassportPrivacy } from "@/lib/services/passport-service";
import { passportPrivacySchema } from "@/lib/validation/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = passportPrivacySchema.parse(await request.json());
    await updatePassportPrivacy(user.id, body);
    return ok({ updated: true });
  });
}
