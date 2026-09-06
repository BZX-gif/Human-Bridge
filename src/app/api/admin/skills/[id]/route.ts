import { handleRoute, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { updateSkill } from "@/lib/services/taxonomy-service";
import { updateSkillSchema } from "@/lib/validation/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Edit a skill: metadata, difficulty, importance, status (disable/archive). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = updateSkillSchema.parse(await request.json());
    return ok(await updateSkill(Number(id), body));
  });
}
