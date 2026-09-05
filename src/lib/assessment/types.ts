/** Core assessment domain types. Shared by the engine, API and UI. */

export const SKILL_LEVELS = [
  "not_evaluated",
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export type EvidenceSource =
  | "SELF_REPORTED"
  | "ASSESSED"
  | "PROJECT_VERIFIED"
  | "EMPLOYER_VERIFIED";

export type SectionKind =
  | "knowledge"
  | "investigation"
  | "practical"
  | "reasoning"
  | "defense";

export type ItemType =
  | "mcq"
  | "multi_select"
  | "short_answer"
  | "numeric"
  | "sql"
  | "long_form"
  | "file_upload";

export type EvaluatorType = "deterministic" | "ai" | "human" | "hybrid";

export type AttemptStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "evaluating"
  | "defense"
  | "completed"
  | "passed"
  | "failed"
  | "expired";

/** A rubric criterion. Weights within a rubric are relative and normalised. */
export interface RubricCriterion {
  key: string;
  label: string;
  weight: number;
  skillSlug?: string;
  guidance?: string;
}

export interface RubricDefinition {
  key: string;
  title: string;
  criteria: RubricCriterion[];
}

/** Answer keys — server side only, never serialised to the browser. */
export interface McqAnswerKey {
  kind: "mcq";
  correctIndex: number;
  explanation?: string;
}
export interface MultiSelectAnswerKey {
  kind: "multi_select";
  correctIndexes: number[];
  explanation?: string;
}
export interface NumericAnswerKey {
  kind: "numeric";
  value: number;
  tolerance: number;
  explanation?: string;
}
/** Keyword-based deterministic scoring for short answers / findings. */
export interface KeywordAnswerKey {
  kind: "keywords";
  /** Each group is a distinct idea; any synonym in a group satisfies it. */
  groups: { label: string; any: string[] }[];
  /** How many groups must match for full marks. Defaults to all. */
  requiredGroups?: number;
  explanation?: string;
}
/** SQL answers checked structurally (required clauses) — not executed. */
export interface SqlAnswerKey {
  kind: "sql";
  requiredClauses: { label: string; any: string[] }[];
  forbiddenClauses?: { label: string; any: string[] }[];
  explanation?: string;
}
/** Long-form work judged by a rubric (deterministic heuristics + optional AI). */
export interface RubricAnswerKey {
  kind: "rubric";
  rubricKey: string;
  minWords?: number;
  expectedPoints?: { label: string; any: string[] }[];
}

export type AnswerKey =
  | McqAnswerKey
  | MultiSelectAnswerKey
  | NumericAnswerKey
  | KeywordAnswerKey
  | SqlAnswerKey
  | RubricAnswerKey;

/** Public item payload — safe to send to the browser. */
export interface ItemPayload {
  options?: string[];
  placeholder?: string;
  datasetKey?: string;
  unit?: string;
  rows?: number;
  minWords?: number;
  accept?: string[];
}

export type ResponseValue =
  | { kind: "choice"; index: number }
  | { kind: "choices"; indexes: number[] }
  | { kind: "text"; text: string }
  | { kind: "number"; value: number }
  | { kind: "file"; fileName: string; contentType: string; size: number; excerpt?: string };

/** Data-driven pass/fail policy stored on the blueprint. */
export interface PassingPolicy {
  /** Minimum overall weighted score. */
  minOverall: number;
  /** Minimum score on practical sections — knowledge can never compensate. */
  minPractical: number;
  /** Per-skill floors for skills the role treats as essential. */
  essentialSkillFloor: number;
  /** Minimum defense score when a defense round exists. */
  minDefense: number;
  /** Attempt is not auto-passed when integrity requires review. */
  blockOnIntegrityFlag: boolean;
}

export interface SkillScoreBreakdownEntry {
  sectionKey: string;
  sectionKind: SectionKind;
  score: number;
  weight: number;
}

export interface ComputedSkillScore {
  skillSlug: string;
  score: number;
  level: SkillLevel;
  confidence: Confidence;
  evidenceKinds: SectionKind[];
  breakdown: SkillScoreBreakdownEntry[];
}

export interface SectionScore {
  sectionKey: string;
  sectionKind: SectionKind;
  title: string;
  weight: number;
  score: number;
  maxScore: number;
  evaluated: boolean;
  evaluatorType: EvaluatorType;
  notes?: string;
}

export interface AttemptResult {
  overallScore: number;
  readinessScore: number;
  passed: boolean;
  passReasons: string[];
  failReasons: string[];
  sectionScores: SectionScore[];
  skillScores: ComputedSkillScore[];
  strengths: string[];
  improvements: string[];
  evidenceCollected: string[];
  evaluatorType: EvaluatorType;
  aiEvaluationAvailable: boolean;
  humanReviewRequired: boolean;
}
