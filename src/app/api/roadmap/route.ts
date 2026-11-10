import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { ensureRoadmapForUser, getRoadmapForUser } from "@/lib/services/roadmap-service";
import { roadmapCreateSchema } from "@/lib/validation/career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    const roadmap = await getRoadmapForUser(user.id);
    return ok({ roadmap });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = roadmapCreateSchema.parse(await request.json());
    const result = await ensureRoadmapForUser(user.id, body.careerId, {
      hoursPerWeek: body.weeklyHours,
      startingLevel: body.startingLevel,
      regenerate: body.regenerate,
    });
    const roadmap = await getRoadmapForUser(user.id, body.careerId);
    return ok({ ...result, roadmap }, result.created ? 201 : 200);
  });
}
