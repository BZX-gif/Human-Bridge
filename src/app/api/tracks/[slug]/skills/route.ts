import { handleRoute, ok } from "@/lib/api/response";
import { getTrackSkills } from "@/lib/services/taxonomy-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handleRoute(async () => {
    const { slug } = await params;
    return ok({ skills: await getTrackSkills(slug) });
  });
}
