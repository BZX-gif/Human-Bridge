import type { Confidence, SectionKind, SkillLevel } from "./types";

/**
 * Skill levels are NEVER derived from a percentage alone. A candidate must
 * produce evidence of the right kind to reach the higher levels:
 *
 *   beginner      any evaluated evidence
 *   intermediate  score threshold
 *   advanced      score threshold AND practical evidence
 *   expert        score threshold AND practical evidence AND defense evidence
 */
export interface LevelThreshold {
  level: SkillLevel;
  minScore: number;
  requiresEvidence: SectionKind[];
}

export const DEFAULT_LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: "expert", minScore: 90, requiresEvidence: ["practical", "defense"] },
  { level: "advanced", minScore: 78, requiresEvidence: ["practical"] },
  { level: "intermediate", minScore: 55, requiresEvidence: [] },
  { level: "beginner", minScore: 1, requiresEvidence: [] },
];

export function resolveSkillLevel(
  score: number,
  evidenceKinds: SectionKind[],
  thresholds: LevelThreshold[] = DEFAULT_LEVEL_THRESHOLDS,
): SkillLevel {
  if (evidenceKinds.length === 0) return "not_evaluated";
  for (const t of thresholds) {
    if (score < t.minScore) continue;
    const hasEvidence = t.requiresEvidence.every((kind) => evidenceKinds.includes(kind));
    if (hasEvidence) return t.level;
  }
  return score > 0 ? "beginner" : "not_evaluated";
}

/**
 * Confidence reflects how much we actually know, not how high the score is.
 * One MCQ section is never "high confidence".
 */
export function resolveConfidence(
  evidenceKinds: SectionKind[],
  evidenceCount: number,
): Confidence {
  const distinct = new Set(evidenceKinds);
  const hasPractical = distinct.has("practical") || distinct.has("investigation");
  const hasDefense = distinct.has("defense");

  if (hasPractical && hasDefense && evidenceCount >= 3) return "high";
  if (hasPractical && evidenceCount >= 2) return "medium";
  if (distinct.size >= 2) return "medium";
  return "low";
}

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  not_evaluated: "Not Evaluated",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const SKILL_LEVEL_ORDER: Record<SkillLevel, number> = {
  not_evaluated: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

/** Approximate score a required level corresponds to, for gap maths. */
export const LEVEL_TO_SCORE: Record<SkillLevel, number> = {
  not_evaluated: 0,
  beginner: 35,
  intermediate: 60,
  advanced: 78,
  expert: 90,
};
