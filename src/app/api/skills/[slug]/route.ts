import { handleRoute, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { getSkillBySlug } from "@/lib/services/taxonomy-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return handleRoute(async () => {
    const { slug } = await params;
    const user = await getCurrentUser();
    return ok(await getSkillBySlug(slug, user?.id));
  });
}
