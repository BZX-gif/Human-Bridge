import { ApiError, handleRoute, ok } from "@/lib/api/response";
import { requireEmployer } from "@/lib/auth/session";
import { compareCandidates, listJobCandidates } from "@/lib/services/employer-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Employer candidate list. Authorisation is enforced in the service layer:
 * the job must belong to the requesting employer's company.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const employer = await requireEmployer();
    const { id } = await params;
    const jobId = Number(id);
    if (!Number.isInteger(jobId)) throw new ApiError("VALIDATION_ERROR", "Invalid job id.");

    const url = new URL(request.url);
    const compare = url.searchParams.get("compare");
    if (compare !== null) {
      const userIds = compare
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isInteger(v) && v > 0);
      return ok(await compareCandidates(jobId, employer.companyId, userIds));
    }

    return ok({ candidates: await listJobCandidates(jobId, employer.companyId) });
  });
}
