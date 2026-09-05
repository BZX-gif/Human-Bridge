import { describe, expect, it } from "vitest";
import { gradeItem } from "@/lib/assessment/auto-grader";
import type { AnswerKey } from "@/lib/assessment/types";

describe("gradeItem — server-side deterministic grading", () => {
  it("returns a non-deterministic empty result when there is no answer key", () => {
    const result = gradeItem(null, { kind: "text", text: "anything" });
    expect(result.deterministic).toBe(false);
    expect(result.score).toBe(0);
  });

  it("never awards a default score for a missing response", () => {
    const result = gradeItem({ kind: "mcq", correctIndex: 1 }, null);
    expect(result.score).toBe(0);
    expect(result.deterministic).toBe(false);
  });

  it("scores MCQ items strictly", () => {
    const key: AnswerKey = { kind: "mcq", correctIndex: 2 };
    expect(gradeItem(key, { kind: "choice", index: 2 }).score).toBe(100);
    expect(gradeItem(key, { kind: "choice", index: 0 }).score).toBe(0);
    expect(gradeItem(key, { kind: "choice", index: 0 }).isCorrect).toBe(false);
  });

  it("gives partial credit on multi-select but penalises false positives", () => {
    const key: AnswerKey = { kind: "multi_select", correctIndexes: [0, 1] };
    expect(gradeItem(key, { kind: "choices", indexes: [0, 1] }).score).toBe(100);
    expect(gradeItem(key, { kind: "choices", indexes: [0] }).score).toBe(50);
    // one hit, one false positive -> net zero
    expect(gradeItem(key, { kind: "choices", indexes: [0, 3] }).score).toBe(0);
    // guessing everything must not pass
    expect(gradeItem(key, { kind: "choices", indexes: [0, 1, 2, 3] }).score).toBe(0);
  });

  it("applies tolerance and graceful decay to numeric answers", () => {
    const key: AnswerKey = { kind: "numeric", value: 2840, tolerance: 2 };
    expect(gradeItem(key, { kind: "number", value: 2840 }).isCorrect).toBe(true);
    expect(gradeItem(key, { kind: "number", value: 2841 }).score).toBe(100);
    expect(gradeItem(key, { kind: "number", value: 2900 }).score).toBe(0);
    const close = gradeItem(key, { kind: "number", value: 2843 });
    expect(close.isCorrect).toBe(false);
    expect(close.score).toBeGreaterThan(0);
    expect(close.score).toBeLessThan(100);
  });

  it("checks SQL structurally and penalises forbidden clauses", () => {
    const key: AnswerKey = {
      kind: "sql",
      requiredClauses: [
        { label: "group by region", any: ["group by region"] },
        { label: "sum revenue", any: ["sum(revenue)"] },
      ],
      forbiddenClauses: [{ label: "select star", any: ["select *"] }],
    };

    const good = gradeItem(key, {
      kind: "text",
      text: "SELECT region, SUM(revenue) FROM orders GROUP BY region",
    });
    expect(good.score).toBe(100);
    expect(good.isCorrect).toBe(true);

    const withStar = gradeItem(key, {
      kind: "text",
      text: "SELECT *, SUM(revenue) FROM orders GROUP BY region",
    });
    expect(withStar.score).toBe(80);
    expect(withStar.isCorrect).toBe(false);

    expect(gradeItem(key, { kind: "text", text: "" }).score).toBe(0);
  });

  it("scores keyword answers by distinct ideas, not string length", () => {
    const key: AnswerKey = {
      kind: "keywords",
      groups: [
        { label: "returns", any: ["return rate", "returns"] },
        { label: "paid social", any: ["paid social"] },
      ],
    };

    expect(gradeItem(key, { kind: "text", text: "returns spiked and paid social collapsed" }).score).toBe(100);
    expect(gradeItem(key, { kind: "text", text: "returns went up" }).score).toBe(50);
    // A long, empty-of-substance answer scores zero.
    expect(
      gradeItem(key, { kind: "text", text: "I think the business had a difficult quarter overall." })
        .score,
    ).toBe(0);
  });
});
