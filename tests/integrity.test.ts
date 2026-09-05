import { describe, expect, it } from "vitest";
import { assessIntegrity } from "@/lib/assessment/integrity";

const clean = {
  totalTimeSeconds: 3600,
  expectedMinimumSeconds: 900,
  itemMetadata: [{ timeSpentSeconds: 120 }, { timeSpentSeconds: 240 }],
  longFormTexts: ["A considered answer about the revenue decline and its drivers."],
};

describe("assessIntegrity — signals, not accusations", () => {
  it("returns normal for an ordinary attempt", () => {
    const result = assessIntegrity(clean);
    expect(result.status).toBe("normal");
    expect(result.signals).toHaveLength(0);
  });

  it("never flags on a single signal — one warning is only review", () => {
    const result = assessIntegrity({ ...clean, totalTimeSeconds: 120 });
    expect(result.status).toBe("review");
    expect(result.signals.map((s) => s.code)).toContain("FAST_COMPLETION");
  });

  it("escalates to flagged only when two independent warnings coincide", () => {
    const result = assessIntegrity({
      ...clean,
      totalTimeSeconds: 120,
      itemMetadata: Array.from({ length: 6 }, () => ({ timeSpentSeconds: 1 })),
    });
    expect(result.status).toBe("flagged");
    expect(result.signals.filter((s) => s.severity === "warn").length).toBeGreaterThanOrEqual(2);
  });

  it("treats heavy pasting as informational only, not a violation", () => {
    const text = "x".repeat(1000);
    const result = assessIntegrity({
      ...clean,
      itemMetadata: [{ pastedCharacters: 1000 }],
      longFormTexts: [text],
    });
    const paste = result.signals.find((s) => s.code === "HIGH_PASTE_RATIO");
    expect(paste?.severity).toBe("info");
    expect(result.status).toBe("normal");
  });

  it("treats tab switching as context only — research is allowed", () => {
    const result = assessIntegrity({
      ...clean,
      itemMetadata: [{ focusLossCount: 50 }],
    });
    const focus = result.signals.find((s) => s.code === "FREQUENT_FOCUS_LOSS");
    expect(focus?.severity).toBe("info");
    expect(result.status).toBe("normal");
  });

  it("detects duplicated long-form answers", () => {
    const dup = "This is a long enough duplicated answer to be worth comparing across items.";
    const result = assessIntegrity({ ...clean, longFormTexts: [dup, dup] });
    expect(result.signals.map((s) => s.code)).toContain("REPEATED_SUBMISSION");
  });

  it("ignores short duplicated strings", () => {
    const result = assessIntegrity({ ...clean, longFormTexts: ["yes", "yes"] });
    expect(result.signals.map((s) => s.code)).not.toContain("REPEATED_SUBMISSION");
  });
});
