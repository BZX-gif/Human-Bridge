import { handleRoute, ok } from "@/lib/api/response";
import { getBlueprint } from "@/lib/services/assessment-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public blueprint view. Answer keys are stripped in the service layer. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(async () => {
    const { id } = await params;
    const blueprint = await getBlueprint(id);
    return ok(blueprint);
  });
}
