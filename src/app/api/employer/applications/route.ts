import { handleRoute, ok } from "@/lib/api/response";
import { requireEmployer } from "@/lib/auth/session";
import {
  findApplicationsForCompany,
  updateApplicationStatus,
} from "@/lib/services/employer-service";
import { applicationStatusSchema } from "@/lib/validation/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const employer = await requireEmployer();
    const rows = await findApplicationsForCompany(employer.companyId);
    return ok({
      applications: rows.map((r) => ({
        id: r.application.id,
        status: r.application.status,
        matchScore: r.application.matchScore,
        appliedAt: r.application.appliedAt,
        jobId: r.job.id,
        jobTitle: r.job.title,
        candidateName: r.user.name,
        candidateId: r.user.id,
      })),
    });
  });
}

export async function PATCH(request: Request) {
  return handleRoute(async () => {
    const employer = await requireEmployer();
    const body = applicationStatusSchema.parse(await request.json());
    await updateApplicationStatus(
      body.applicationId,
      employer.companyId,
      body.status,
      body.notes,
    );
    return ok({ updated: true });
  });
}
