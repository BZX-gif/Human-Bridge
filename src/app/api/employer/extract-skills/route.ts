import { handleRoute, ok } from "@/lib/api/response";
import { requireEmployer } from "@/lib/auth/session";
import { extractSkillsFromDescription } from "@/lib/services/skill-extraction";
import { extractSkillsSchema } from "@/lib/validation/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Job description → structured skill requirements.
 * Suggestions only: the employer edits and confirms every requirement.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireEmployer();
    const body = extractSkillsSchema.parse(await request.json());
    const extracted = await extractSkillsFromDescription(body.description, body.title);
    return ok({
      skills: extracted,
      note: "These are suggestions extracted from your description. Review and edit every requirement before publishing.",
    });
  });
}
