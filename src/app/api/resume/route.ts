import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { analyzeResume } from "@/lib/services/skill-extraction";
import { resumeAnalyzeSchema } from "@/lib/validation/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireUser();
    const body = resumeAnalyzeSchema.parse(await request.json());
    return ok(await analyzeResume(body.text, body.targetCareerSlug));
  });
}
