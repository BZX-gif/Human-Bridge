/**
 * Integrity signals. Deliberately non-invasive: no webcam, no keystroke
 * fingerprinting. We collect coarse behavioural metadata and only ever escalate
 * to "review" — never an automatic accusation of cheating from one signal.
 */
export interface ResponseMetadata {
  timeSpentSeconds?: number;
  pasteCount?: number;
  pastedCharacters?: number;
  focusLossCount?: number;
  revisions?: number;
}

export interface IntegritySignal {
  code: string;
  label: string;
  severity: "info" | "warn";
  detail: string;
}

export interface IntegrityAssessment {
  status: "normal" | "review" | "flagged";
  signals: IntegritySignal[];
}

export interface IntegrityInput {
  totalTimeSeconds: number;
  expectedMinimumSeconds: number;
  itemMetadata: ResponseMetadata[];
  longFormTexts: string[];
}

export function assessIntegrity(input: IntegrityInput): IntegrityAssessment {
  const signals: IntegritySignal[] = [];

  if (input.totalTimeSeconds > 0 && input.totalTimeSeconds < input.expectedMinimumSeconds) {
    signals.push({
      code: "FAST_COMPLETION",
      label: "Unusually fast completion",
      severity: "warn",
      detail: `Completed in ${Math.round(input.totalTimeSeconds / 60)} minutes against an expected minimum of ${Math.round(
        input.expectedMinimumSeconds / 60,
      )} minutes.`,
    });
  }

  const rapid = input.itemMetadata.filter(
    (m) => (m.timeSpentSeconds ?? Infinity) < 3,
  ).length;
  if (rapid >= 5) {
    signals.push({
      code: "RAPID_ANSWERS",
      label: "Rapid answer pattern",
      severity: "warn",
      detail: `${rapid} responses were submitted in under 3 seconds.`,
    });
  }

  const pastedChars = input.itemMetadata.reduce(
    (sum, m) => sum + (m.pastedCharacters ?? 0),
    0,
  );
  const writtenChars = input.longFormTexts.reduce((sum, t) => sum + t.length, 0);
  if (writtenChars > 0 && pastedChars / writtenChars > 0.8 && pastedChars > 400) {
    signals.push({
      code: "HIGH_PASTE_RATIO",
      label: "Most written content was pasted",
      severity: "info",
      detail:
        "A large share of the written work was pasted. This is not itself a violation — the defense round exists to check understanding.",
    });
  }

  const duplicates = findDuplicates(input.longFormTexts);
  if (duplicates > 0) {
    signals.push({
      code: "REPEATED_SUBMISSION",
      label: "Repeated identical answers",
      severity: "warn",
      detail: `${duplicates} written answers were identical to another answer.`,
    });
  }

  const focusLoss = input.itemMetadata.reduce((sum, m) => sum + (m.focusLossCount ?? 0), 0);
  if (focusLoss > 25) {
    signals.push({
      code: "FREQUENT_FOCUS_LOSS",
      label: "Frequent tab switching",
      severity: "info",
      detail: `The assessment tab lost focus ${focusLoss} times. Research is allowed; this is context only.`,
    });
  }

  const warnings = signals.filter((s) => s.severity === "warn").length;
  const status: IntegrityAssessment["status"] =
    warnings >= 2 ? "flagged" : warnings === 1 ? "review" : "normal";

  return { status, signals };
}

function findDuplicates(texts: string[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const text of texts) {
    const key = text.toLowerCase().replace(/\s+/g, " ").trim();
    if (key.length < 40) continue;
    if (seen.has(key)) duplicates += 1;
    seen.add(key);
  }
  return duplicates;
}
