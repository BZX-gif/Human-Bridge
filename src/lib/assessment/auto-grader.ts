import type { AnswerKey, ResponseValue } from "./types";
import { clampScore } from "./rubric-engine";

export interface AutoGradeResult {
  /** 0–100 for the single item. */
  score: number;
  isCorrect: boolean | null;
  /** true when a deterministic verdict was possible at all. */
  deterministic: boolean;
  matched: string[];
  missing: string[];
}

const EMPTY: AutoGradeResult = {
  score: 0,
  isCorrect: null,
  deterministic: false,
  matched: [],
  missing: [],
};

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(normalise(n)));
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Server-side deterministic grading. This is the ONLY place item correctness is
 * decided — the browser never sends a score. Items that cannot be graded
 * deterministically (long form work) return `deterministic: false` and are
 * routed to the rubric/AI evaluator instead.
 */
export function gradeItem(
  answerKey: AnswerKey | null | undefined,
  response: ResponseValue | null | undefined,
): AutoGradeResult {
  if (!answerKey || !response) return EMPTY;

  switch (answerKey.kind) {
    case "mcq": {
      if (response.kind !== "choice") return EMPTY;
      const isCorrect = response.index === answerKey.correctIndex;
      return {
        score: isCorrect ? 100 : 0,
        isCorrect,
        deterministic: true,
        matched: [],
        missing: [],
      };
    }

    case "multi_select": {
      if (response.kind !== "choices") return EMPTY;
      const correct = new Set(answerKey.correctIndexes);
      const chosen = new Set(response.indexes);
      let hits = 0;
      let falsePositives = 0;
      for (const c of chosen) {
        if (correct.has(c)) hits += 1;
        else falsePositives += 1;
      }
      // Partial credit minus a penalty for wrong selections; never below 0.
      const raw = correct.size === 0 ? 0 : ((hits - falsePositives) / correct.size) * 100;
      const score = clampScore(raw);
      return {
        score,
        isCorrect: score === 100,
        deterministic: true,
        matched: [],
        missing: [],
      };
    }

    case "numeric": {
      if (response.kind !== "number") return EMPTY;
      const diff = Math.abs(response.value - answerKey.value);
      const isCorrect = diff <= answerKey.tolerance;
      // Graceful decay up to 3x tolerance so "close" beats "wildly wrong".
      const window = Math.max(answerKey.tolerance * 3, Number.EPSILON);
      const score = isCorrect ? 100 : clampScore(100 * (1 - diff / window));
      return { score, isCorrect, deterministic: true, matched: [], missing: [] };
    }

    case "keywords": {
      if (response.kind !== "text") return EMPTY;
      const text = normalise(response.text);
      if (!text) return { ...EMPTY, deterministic: true, score: 0, isCorrect: false };
      const matched: string[] = [];
      const missing: string[] = [];
      for (const group of answerKey.groups) {
        if (containsAny(text, group.any)) matched.push(group.label);
        else missing.push(group.label);
      }
      const required = answerKey.requiredGroups ?? answerKey.groups.length;
      const score = required === 0 ? 0 : clampScore((matched.length / required) * 100);
      return { score, isCorrect: matched.length >= required, deterministic: true, matched, missing };
    }

    case "sql": {
      if (response.kind !== "text") return EMPTY;
      const text = normalise(response.text);
      if (!text) return { ...EMPTY, deterministic: true, score: 0, isCorrect: false };
      const matched: string[] = [];
      const missing: string[] = [];
      for (const clause of answerKey.requiredClauses) {
        if (containsAny(text, clause.any)) matched.push(clause.label);
        else missing.push(clause.label);
      }
      let score =
        answerKey.requiredClauses.length === 0
          ? 0
          : (matched.length / answerKey.requiredClauses.length) * 100;
      for (const forbidden of answerKey.forbiddenClauses ?? []) {
        if (containsAny(text, forbidden.any)) {
          score -= 20;
          missing.push(`Avoid: ${forbidden.label}`);
        }
      }
      const final = clampScore(score);
      return {
        score: final,
        isCorrect: missing.length === 0,
        deterministic: true,
        matched,
        missing,
      };
    }

    case "rubric": {
      // Deterministic *floor* only: does the submission contain substantive work
      // and cover the expected points? Never a pass on its own — the rubric
      // evaluator refines this, and it is explicitly marked non-deterministic
      // so we never claim a confident verdict from heuristics alone.
      if (response.kind !== "text") return EMPTY;
      const text = normalise(response.text);
      const words = wordCount(response.text);
      const minWords = answerKey.minWords ?? 60;
      if (words === 0) {
        return { score: 0, isCorrect: false, deterministic: true, matched: [], missing: ["No submission"] };
      }
      const matched: string[] = [];
      const missing: string[] = [];
      for (const point of answerKey.expectedPoints ?? []) {
        if (containsAny(text, point.any)) matched.push(point.label);
        else missing.push(point.label);
      }
      const coverage =
        (answerKey.expectedPoints?.length ?? 0) === 0
          ? 0
          : matched.length / (answerKey.expectedPoints?.length ?? 1);
      const effort = Math.min(1, words / minWords);
      // Heuristic baseline capped well below "good" — real credit needs a rubric
      // evaluation. Typing anything can never approach a pass.
      const score = clampScore(coverage * 55 + effort * 15);
      return { score, isCorrect: null, deterministic: false, matched, missing };
    }

    default:
      return EMPTY;
  }
}
