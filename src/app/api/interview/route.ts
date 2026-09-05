import { z } from "zod";
import { fail, handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { getEvaluationProvider } from "@/lib/ai";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Interview PRACTICE. Explicitly not a certification and never written to the
 * Skill Passport — practice feedback is not evidence.
 */
const INTERVIEW_BANK: Record<string, { category: string; question: string }[]> = {
  "data-analyst": [
    { category: "SQL reasoning", question: "Walk me through how you would find the top 5 customers by revenue in the last quarter, and how you would handle ties." },
    { category: "SQL reasoning", question: "A query that used to take 2 seconds now takes 3 minutes. Nothing in the query changed. What do you investigate?" },
    { category: "Analytics case", question: "Weekly active users dropped 12% but revenue is flat. What is your first hypothesis and how do you test it?" },
    { category: "Business reasoning", question: "A stakeholder asks you to 'prove marketing spend is working'. How do you approach that request?" },
    { category: "Communication", question: "Explain what a p-value is to a sales director who has no statistics background." },
    { category: "Behavioural", question: "Tell me about a time your analysis contradicted what a senior stakeholder believed. What did you do?" },
  ],
};

const requestSchema = z.object({
  careerSlug: z.string().max(150).default("data-analyst"),
  answers: z
    .array(z.object({ question: z.string().max(1000), answer: z.string().max(10_000) }))
    .max(12)
    .optional(),
});

export async function GET(request: Request) {
  return handleRoute(async () => {
    await requireUser();
    const url = new URL(request.url);
    const slug = url.searchParams.get("careerSlug") ?? "data-analyst";
    const questions = INTERVIEW_BANK[slug];
    if (!questions) {
      return fail("NOT_FOUND", "Interview practice is not yet available for this role.");
    }
    return ok({
      questions,
      disclaimer:
        "This is interview practice. Feedback here is for your own preparation and is never added to your Skill Passport or shown to employers.",
    });
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const limit = rateLimit(clientKey(request, `interview:${user.id}`), 10, 300);
    if (!limit.allowed) return fail("RATE_LIMITED", "Please wait before submitting again.");

    const body = requestSchema.parse(await request.json());
    const answers = body.answers ?? [];
    if (answers.length === 0) {
      return fail("VALIDATION_ERROR", "Provide at least one answer to receive feedback.");
    }

    const provider = getEvaluationProvider();
    if (!provider) {
      return fail(
        "AI_UNAVAILABLE",
        "Interview feedback needs an AI provider, which is not configured. Your practice answers were not scored — nothing has been fabricated.",
      );
    }

    const result = await provider.evaluateSubmission({
      role: body.careerSlug.replace(/-/g, " "),
      skillSlugs: ["communication", "problem-solving", "critical-thinking"],
      sectionTitle: "Interview practice",
      taskPrompt: answers.map((a) => a.question).join("\n\n"),
      submission: answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n"),
      rubric: [
        { key: "communication", label: "Communication", weight: 25, guidance: "Structure, clarity and concision." },
        { key: "technical_reasoning", label: "Technical reasoning", weight: 30, guidance: "Correctness and depth of the technical approach." },
        { key: "business_reasoning", label: "Business reasoning", weight: 25, guidance: "Connects the analysis to a business decision." },
        { key: "clarity", label: "Clarity for a non-expert", weight: 20, guidance: "Would a non-technical listener follow this?" },
      ],
      constraints: [
        "This is practice feedback, not a hiring decision.",
        "Be specific and actionable about what to improve.",
      ],
    });

    if (!result.ok) {
      return fail("AI_UNAVAILABLE", "Interview feedback could not be generated. Please try again.");
    }

    return ok({
      feedback: result.data,
      disclaimer:
        "Practice feedback only. This is not a verified assessment and does not affect your Skill Passport.",
    });
  });
}
