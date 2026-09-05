import type { GeneratedDefenseQuestion } from "@/lib/ai/types";

export interface SubmissionExcerpt {
  itemKey: string;
  skillSlugs: string[];
  text: string;
}

interface Probe {
  /** Regex tested against the candidate's own text. */
  pattern: RegExp;
  skillSlug: string;
  question: (match: string) => string;
  rationale: string;
  expectedPoints: string[];
}

/**
 * Deterministic defense-question generation.
 *
 * Every question is anchored to a specific phrase the candidate actually wrote.
 * This runs when no AI provider is configured, and also as a guaranteed floor so
 * a defense round always exists. Questions are never generic textbook questions.
 */
const PROBES: Probe[] = [
  {
    pattern: /\bleft\s+join\b/i,
    skillSlug: "sql",
    question: () =>
      "You used a LEFT JOIN in your query. Why a LEFT JOIN rather than an INNER JOIN here, and what would change in your result if you switched it?",
    rationale: "Tests whether the join choice was deliberate or copied.",
    expectedPoints: [
      "Explains that LEFT JOIN preserves unmatched rows on the left side",
      "Describes the concrete effect on the row count or totals in this dataset",
      "Connects the choice to the business question being answered",
    ],
  },
  {
    pattern: /\binner\s+join\b/i,
    skillSlug: "sql",
    question: () =>
      "You used an INNER JOIN. What orders could that silently drop from your revenue totals, and how did you confirm it did not distort your answer?",
    rationale: "Tests awareness that an INNER JOIN can quietly remove revenue.",
    expectedPoints: [
      "Recognises that unmatched rows are dropped",
      "Describes a check performed (row counts before/after, or a total reconciliation)",
    ],
  },
  {
    pattern: /\bgroup\s+by\b/i,
    skillSlug: "sql",
    question: () =>
      "Walk through your GROUP BY. What exactly is one row of your result set, and why is that the right grain for this question?",
    rationale: "Tests understanding of aggregation grain rather than syntax recall.",
    expectedPoints: [
      "Articulates the grain of one output row",
      "Justifies the grain against the CEO's question",
    ],
  },
  {
    pattern: /\b(north|south|east|west)\b/i,
    skillSlug: "data-analysis",
    question: (match) =>
      `You concluded that the ${match} region is central to the decline. Show the evidence: what specific numbers did you compare, and how did you rule out this being a normal fluctuation?`,
    rationale: "Forces the candidate to substantiate their headline claim.",
    expectedPoints: [
      "Cites concrete Q3-vs-Q4 figures for that region",
      "Compares against other regions rather than viewing it in isolation",
      "Addresses whether the change exceeds normal variation",
    ],
  },
  {
    pattern: /\benterprise\b/i,
    skillSlug: "problem-solving",
    question: () =>
      "You point at the enterprise segment. Enterprise orders are far larger than others — how did you separate a genuine loss of enterprise customers from a handful of large orders simply landing in a different quarter?",
    rationale: "Tests whether the candidate distinguished a structural change from timing noise.",
    expectedPoints: [
      "Distinguishes order count from order value",
      "Considers customer-level churn rather than order-level totals",
    ],
  },
  {
    pattern: /\bdiscount(?:ing|s)?\b/i,
    skillSlug: "critical-thinking",
    question: () =>
      "You raised discounting. Discounts rose and revenue fell — but how did you establish which caused which, rather than both being symptoms of weak demand?",
    rationale: "Tests causal reasoning versus correlation.",
    expectedPoints: [
      "Explicitly separates correlation from causation",
      "Proposes a way to test the direction (unit volume response to discount depth)",
    ],
  },
  {
    pattern: /\bpaid[_\s]?social\b/i,
    skillSlug: "data-analysis",
    question: () =>
      "You flagged paid_social. Did revenue from that source fall because the channel stopped performing, or because attribution shifted to another source? How would you tell the difference with this dataset?",
    rationale: "Tests awareness of attribution artefacts.",
    expectedPoints: [
      "Recognises attribution as an alternative explanation",
      "Proposes checking order counts and other sources for compensating gains",
    ],
  },
  {
    pattern: /\breturn(?:s|ed|ing)?\b/i,
    skillSlug: "data-analysis",
    question: () =>
      "You mention returns. In this export the `returned` flag is set on the original order row — did your revenue figures include or exclude returned orders, and why is that the right treatment?",
    rationale: "Tests whether the candidate reasoned about the measure definition.",
    expectedPoints: [
      "States clearly whether returns were netted off",
      "Justifies the treatment (gross vs net revenue) for this audience",
    ],
  },
  {
    pattern: /\bduplicat\w*/i,
    skillSlug: "data-analysis",
    question: () =>
      "You removed duplicates. What exactly did you treat as a duplicate — matching order_id, or the whole row — and how did you make sure you were not deleting two genuinely separate orders?",
    rationale: "Tests rigour in a step most candidates perform mechanically.",
    expectedPoints: [
      "Specifies the deduplication key",
      "Explains the risk of over-deleting and how it was checked",
    ],
  },
  {
    pattern: /\b(average|mean|median)\b/i,
    skillSlug: "statistics",
    question: (match) =>
      `You used the ${match} in your analysis. Given how skewed the order values are in this dataset, defend that choice over the alternative.`,
    rationale: "Tests statistical judgement rather than statistical vocabulary.",
    expectedPoints: [
      "Acknowledges the skew from large enterprise orders",
      "Justifies the chosen statistic for the specific question",
    ],
  },
  {
    pattern: /\b\d+(?:\.\d+)?\s*%/,
    skillSlug: "data-analysis",
    question: (match) =>
      `You quote a figure of ${match}. Show your working: what were the numerator and denominator, and which rows did you include or exclude to get there?`,
    rationale: "Tests that quoted numbers were computed, not estimated.",
    expectedPoints: [
      "States the exact numerator and denominator",
      "States the row filters applied",
    ],
  },
  {
    pattern: /\b(drop|remove|delete|exclude)(?:ped|ed|d)?\b/i,
    skillSlug: "critical-thinking",
    question: () =>
      "You dropped rows during cleaning. How much revenue did you remove in total, and how did you satisfy yourself that removing it did not itself create the trend you reported?",
    rationale: "Tests awareness that cleaning can manufacture findings.",
    expectedPoints: [
      "Quantifies the removed volume or revenue",
      "Considers whether removal was evenly distributed across quarters",
    ],
  },
];

const FALLBACK_QUESTIONS: GeneratedDefenseQuestion[] = [
  {
    question:
      "Take the single strongest claim in your submission. What specific number in the dataset supports it, and what would you have concluded if that number had been different?",
    rationale: "Baseline probe when the submission contains too little specific content to anchor to.",
    sourceExcerpt: "",
    targetSkillSlug: "critical-thinking",
    expectedPoints: [
      "Identifies a concrete claim from their own submission",
      "Cites the supporting figure",
      "Describes a falsifying condition",
    ],
  },
  {
    question:
      "Describe the first thing you did after opening the dataset, and what you learned from it that changed your approach.",
    rationale: "Baseline probe into actual working process.",
    sourceExcerpt: "",
    targetSkillSlug: "data-analysis",
    expectedPoints: [
      "Describes a real, specific first step",
      "Connects it to a decision made later",
    ],
  },
];

function excerptAround(text: string, index: number, radius = 120): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return `${start > 0 ? "..." : ""}${text.slice(start, end).trim()}${end < text.length ? "..." : ""}`;
}

/**
 * Build defense questions from the candidate's own submitted text.
 * Guarantees at least `min` questions by falling back to process probes.
 */
export function generateDeterministicDefenseQuestions(
  excerpts: SubmissionExcerpt[],
  max = 4,
): GeneratedDefenseQuestion[] {
  const questions: GeneratedDefenseQuestion[] = [];
  const usedProbes = new Set<number>();

  for (const excerpt of excerpts) {
    if (questions.length >= max) break;
    if (!excerpt.text || excerpt.text.trim().length < 20) continue;

    for (let i = 0; i < PROBES.length; i += 1) {
      if (questions.length >= max) break;
      if (usedProbes.has(i)) continue;
      const probe = PROBES[i];
      const match = probe.pattern.exec(excerpt.text);
      if (!match) continue;

      usedProbes.add(i);
      questions.push({
        question: probe.question(match[0]),
        rationale: probe.rationale,
        sourceExcerpt: excerptAround(excerpt.text, match.index),
        targetSkillSlug: probe.skillSlug,
        expectedPoints: probe.expectedPoints,
      });
    }
  }

  for (const fallback of FALLBACK_QUESTIONS) {
    if (questions.length >= Math.min(2, max)) break;
    questions.push(fallback);
  }

  return questions.slice(0, max);
}

/**
 * Deterministic defense answer scoring, used when AI is unavailable.
 *
 * This is deliberately conservative: it can recognise substantive, specific
 * engagement, but it caps the score well below "excellent" because a keyword
 * heuristic cannot certify genuine understanding.
 */
export interface DeterministicDefenseScore {
  score: number;
  matchedPoints: string[];
  notes: string;
  capped: boolean;
}

export function scoreDefenseAnswerDeterministically(
  answer: string,
  expectedPoints: string[],
  sourceExcerpt: string,
): DeterministicDefenseScore {
  const text = answer.toLowerCase();
  const words = answer.trim().split(/\s+/).filter(Boolean).length;

  if (words < 10) {
    return {
      score: words === 0 ? 0 : 15,
      matchedPoints: [],
      notes: "The answer was too short to demonstrate understanding.",
      capped: false,
    };
  }

  // Does the answer engage with the specifics of their own work?
  const excerptTerms = sourceExcerpt
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((t) => t.length > 4);
  const uniqueTerms = Array.from(new Set(excerptTerms));
  const overlap = uniqueTerms.filter((t) => text.includes(t)).length;
  const specificity = uniqueTerms.length === 0 ? 0 : overlap / uniqueTerms.length;

  const matchedPoints = expectedPoints.filter((point) => {
    const terms = point
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 4);
    if (terms.length === 0) return false;
    const hits = terms.filter((t) => text.includes(t)).length;
    return hits / terms.length >= 0.34;
  });

  const coverage = expectedPoints.length === 0 ? 0 : matchedPoints.length / expectedPoints.length;
  const hasNumbers = /\d/.test(answer);
  const depth = Math.min(1, words / 90);

  const raw =
    coverage * 40 + specificity * 20 + depth * 10 + (hasNumbers ? 5 : 0);

  // Hard cap: without a real evaluator we never certify a strong defense.
  const CAP = 72;
  const score = Math.min(CAP, Math.round(raw));

  return {
    score,
    matchedPoints,
    notes:
      "Scored by deterministic checks only (AI evaluation unavailable). Scores from this path are capped and marked medium/low confidence.",
    capped: raw > CAP,
  };
}
