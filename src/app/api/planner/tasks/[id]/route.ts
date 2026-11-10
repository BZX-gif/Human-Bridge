import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { deleteTask, updateTask } from "@/lib/services/planner-service";
import { taskUpdateSchema } from "@/lib/validation/career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = taskUpdateSchema.parse(await request.json());
    const task = await updateTask(user.id, Number(id), body);
    return ok({ task });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    await deleteTask(user.id, Number(id));
    return ok({ deleted: true });
  });
}
