import { handleRoute, ok } from "@/lib/api/response";
import { requireEmployer } from "@/lib/auth/session";
import { createJob, listCompanyJobs } from "@/lib/services/employer-service";
import { createJobSchema } from "@/lib/validation/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const employer = await requireEmployer();
    return ok({ jobs: await listCompanyJobs(employer.companyId) });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const employer = await requireEmployer();
    const body = createJobSchema.parse(await request.json());
    return ok(await createJob(employer.companyId, employer.id, body), 201);
  });
}
