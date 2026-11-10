import { fail, handleRoute, ok } from "@/lib/api/response";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";
import { requireUser } from "@/lib/auth/session";
import { generateTasksFromMilestone } from "@/lib/services/planner-service";
import { generateTasksSchema } from "@/lib/validation/career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Turn one milestone into a realistic set of daily actions. */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const limit = rateLimit(clientKey(request, `plan:${user.id}`), 20, 300);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "Too many plan requests. Please wait a moment.");
    }
    const body = generateTasksSchema.parse(await request.json());
    const result = await generateTasksFromMilestone(user.id, body.milestoneId, {
      startDate: body.startDate,
      weeklyHours: body.weeklyHours,
    });
    return ok(result, 201);
  });
}
