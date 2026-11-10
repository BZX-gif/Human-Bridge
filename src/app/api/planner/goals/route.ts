import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { createGoal, getPlannerData } from "@/lib/services/planner-service";
import { goalCreateSchema } from "@/lib/validation/career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    const data = await getPlannerData(user.id);
    return ok({ goals: data.goals, milestones: data.milestones });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = goalCreateSchema.parse(await request.json());
    const goal = await createGoal(user.id, body);
    return ok({ goal }, 201);
  });
}
