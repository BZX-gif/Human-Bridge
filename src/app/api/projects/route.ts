import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import {
  addProject,
  getPortfolioForUser,
  listProjectCatalogue,
} from "@/lib/services/portfolio-service";
import { projectCreateSchema } from "@/lib/validation/career";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    const [portfolio, catalogue] = await Promise.all([
      getPortfolioForUser(user.id),
      listProjectCatalogue(user.targetCareerId ?? undefined),
    ]);
    return ok({ projects: portfolio.projects, catalogue });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = projectCreateSchema.parse(await request.json());
    const result = await addProject(user.id, body);
    return ok(result, 201);
  });
}
