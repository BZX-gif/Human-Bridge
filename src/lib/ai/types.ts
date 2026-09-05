import type { Confidence } from "@/lib/assessment/types";

export interface EvaluationTask {
  role: string;
  skillSlugs: string[];
  sectionTitle: string;
  taskPrompt: string;
  submission: string;
  rubric: { key: string; label: string; weight: number; guidance?: string }[];
  constraints: string[];
}

export interface StructuredEvaluation {
  score: number;
  confidence: Confidence;
  rubricScores: Record<string, number>;
  skillScores: Record<string, number>;
  evidence: string[];
  gaps: string[];
  feedback: string;
}

export interface DefenseQuestionRequest {
  role: string;
  submission: string;
  skillSlugs: string[];
  maxQuestions: number;
}

export interface GeneratedDefenseQuestion {
  question: string;
  rationale: string;
  sourceExcerpt: string;
  targetSkillSlug: string;
  expectedPoints: string[];
}

export interface DefenseEvaluationRequest {
  role: string;
  question: string;
  expectedPoints: string[];
  answer: string;
  originalSubmissionExcerpt: string;
}

export interface DefenseEvaluation {
  score: number;
  confidence: Confidence;
  understanding: string;
  evidence: string[];
  gaps: string[];
}

export interface ChatRequest {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

/** Result wrapper — providers must be able to say "I cannot do this". */
export type ProviderResult<T> =
  | { ok: true; data: T; provider: string; model: string }
  | { ok: false; reason: string; code: "NOT_CONFIGURED" | "PROVIDER_ERROR" | "INVALID_OUTPUT" };

export interface EvaluationProvider {
  readonly name: string;
  readonly model: string;
  isConfigured(): boolean;
  evaluateSubmission(task: EvaluationTask): Promise<ProviderResult<StructuredEvaluation>>;
  generateDefenseQuestions(
    request: DefenseQuestionRequest,
  ): Promise<ProviderResult<GeneratedDefenseQuestion[]>>;
  evaluateDefense(
    request: DefenseEvaluationRequest,
  ): Promise<ProviderResult<DefenseEvaluation>>;
  chat(request: ChatRequest): Promise<ProviderResult<string>>;
}
