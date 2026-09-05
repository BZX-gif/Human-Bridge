import { handleRoute, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { listJobsWithMatch } from "@/lib/services/job-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const user = await getCurrentUser();
    return ok({ jobs: await listJobsWithMatch(user?.id ?? null) });
  });
}
