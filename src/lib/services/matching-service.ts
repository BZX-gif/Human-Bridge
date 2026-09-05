import { LEVEL_TO_SCORE, SKILL_LEVEL_LABELS } from "@/lib/assessment/skill-level";
import { clampScore } from "@/lib/assessment/rubric-engine";
import type { Confidence, SkillLevel } from "@/lib/assessment/types";

export type Importance = "essential" | "important" | "helpful";

export interface RequiredSkill {
  slug: string;
  name: string;
  importance: Importance;
  requiredLevel: SkillLevel;
  requiredScore: number;
}

export interface CandidateSkill {
  slug: string;
  name: string;
  score: number;
  level: SkillLevel;
  confidence: Confidence;
  verificationStatus: "self_reported" | "assessed" | "project_verified" | "employer_verified";
}

export type SkillMatchStatus = "met" | "close" | "gap" | "major_gap" | "missing";

export interface SkillMatch {
  slug: string;
  name: string;
  importance: Importance;
  requiredScore: number;
  requiredLevelLabel: string;
  candidateScore: number;
  candidateLevelLabel: string;
  confidence: Confidence | null;
  verified: boolean;
  status: SkillMatchStatus;
  /** Human-readable reason — matching is never an unexplained number. */
  explanation: string;
}

export interface MatchResult {
  score: number;
  eligible: boolean;
  /** Set when an essential requirement is unmet — surfaced instead of hidden. */
  blockingReasons: string[];
  strengths: string[];
  gaps: string[];
  skillMatches: SkillMatch[];
  summary: string;
}

const IMPORTANCE_WEIGHT: Record<Importance, number> = {
  essential: 3,
  important: 2,
  helpful: 1,
};

/**
 * Verification strength multiplier. A self-reported 90 is worth less to an
 * employer than an assessed 75, so unverified claims are discounted.
 */
const VERIFICATION_MULTIPLIER: Record<CandidateSkill["verificationStatus"], number> = {
  self_reported: 0.5,
  assessed: 1.0,
  project_verified: 1.05,
  employer_verified: 1.1,
};

const CONFIDENCE_MULTIPLIER: Record<Confidence, number> = {
  low: 0.85,
  medium: 0.95,
  high: 1.0,
};

/**
 * Deterministic, fully explainable matching.
 *
 * Every number here can be traced to a rule. No ML, no opaque AI score.
 */
export function matchCandidateToRequirements(
  required: RequiredSkill[],
  candidate: CandidateSkill[],
): MatchResult {
  const bySlug = new Map(candidate.map((c) => [c.slug, c]));

  if (required.length === 0) {
    return {
      score: 0,
      eligible: false,
      blockingReasons: ["This role has no structured skill requirements defined yet."],
      strengths: [],
      gaps: [],
      skillMatches: [],
      summary: "Matching is unavailable until the role defines its required skills.",
    };
  }

  const skillMatches: SkillMatch[] = [];
  const blockingReasons: string[] = [];
  let weightedTotal = 0;
  let weightSum = 0;

  for (const req of required) {
    const have = bySlug.get(req.slug);
    const requiredScore = req.requiredScore || LEVEL_TO_SCORE[req.requiredLevel];
    const rawScore = have?.score ?? 0;

    const effectiveScore = have
      ? clampScore(
          rawScore *
            VERIFICATION_MULTIPLIER[have.verificationStatus] *
            CONFIDENCE_MULTIPLIER[have.confidence],
        )
      : 0;

    const ratio = requiredScore === 0 ? 1 : Math.min(1, effectiveScore / requiredScore);
    const weight = IMPORTANCE_WEIGHT[req.importance];
    weightedTotal += ratio * weight;
    weightSum += weight;

    const status = resolveStatus(have, effectiveScore, requiredScore);

    if (req.importance === "essential" && (status === "gap" || status === "major_gap" || status === "missing")) {
      blockingReasons.push(
        status === "missing"
          ? `Essential ${req.name} requirement not met — no evidence on record.`
          : `Essential ${req.name} requirement not met — ${rawScore} against a required ${requiredScore}.`,
      );
    }

    skillMatches.push({
      slug: req.slug,
      name: req.name,
      importance: req.importance,
      requiredScore,
      requiredLevelLabel: SKILL_LEVEL_LABELS[req.requiredLevel],
      candidateScore: rawScore,
      candidateLevelLabel: have ? SKILL_LEVEL_LABELS[have.level] : SKILL_LEVEL_LABELS.not_evaluated,
      confidence: have?.confidence ?? null,
      verified: have ? have.verificationStatus !== "self_reported" : false,
      status,
      explanation: explain(req, have, rawScore, effectiveScore, requiredScore, status),
    });
  }

  const score = weightSum === 0 ? 0 : clampScore((weightedTotal / weightSum) * 100);
  const eligible = blockingReasons.length === 0;

  const strengths = skillMatches
    .filter((m) => m.status === "met" && m.verified)
    .sort((a, b) => b.candidateScore - a.candidateScore)
    .slice(0, 3)
    .map((m) => m.name);

  const gaps = skillMatches
    .filter((m) => m.status !== "met")
    .sort((a, b) => IMPORTANCE_WEIGHT[b.importance] - IMPORTANCE_WEIGHT[a.importance])
    .slice(0, 3)
    .map((m) => m.name);

  return {
    score,
    eligible,
    blockingReasons,
    strengths,
    gaps,
    skillMatches,
    summary: eligible
      ? `${score}% match. ${skillMatches.filter((m) => m.status === "met").length} of ${skillMatches.length} requirements met.`
      : `Not yet ready for this role. ${blockingReasons[0]}`,
  };
}

function resolveStatus(
  have: CandidateSkill | undefined,
  effectiveScore: number,
  requiredScore: number,
): SkillMatchStatus {
  if (!have) return "missing";
  if (effectiveScore >= requiredScore) return "met";
  const shortfall = requiredScore - effectiveScore;
  if (shortfall <= 8) return "close";
  if (shortfall <= 25) return "gap";
  return "major_gap";
}

function explain(
  req: RequiredSkill,
  have: CandidateSkill | undefined,
  rawScore: number,
  effectiveScore: number,
  requiredScore: number,
  status: SkillMatchStatus,
): string {
  if (!have) {
    return `No evidence on record for ${req.name}. This role requires ${SKILL_LEVEL_LABELS[req.requiredLevel]} (${requiredScore}).`;
  }
  const discounted = effectiveScore < rawScore;
  const discountNote = discounted
    ? ` Your score is discounted to ${effectiveScore} because the evidence is ${
        have.verificationStatus === "self_reported" ? "self-reported" : `${have.confidence}-confidence`
      }.`
    : "";

  switch (status) {
    case "met":
      return `Requirement met: ${rawScore} against a required ${requiredScore}, evidenced at ${SKILL_LEVEL_LABELS[have.level]} level with ${have.confidence} confidence.`;
    case "close":
      return `Just short: ${rawScore} against a required ${requiredScore}.${discountNote}`;
    case "gap":
      return `Needs improvement: ${rawScore} against a required ${requiredScore}.${discountNote}`;
    default:
      return `Major gap: ${rawScore} against a required ${requiredScore}.${discountNote}`;
  }
}

export interface SkillGapItem {
  slug: string;
  name: string;
  importance: Importance;
  requiredScore: number;
  currentScore: number;
  status: "ready" | "needs_improvement" | "major_gap" | "not_started";
  deficit: number;
}

/** Career-level skill gap analysis (drives the learning path). */
export function computeSkillGaps(
  required: RequiredSkill[],
  candidate: CandidateSkill[],
): SkillGapItem[] {
  const bySlug = new Map(candidate.map((c) => [c.slug, c]));
  return required
    .map((req) => {
      const have = bySlug.get(req.slug);
      const currentScore = have?.score ?? 0;
      const requiredScore = req.requiredScore || LEVEL_TO_SCORE[req.requiredLevel];
      const deficit = Math.max(0, requiredScore - currentScore);

      let status: SkillGapItem["status"];
      if (!have || currentScore === 0) status = "not_started";
      else if (deficit === 0) status = "ready";
      else if (deficit <= 20) status = "needs_improvement";
      else status = "major_gap";

      return {
        slug: req.slug,
        name: req.name,
        importance: req.importance,
        requiredScore,
        currentScore,
        status,
        deficit,
      };
    })
    .sort((a, b) => {
      const w = IMPORTANCE_WEIGHT[b.importance] - IMPORTANCE_WEIGHT[a.importance];
      return w !== 0 ? w : b.deficit - a.deficit;
    });
}
