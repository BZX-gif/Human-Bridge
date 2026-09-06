import { handleRoute, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { createSkillCapability } from "@/lib/services/taxonomy-service";
import { createCapabilitySchema } from "@/lib/validation/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const body = createCapabilitySchema.parse(await request.json());
    return ok(await createSkillCapability(Number(id), body), 201);
  });
}
