import { clampScore } from "./rubric-engine";
import { resolveConfidence, resolveSkillLevel } from "./skill-level";
import type {
  AttemptResult,
  ComputedSkillScore,
  EvaluatorType,
  PassingPolicy,
  SectionKind,
  SectionScore,
  SkillScoreBreakdownEntry,
} from "./types";

export interface SkillContribution {
  skillSlug: string;
  score: number;
  sectionKey: string;
  sectionKind: SectionKind;
  /** Relative weight of this contribution (normally the section weight). */
  weight: number;
}

/** How much each evidence kind counts toward a skill score. */
const KIND_WEIGHT: Record<SectionKind, number> = {
  knowledge: 0.6,
  investigation: 1.0,
  practical: 1.4,
  reasoning: 1.0,
  defense: 1.2,
};

export function aggregateSkillScores(
  contributions: SkillContribution[],
): ComputedSkillScore[] {
  const bySkill = new Map<
    string,
    { total: number; weight: number; breakdown: SkillScoreBreakdownEntry[]; kinds: SectionKind[] }
  >();

  for (const c of contributions) {
    const entry =
      bySkill.get(c.skillSlug) ?? { total: 0, weight: 0, breakdown: [], kinds: [] };
    const effectiveWeight = c.weight * KIND_WEIGHT[c.sectionKind];
    entry.total += c.score * effectiveWeight;
    entry.weight += effectiveWeight;
    entry.breakdown.push({
      sectionKey: c.sectionKey,
      sectionKind: c.sectionKind,
      score: clampScore(c.score),
      weight: Math.round(effectiveWeight),
    });
    if (!entry.kinds.includes(c.sectionKind)) entry.kinds.push(c.sectionKind);
    bySkill.set(c.skillSlug, entry);
  }

  const out: ComputedSkillScore[] = [];
  for (const [skillSlug, entry] of bySkill) {
    const score = entry.weight === 0 ? 0 : clampScore(entry.total / entry.weight);
    const level = resolveSkillLevel(score, entry.kinds);
    out.push({
      skillSlug,
      score,
      level,
      confidence: resolveConfidence(entry.kinds, entry.breakdown.length),
      evidenceKinds: entry.kinds,
      breakdown: entry.breakdown,
    });
  }

  return out.sort((a, b) => b.score - a.score);
}

export function computeOverallScore(sectionScores: SectionScore[]): number {
  const evaluated = sectionScores.filter((s) => s.evaluated);
  const totalWeight = evaluated.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = evaluated.reduce((sum, s) => sum + s.score * s.weight, 0);
  return clampScore(weighted / totalWeight);
}

/**
 * Readiness is NOT the same as the raw score. It penalises unproven essential
 * skills and thin evidence, so a candidate cannot look job-ready off the back
 * of a strong knowledge section alone.
 */
export function computeReadiness(
  overallScore: number,
  skillScores: ComputedSkillScore[],
  essentialSkillSlugs: string[],
  policy: PassingPolicy,
): number {
  if (essentialSkillSlugs.length === 0) return overallScore;

  let penalty = 0;
  for (const slug of essentialSkillSlugs) {
    const skill = skillScores.find((s) => s.skillSlug === slug);
    if (!skill) {
      penalty += 8; // essential skill never evaluated
      continue;
    }
    if (skill.score < policy.essentialSkillFloor) {
      penalty += Math.min(15, (policy.essentialSkillFloor - skill.score) * 0.5);
    }
    if (skill.confidence === "low") penalty += 3;
  }

  return clampScore(overallScore - penalty);
}

export interface DecisionInput {
  overallScore: number;
  readinessScore: number;
  sectionScores: SectionScore[];
  skillScores: ComputedSkillScore[];
  essentialSkillSlugs: string[];
  policy: PassingPolicy;
  integrityStatus: "normal" | "review" | "flagged";
}

export interface Decision {
  passed: boolean;
  passReasons: string[];
  failReasons: string[];
}

/**
 * Nobody passes automatically. Every gate in the policy must clear.
 */
export function decidePass(input: DecisionInput): Decision {
  const { policy } = input;
  const passReasons: string[] = [];
  const failReasons: string[] = [];

  if (input.overallScore >= policy.minOverall) {
    passReasons.push(`Overall score ${input.overallScore} meets the ${policy.minOverall} threshold.`);
  } else {
    failReasons.push(
      `Overall score ${input.overallScore} is below the ${policy.minOverall} threshold for this role.`,
    );
  }

  const practicalSections = input.sectionScores.filter(
    (s) => s.sectionKind === "practical" && s.evaluated,
  );
  if (practicalSections.length > 0) {
    const practicalWeight = practicalSections.reduce((sum, s) => sum + s.weight, 0);
    const practicalScore = clampScore(
      practicalSections.reduce((sum, s) => sum + s.score * s.weight, 0) / practicalWeight,
    );
    if (practicalScore >= policy.minPractical) {
      passReasons.push(`Practical work scored ${practicalScore}, above the ${policy.minPractical} minimum.`);
    } else {
      failReasons.push(
        `Practical work scored ${practicalScore}, below the ${policy.minPractical} minimum. Knowledge scores cannot compensate for this.`,
      );
    }
  } else {
    failReasons.push("No practical work was evaluated, so job readiness cannot be established.");
  }

  const defenseSections = input.sectionScores.filter(
    (s) => s.sectionKind === "defense" && s.evaluated,
  );
  if (defenseSections.length > 0) {
    const defenseScore = clampScore(
      defenseSections.reduce((sum, s) => sum + s.score, 0) / defenseSections.length,
    );
    if (defenseScore >= policy.minDefense) {
      passReasons.push(`Defense round scored ${defenseScore}.`);
    } else {
      failReasons.push(
        `Defense round scored ${defenseScore}, below the ${policy.minDefense} minimum. The submitted work was not adequately explained.`,
      );
    }
  }

  for (const slug of input.essentialSkillSlugs) {
    const skill = input.skillScores.find((s) => s.skillSlug === slug);
    if (!skill) {
      failReasons.push(`Essential skill "${slug}" was not evaluated.`);
      continue;
    }
    if (skill.score < policy.essentialSkillFloor) {
      failReasons.push(
        `Essential skill "${slug}" scored ${skill.score}, below the required ${policy.essentialSkillFloor}.`,
      );
    }
  }

  if (policy.blockOnIntegrityFlag && input.integrityStatus === "flagged") {
    failReasons.push(
      "This attempt is held for integrity review. No result is finalised until a human has reviewed it.",
    );
  }

  return { passed: failReasons.length === 0, passReasons, failReasons };
}

export interface BuildResultInput extends DecisionInput {
  evaluatorType: EvaluatorType;
  aiEvaluationAvailable: boolean;
  humanReviewRequired: boolean;
  evidenceCollected: string[];
}

export function buildAttemptResult(input: BuildResultInput): AttemptResult {
  const decision = decidePass(input);
  const ranked = [...input.skillScores].sort((a, b) => b.score - a.score);

  return {
    overallScore: input.overallScore,
    readinessScore: input.readinessScore,
    passed: decision.passed && !input.humanReviewRequired,
    passReasons: decision.passReasons,
    failReasons: decision.failReasons,
    sectionScores: input.sectionScores,
    skillScores: ranked,
    strengths: ranked.filter((s) => s.score >= 75).slice(0, 3).map((s) => s.skillSlug),
    improvements: ranked
      .filter((s) => s.score < 65)
      .slice(-3)
      .map((s) => s.skillSlug),
    evidenceCollected: input.evidenceCollected,
    evaluatorType: input.evaluatorType,
    aiEvaluationAvailable: input.aiEvaluationAvailable,
    humanReviewRequired: input.humanReviewRequired,
  };
}
