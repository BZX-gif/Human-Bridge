import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { updateMilestoneStatus } from "@/lib/services/roadmap-service";
import { milestoneUpdateSchema } from "@/lib/validation/career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = milestoneUpdateSchema.parse(await request.json());
    const roadmap = await updateMilestoneStatus(user.id, Number(id), body.status);
    return ok({ roadmap });
  });
}
