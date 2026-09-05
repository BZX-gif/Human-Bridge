import { describe, expect, it } from "vitest";
import {
  matchCandidateToRequirements,
  type CandidateSkill,
  type RequiredSkill,
} from "@/lib/services/matching-service";

const sqlEssential: RequiredSkill = {
  slug: "sql",
  name: "SQL",
  importance: "essential",
  requiredLevel: "advanced",
  requiredScore: 75,
};

const tableauHelpful: RequiredSkill = {
  slug: "tableau",
  name: "Tableau",
  importance: "helpful",
  requiredLevel: "beginner",
  requiredScore: 35,
};

function candidate(over: Partial<CandidateSkill>): CandidateSkill {
  return {
    slug: "sql",
    name: "SQL",
    score: 85,
    level: "advanced",
    confidence: "high",
    verificationStatus: "assessed",
    ...over,
  };
}

describe("matchCandidateToRequirements", () => {
  it("refuses to score a role with no structured requirements", () => {
    const result = matchCandidateToRequirements([], [candidate({})]);
    expect(result.score).toBe(0);
    expect(result.eligible).toBe(false);
    expect(result.blockingReasons[0]).toContain("no structured skill requirements");
  });

  it("gates on essential skills — a strong helpful skill cannot compensate", () => {
    const result = matchCandidateToRequirements(
      [sqlEssential, tableauHelpful],
      [candidate({ slug: "tableau", name: "Tableau", score: 100 })],
    );
    expect(result.eligible).toBe(false);
    expect(result.blockingReasons.join(" ")).toContain("Essential SQL");
  });

  it("explains why a candidate is blocked instead of hiding it", () => {
    const result = matchCandidateToRequirements([sqlEssential], [candidate({ score: 30 })]);
    expect(result.eligible).toBe(false);
    expect(result.blockingReasons[0]).toContain("30");
    expect(result.blockingReasons[0]).toContain("75");
    expect(result.summary).toContain("Not yet ready");
  });

  it("discounts self-reported claims relative to assessed evidence", () => {
    const assessed = matchCandidateToRequirements(
      [sqlEssential],
      [candidate({ score: 90, verificationStatus: "assessed" })],
    );
    const selfReported = matchCandidateToRequirements(
      [sqlEssential],
      [candidate({ score: 90, verificationStatus: "self_reported" })],
    );
    expect(selfReported.score).toBeLessThan(assessed.score);
    // A self-reported 90 must not clear an essential advanced requirement.
    expect(selfReported.eligible).toBe(false);
    expect(assessed.eligible).toBe(true);
  });

  it("ranks employer-verified evidence at least as highly as assessed", () => {
    const assessed = matchCandidateToRequirements(
      [sqlEssential],
      [candidate({ score: 76, verificationStatus: "assessed" })],
    );
    const employer = matchCandidateToRequirements(
      [sqlEssential],
      [candidate({ score: 76, verificationStatus: "employer_verified" })],
    );
    expect(employer.score).toBeGreaterThanOrEqual(assessed.score);
  });

  it("weights essential requirements more heavily than helpful ones", () => {
    const essentialMet = matchCandidateToRequirements(
      [sqlEssential, tableauHelpful],
      [candidate({ score: 90 })],
    );
    const helpfulOnly = matchCandidateToRequirements(
      [sqlEssential, tableauHelpful],
      [candidate({ slug: "tableau", name: "Tableau", score: 90 })],
    );
    expect(essentialMet.score).toBeGreaterThan(helpfulOnly.score);
  });

  it("marks a missing skill as missing and lists it as a gap", () => {
    const result = matchCandidateToRequirements([sqlEssential], []);
    const match = result.skillMatches[0];
    expect(match.status).toBe("missing");
    expect(match.verified).toBe(false);
    expect(result.gaps).toContain("SQL");
  });

  it("caps the score at 100", () => {
    const result = matchCandidateToRequirements(
      [sqlEssential],
      [candidate({ score: 100, verificationStatus: "employer_verified" })],
    );
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
