import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { deleteGoal, updateGoal } from "@/lib/services/planner-service";
import { goalUpdateSchema } from "@/lib/validation/career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = goalUpdateSchema.parse(await request.json());
    const goal = await updateGoal(user.id, Number(id), body);
    return ok({ goal });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    await deleteGoal(user.id, Number(id));
    return ok({ deleted: true });
  });
}
