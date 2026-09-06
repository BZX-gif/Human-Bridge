import { handleRoute, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { createSkill } from "@/lib/services/taxonomy-service";
import { createSkillSchema } from "@/lib/validation/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireAdmin();
    const body = createSkillSchema.parse(await request.json());
    return ok(await createSkill(body), 201);
  });
}
