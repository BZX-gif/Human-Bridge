import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { careers, users } from "@/db/schema";
import { fail, handleRoute, ok } from "@/lib/api/response";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";
import { requireUser } from "@/lib/auth/session";
import { getEvaluationProvider } from "@/lib/ai";
import { CAREER_COPILOT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { getUserSkills } from "@/lib/services/skill-service";
import { getCareerGapForUser } from "@/lib/services/career-service";
import { copilotSchema } from "@/lib/validation/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Career Copilot.
 *
 * The model is given the user's REAL skill data as context so it cannot invent
 * scores. When no provider is configured we say so plainly rather than replaying
 * a canned script dressed up as AI.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const limit = rateLimit(clientKey(request, `copilot:${user.id}`), 20, 300);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "You are sending messages too quickly. Please wait a moment.");
    }

    const body = copilotSchema.parse(await request.json());
    const provider = getEvaluationProvider();

    if (!provider) {
      return fail(
        "AI_UNAVAILABLE",
        "The AI Career Copilot is unavailable because no AI provider is configured. Your skill data, gaps and job matches are still fully available across the rest of Human Bridge.",
      );
    }

    const db = await getDb();
    const [record] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const userSkills = await getUserSkills(user.id);

    let careerName = "not selected";
    let gapContext = "No target career selected yet.";
    if (record?.targetCareerId) {
      const [career] = await db
        .select()
        .from(careers)
        .where(eq(careers.id, record.targetCareerId))
        .limit(1);
      careerName = career?.name ?? "not selected";
      const gaps = await getCareerGapForUser(record.targetCareerId, user.id);
      gapContext = gaps
        .map(
          (g) =>
            `- ${g.name} (${g.importance}): current ${g.currentScore}, required ${g.requiredScore}, status ${g.status}`,
        )
        .join("\n");
    }

    const skillContext =
      userSkills.length === 0
        ? "This user has no verified skill scores yet. Do not invent any."
        : userSkills
            .map(
              (s) =>
                `- ${s.name}: score ${s.score}, level ${s.level}, confidence ${s.confidence}, verification ${s.verificationStatus}`,
            )
            .join("\n");

    const system = `${CAREER_COPILOT_SYSTEM_PROMPT}

VERIFIED CONTEXT FOR THIS USER (the only figures you may cite):
Target career: ${careerName}

Skill scores:
${skillContext}

Skill gaps against the target role:
${gapContext}`;

    const result = await provider.chat({ system, messages: body.messages });

    if (!result.ok) {
      return fail("AI_UNAVAILABLE", "The Career Copilot could not be reached. Please try again.");
    }

    return ok({ reply: result.data, provider: result.provider });
  });
}
