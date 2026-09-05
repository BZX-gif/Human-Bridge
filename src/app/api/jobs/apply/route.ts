import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { applyToJob } from "@/lib/services/job-service";
import { applySchema } from "@/lib/validation/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = applySchema.parse(await request.json());
    return ok(await applyToJob(user.id, body.jobId, body.coverNote), 201);
  });
}
