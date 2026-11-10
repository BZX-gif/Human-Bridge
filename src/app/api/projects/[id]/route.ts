import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { deleteProject, updateProject } from "@/lib/services/portfolio-service";
import { projectUpdateSchema } from "@/lib/validation/career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const body = projectUpdateSchema.parse(await request.json());
    await updateProject(user.id, Number(id), body);
    return ok({ updated: true });
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    await deleteProject(user.id, Number(id));
    return ok({ deleted: true });
  });
}
