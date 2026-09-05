import { describe, expect, it } from "vitest";
import {
  aggregateSkillScores,
  computeOverallScore,
  computeReadiness,
  decidePass,
} from "@/lib/assessment/scoring";
import { resolveConfidence, resolveSkillLevel } from "@/lib/assessment/skill-level";
import type { PassingPolicy, SectionScore } from "@/lib/assessment/types";

const POLICY: PassingPolicy = {
  minOverall: 65,
  minPractical: 60,
  minDefense: 55,
  essentialSkillFloor: 60,
  blockOnIntegrityFlag: true,
};

function section(over: Partial<SectionScore>): SectionScore {
  return {
    sectionKey: "s",
    title: "Section",
    sectionKind: "practical",
    weight: 30,
    score: 70,
    evaluated: true,
    notes: null,
    ...over,
  } as SectionScore;
}

describe("computeOverallScore", () => {
  it("is weight-weighted and ignores unevaluated sections", () => {
    const score = computeOverallScore([
      section({ sectionKey: "k", sectionKind: "knowledge", weight: 20, score: 100 }),
      section({ sectionKey: "p", sectionKind: "practical", weight: 80, score: 50 }),
    ]);
    expect(score).toBe(60);
  });

  it("returns 0 — never a default of 85 — when nothing was evaluated", () => {
    expect(computeOverallScore([])).toBe(0);
    expect(
      computeOverallScore([section({ evaluated: false, score: 0 })]),
    ).toBe(0);
  });
});

describe("resolveSkillLevel — levels require real evidence", () => {
  it("is not_evaluated with no evidence, regardless of score", () => {
    expect(resolveSkillLevel(95, [])).toBe("not_evaluated");
  });

  it("caps a knowledge-only candidate below advanced even at a perfect score", () => {
    expect(resolveSkillLevel(100, ["knowledge"])).toBe("intermediate");
  });

  it("allows advanced only with practical evidence", () => {
    expect(resolveSkillLevel(80, ["knowledge"])).toBe("intermediate");
    expect(resolveSkillLevel(80, ["knowledge", "practical"])).toBe("advanced");
  });

  it("allows expert only with practical AND defense evidence", () => {
    expect(resolveSkillLevel(95, ["practical"])).toBe("advanced");
    expect(resolveSkillLevel(95, ["practical", "defense"])).toBe("expert");
  });
});

describe("resolveConfidence", () => {
  it("never reports high confidence from a single knowledge section", () => {
    expect(resolveConfidence(["knowledge"], 1)).toBe("low");
    expect(resolveConfidence(["knowledge"], 12)).toBe("low");
  });

  it("reaches high confidence only with practical and defense evidence", () => {
    expect(resolveConfidence(["practical"], 2)).toBe("medium");
    expect(resolveConfidence(["practical", "defense"], 3)).toBe("high");
  });
});

describe("aggregateSkillScores", () => {
  it("weights practical evidence above knowledge evidence", () => {
    const [skill] = aggregateSkillScores([
      { skillSlug: "sql", score: 100, sectionKey: "k", sectionKind: "knowledge", weight: 50 },
      { skillSlug: "sql", score: 0, sectionKey: "p", sectionKind: "practical", weight: 50 },
    ]);
    // knowledge 0.6, practical 1.4 -> below 50
    expect(skill.score).toBeLessThan(50);
    expect(skill.evidenceKinds).toEqual(["knowledge", "practical"]);
  });

  it("records a per-section breakdown so every score is explainable", () => {
    const [skill] = aggregateSkillScores([
      { skillSlug: "sql", score: 80, sectionKey: "p", sectionKind: "practical", weight: 30 },
    ]);
    expect(skill.breakdown).toHaveLength(1);
    expect(skill.breakdown[0].sectionKey).toBe("p");
  });
});

describe("computeReadiness", () => {
  it("penalises unevaluated essential skills", () => {
    const readiness = computeReadiness(80, [], ["sql", "data-analysis"], POLICY);
    expect(readiness).toBe(64); // 80 - 8 - 8
  });

  it("equals the overall score when the role defines no essential skills", () => {
    expect(computeReadiness(72, [], [], POLICY)).toBe(72);
  });
});

describe("decidePass — nothing passes automatically", () => {
  const base = {
    overallScore: 80,
    readinessScore: 80,
    sectionScores: [
      section({ sectionKey: "p", sectionKind: "practical", weight: 30, score: 80 }),
      section({ sectionKey: "d", sectionKind: "defense", weight: 20, score: 75 }),
    ],
    skillScores: [],
    essentialSkillSlugs: [],
    policy: POLICY,
    integrityStatus: "normal" as const,
  };

  it("passes only when every gate clears", () => {
    expect(decidePass(base).passed).toBe(true);
  });

  it("fails when no practical work was evaluated, even on a perfect knowledge score", () => {
    const decision = decidePass({
      ...base,
      overallScore: 100,
      sectionScores: [section({ sectionKind: "knowledge", weight: 100, score: 100 })],
    });
    expect(decision.passed).toBe(false);
    expect(decision.failReasons.join(" ")).toContain("No practical work");
  });

  it("fails when knowledge is strong but practical work is weak", () => {
    const decision = decidePass({
      ...base,
      sectionScores: [
        section({ sectionKind: "knowledge", weight: 20, score: 100 }),
        section({ sectionKind: "practical", weight: 30, score: 40 }),
      ],
    });
    expect(decision.passed).toBe(false);
    expect(decision.failReasons.join(" ")).toContain("cannot compensate");
  });

  it("fails on an unmet essential skill floor even with a high overall score", () => {
    const decision = decidePass({
      ...base,
      essentialSkillSlugs: ["sql"],
      skillScores: [
        {
          skillSlug: "sql",
          score: 40,
          level: "beginner",
          confidence: "low",
          evidenceKinds: ["practical"],
          breakdown: [],
        },
      ],
    });
    expect(decision.passed).toBe(false);
    expect(decision.failReasons.join(" ")).toContain("sql");
  });

  it("fails when an essential skill was never evaluated", () => {
    const decision = decidePass({ ...base, essentialSkillSlugs: ["sql"] });
    expect(decision.passed).toBe(false);
    expect(decision.failReasons.join(" ")).toContain("was not evaluated");
  });

  it("holds a flagged attempt rather than issuing a pass", () => {
    const decision = decidePass({ ...base, integrityStatus: "flagged" });
    expect(decision.passed).toBe(false);
    expect(decision.failReasons.join(" ")).toContain("integrity review");
  });

  it("does not block on integrity when the status is only review", () => {
    expect(decidePass({ ...base, integrityStatus: "review" }).passed).toBe(true);
  });
});
