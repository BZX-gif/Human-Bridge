import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { updateProfessionalProfile } from "@/lib/services/portfolio-service";
import { profileUpdateSchema } from "@/lib/validation/career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = profileUpdateSchema.parse(await request.json());
    await updateProfessionalProfile(user.id, body);
    return ok({ updated: true });
  });
}
