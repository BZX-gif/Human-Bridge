import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { getUserSkills } from "@/lib/services/skill-service";
import { getAiFluencyProfile } from "@/lib/services/taxonomy-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The candidate's verified skill profile (evidence-derived scores, levels,
 * verification status and assessment history references). Nothing here is
 * claimed from a course list — every entry traces to skill_evidence rows.
 */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();
    const [skills, aiFluency] = await Promise.all([
      getUserSkills(user.id),
      getAiFluencyProfile(user.id),
    ]);
    return ok({ skills, aiFluency });
  });
}
