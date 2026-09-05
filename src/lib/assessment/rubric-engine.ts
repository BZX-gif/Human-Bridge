import type { RubricCriterion, RubricDefinition } from "./types";

export interface CriterionScore {
  key: string;
  label: string;
  weight: number;
  score: number;
  comment?: string;
}

export interface RubricResult {
  rubricKey: string;
  score: number;
  criterionScores: CriterionScore[];
}

/** Clamp any incoming number into a valid 0–100 score. */
export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Reusable rubric engine. Given a rubric definition and a map of criterion
 * scores (0–100), produce a weighted rubric score. Missing criteria count as 0
 * so an evaluator cannot inflate a score by omitting weak dimensions.
 */
export function applyRubric(
  rubric: RubricDefinition,
  rawScores: Record<string, number>,
  comments: Record<string, string> = {},
): RubricResult {
  const totalWeight = rubric.criteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) {
    return { rubricKey: rubric.key, score: 0, criterionScores: [] };
  }

  const criterionScores: CriterionScore[] = rubric.criteria.map((criterion) => ({
    key: criterion.key,
    label: criterion.label,
    weight: criterion.weight,
    score: clampScore(rawScores[criterion.key] ?? 0),
    comment: comments[criterion.key],
  }));

  const weighted = criterionScores.reduce((sum, c) => sum + c.score * c.weight, 0);
  return {
    rubricKey: rubric.key,
    score: clampScore(weighted / totalWeight),
    criterionScores,
  };
}

/** Map rubric criteria onto the skills they measure. */
export function rubricSkillScores(
  rubric: RubricDefinition,
  result: RubricResult,
): Record<string, number> {
  const bySkill = new Map<string, { total: number; weight: number }>();
  const criteriaByKey = new Map<string, RubricCriterion>(
    rubric.criteria.map((c) => [c.key, c]),
  );

  for (const cs of result.criterionScores) {
    const skillSlug = criteriaByKey.get(cs.key)?.skillSlug;
    if (!skillSlug) continue;
    const entry = bySkill.get(skillSlug) ?? { total: 0, weight: 0 };
    entry.total += cs.score * cs.weight;
    entry.weight += cs.weight;
    bySkill.set(skillSlug, entry);
  }

  const out: Record<string, number> = {};
  for (const [slug, { total, weight }] of bySkill) {
    if (weight > 0) out[slug] = clampScore(total / weight);
  }
  return out;
}
