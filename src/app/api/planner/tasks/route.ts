import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { createTask, getPlannerData } from "@/lib/services/planner-service";
import { taskCreateSchema } from "@/lib/validation/career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    return ok(await getPlannerData(user.id));
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = taskCreateSchema.parse(await request.json());
    const task = await createTask(user.id, body);
    return ok({ task }, 201);
  });
}
