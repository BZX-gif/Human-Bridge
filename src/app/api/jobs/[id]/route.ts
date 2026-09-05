import { ApiError, handleRoute, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { getJob, toCandidateSkills } from "@/lib/services/job-service";
import { matchCandidateToRequirements } from "@/lib/services/matching-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const { id } = await params;
    const jobId = Number(id);
    if (!Number.isInteger(jobId)) throw new ApiError("VALIDATION_ERROR", "Invalid job id.");

    const job = await getJob(jobId);
    const user = await getCurrentUser();
    const match = user
      ? matchCandidateToRequirements(job.requiredSkills, await toCandidateSkills(user.id))
      : null;

    return ok({ job: job.job, company: job.company, requiredSkills: job.requiredSkills, match });
  });
}
