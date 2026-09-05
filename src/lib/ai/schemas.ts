import { z } from "zod";

const score = z.number().min(0).max(100);
const confidence = z.enum(["low", "medium", "high"]);

/** Every LLM response is validated before it is allowed near a candidate record. */
export const structuredEvaluationSchema = z.object({
  score,
  confidence,
  rubricScores: z.record(z.string(), score).default({}),
  skillScores: z.record(z.string(), score).default({}),
  evidence: z.array(z.string()).max(20).default([]),
  gaps: z.array(z.string()).max(20).default([]),
  feedback: z.string().max(4000).default(""),
});

export const defenseQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(10).max(600),
        rationale: z.string().max(600).default(""),
        sourceExcerpt: z.string().max(600).default(""),
        targetSkillSlug: z.string().max(150).default(""),
        expectedPoints: z.array(z.string().max(300)).max(8).default([]),
      }),
    )
    .max(10),
});

export const defenseEvaluationSchema = z.object({
  score,
  confidence,
  understanding: z.string().max(2000).default(""),
  evidence: z.array(z.string()).max(10).default([]),
  gaps: z.array(z.string()).max(10).default([]),
});

/** Extract the first JSON object from a model response and parse it safely. */
export function parseJsonObject(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  return JSON.parse(trimmed.slice(start, end + 1));
}
