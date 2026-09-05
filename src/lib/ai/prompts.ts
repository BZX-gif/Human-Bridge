import type {
  DefenseEvaluationRequest,
  DefenseQuestionRequest,
  EvaluationTask,
} from "./types";

export const EVALUATOR_SYSTEM_PROMPT = `You are an assessment evaluator for Human Bridge, a skills-verification platform.

Rules you must follow:
- You score ONLY against the rubric criteria you are given. Never invent criteria.
- You judge demonstrated ability, not confidence, length, or writing polish.
- Unsupported claims score low even when they sound correct.
- You never award credit for work that is absent.
- Education, institution names, demographics and personal background are irrelevant. Ignore them entirely.
- Return ONLY a single JSON object. No prose, no markdown fences.`;

export function buildEvaluationPrompt(task: EvaluationTask): string {
  return `Evaluate this candidate submission.

ROLE: ${task.role}
SECTION: ${task.sectionTitle}
SKILLS MEASURED: ${task.skillSlugs.join(", ")}

TASK GIVEN TO CANDIDATE:
"""
${task.taskPrompt}
"""

CANDIDATE SUBMISSION:
"""
${truncate(task.submission, 12000)}
"""

RUBRIC CRITERIA (score each 0-100):
${task.rubric
  .map((c) => `- ${c.key} (${c.label}, weight ${c.weight}): ${c.guidance ?? "Judge on demonstrated ability."}`)
  .join("\n")}

CONSTRAINTS:
${task.constraints.map((c) => `- ${c}`).join("\n")}

Return JSON with exactly this shape:
{
  "score": <0-100 overall for this section>,
  "confidence": "low" | "medium" | "high",
  "rubricScores": { ${task.rubric.map((c) => `"${c.key}": <0-100>`).join(", ")} },
  "skillScores": { ${task.skillSlugs.map((s) => `"${s}": <0-100>`).join(", ")} },
  "evidence": ["specific things the candidate actually demonstrated"],
  "gaps": ["specific things missing or incorrect"],
  "feedback": "concise, actionable feedback addressed to the candidate"
}

Set "confidence" to "low" if the submission is too short or vague to judge reliably.`;
}

export function buildDefenseQuestionPrompt(request: DefenseQuestionRequest): string {
  return `Generate defense questions that probe whether this candidate genuinely understands the work THEY submitted.

ROLE: ${request.role}
SKILLS: ${request.skillSlugs.join(", ")}

CANDIDATE SUBMISSION:
"""
${truncate(request.submission, 12000)}
"""

Requirements:
- Every question must quote or reference something specific in the submission.
- Ask why they made a decision, or for the evidence behind a claim they made.
- Do not ask generic textbook questions.
- Produce at most ${request.maxQuestions} questions.

Return JSON:
{
  "questions": [
    {
      "question": "...",
      "rationale": "why this probes real understanding",
      "sourceExcerpt": "the exact snippet from their submission this refers to",
      "targetSkillSlug": "one of: ${request.skillSlugs.join(", ")}",
      "expectedPoints": ["what a strong answer would cover"]
    }
  ]
}`;
}

export function buildDefenseEvaluationPrompt(request: DefenseEvaluationRequest): string {
  return `Evaluate a candidate's defense answer.

ROLE: ${request.role}

THEIR ORIGINAL WORK (excerpt):
"""
${truncate(request.originalSubmissionExcerpt, 4000)}
"""

QUESTION ASKED:
${request.question}

WHAT A STRONG ANSWER COVERS:
${request.expectedPoints.map((p) => `- ${p}`).join("\n") || "- Demonstrates genuine ownership of the decision"}

CANDIDATE ANSWER:
"""
${truncate(request.answer, 6000)}
"""

Judge whether the candidate genuinely understands their own work. A fluent answer that
does not engage with the specifics of their submission scores low.

Return JSON:
{
  "score": <0-100>,
  "confidence": "low" | "medium" | "high",
  "understanding": "one paragraph on what they do and do not understand",
  "evidence": ["..."],
  "gaps": ["..."]
}`;
}

export const CAREER_COPILOT_SYSTEM_PROMPT = `You are the Human Bridge Career Copilot.

You help people understand careers, skill gaps, learning plans, assessment feedback and job requirements.

Hard rules:
- You NEVER guarantee a job, an interview, a salary, or employer interest.
- You NEVER invent a skill score, assessment result, certification or verification status. Only refer to figures present in the context you are given.
- If the user's verified data is not in your context, say you cannot see it rather than guessing.
- You never claim a skill is "verified" — only the assessment engine can do that.
- Be concise, specific and practical. Prefer concrete next steps over motivational filler.`;

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}\n...[truncated]`;
}
