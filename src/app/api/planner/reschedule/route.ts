import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { rescheduleOverdueTasks } from "@/lib/services/planner-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return handleRoute(async () => {
    const user = await requireUser();
    return ok(await rescheduleOverdueTasks(user.id));
  });
}
