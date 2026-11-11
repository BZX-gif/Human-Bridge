"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Clock, Save } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import { DatasetPreview } from "./DatasetPreview";
import { ItemInput } from "./ItemInput";
import type { PublicBlueprint } from "@/lib/services/assessment-service";
import type { ResponseValue } from "@/lib/assessment/types";
import { InlineText } from "@/components/ui/InlineText";

interface DatasetInfo {
  datasetKey: string;
  columns: string[];
  rows: Record<string, string | number>[];
  totalRows: number;
}

interface Props {
  blueprint: PublicBlueprint;
  attemptId: number;
  dataset: DatasetInfo;
  scenario: string;
}

interface ItemMeta {
  timeSpentSeconds: number;
  pastedCharacters: number;
  focusLossCount: number;
  revisions: number;
}

const AUTOSAVE_MS = 20_000;

export function AssessmentWorkspace({ blueprint, attemptId, dataset, scenario }: Props) {
  const router = useRouter();
  // The defense section is answered after evaluation, not in the workspace.
  const sections = useMemo(
    () => blueprint.sections.filter((s) => s.kind !== "defense"),
    [blueprint.sections],
  );

  const [sectionIndex, setSectionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [meta, setMeta] = useState<Record<string, ItemMeta>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(blueprint.durationMinutes * 60);

  // Set once on mount (never during render — Date.now() is impure).
  const startedAt = useRef(0);
  const dirty = useRef(false);
  const section = sections[sectionIndex];

  // ── Countdown ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (startedAt.current === 0) startedAt.current = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      setRemainingSeconds(Math.max(0, blueprint.durationMinutes * 60 - elapsed));
    }, 1000);
    return () => clearInterval(timer);
  }, [blueprint.durationMinutes]);

  // ── Integrity signal: tab focus loss (coarse, non-invasive) ─────────────
  useEffect(() => {
    const onBlur = () => {
      const key = section?.items[0]?.key;
      if (!key) return;
      setMeta((prev) => ({
        ...prev,
        [key]: { ...blankMeta(prev[key]), focusLossCount: (prev[key]?.focusLossCount ?? 0) + 1 },
      }));
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [section]);

  const saveSection = useCallback(
    async (sectionKey: string, silent = false) => {
      const target = sections.find((s) => s.key === sectionKey);
      if (!target) return;

      const payload = target.items
        .filter((item) => responses[item.key] !== undefined)
        .map((item) => ({
          itemKey: item.key,
          response: responses[item.key],
          metadata: {
            timeSpentSeconds: meta[item.key]?.timeSpentSeconds ?? 0,
            pastedCharacters: meta[item.key]?.pastedCharacters ?? 0,
            focusLossCount: meta[item.key]?.focusLossCount ?? 0,
            revisions: meta[item.key]?.revisions ?? 0,
          },
        }));

      if (payload.length === 0) return;
      if (!silent) setSaving(true);
      try {
        await apiFetch(`/api/assessments/${attemptId}/responses`, {
          method: "POST",
          json: { attemptId, sectionKey, responses: payload },
        });
        setSavedAt(new Date());
        dirty.current = false;
        setError(null);
      } catch (e) {
        if (e instanceof ApiClientError) setError(e.message);
      } finally {
        setSaving(false);
      }
    },
    [attemptId, meta, responses, sections],
  );

  // ── Autosave ────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      if (dirty.current && section) void saveSection(section.key, true);
    }, AUTOSAVE_MS);
    return () => clearInterval(timer);
  }, [saveSection, section]);

  const setResponse = (itemKey: string, value: ResponseValue) => {
    dirty.current = true;
    setResponses((prev) => ({ ...prev, [itemKey]: value }));
    setMeta((prev) => ({
      ...prev,
      [itemKey]: { ...blankMeta(prev[itemKey]), revisions: (prev[itemKey]?.revisions ?? 0) + 1 },
    }));
  };

  const recordPaste = (itemKey: string, characters: number) => {
    setMeta((prev) => ({
      ...prev,
      [itemKey]: {
        ...blankMeta(prev[itemKey]),
        pastedCharacters: (prev[itemKey]?.pastedCharacters ?? 0) + characters,
      },
    }));
  };

  const goToSection = async (index: number) => {
    if (section) await saveSection(section.key);
    setSectionIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!section) return;
    setSubmitting(true);
    setError(null);
    try {
      await saveSection(section.key);
      const totalTimeSeconds = Math.floor((Date.now() - startedAt.current) / 1000);
      await apiFetch(`/api/assessments/${attemptId}/submit`, {
        method: "POST",
        json: {
          attemptId,
          totalTimeSeconds,
          sections: sections.map((s) => ({
            sectionKey: s.key,
            content: { completed: true },
          })),
        },
      });
      // Evaluation happens entirely on the server.
      await apiFetch(`/api/assessments/${attemptId}/evaluate`, {
        method: "POST",
        json: { attemptId },
      });
      router.push(`/assessments/attempt/${attemptId}/defense`);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Submission failed. Please try again.");
      setSubmitting(false);
    }
  };

  if (!section) {
    return <ErrorState message="This assessment has no sections configured." />;
  }

  const answeredInSection = section.items.filter(
    (item) => responses[item.key] !== undefined,
  ).length;
  const isLast = sectionIndex === sections.length - 1;
  const showDataset = Boolean(section.config?.datasetKey);

  return (
    <div className="pb-40 md:pb-28">
      {/* Sticky workspace header. Sits under the mobile top bar; at the very top on desktop. */}
      <header className="hb-glass-bar hb-glass-dense sticky top-[52px] z-30 border-b border-black/[0.06] md:top-0">
        <div className="hb-container py-3 sm:py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted">Work simulation</p>
              <h1 className="truncate text-base font-semibold tracking-[-0.01em] text-ink sm:text-lg">
                {blueprint.title}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-sm text-muted sm:inline" aria-live="polite">
                {saving ? "Saving…" : savedAt ? `Saved ${formatClock(savedAt)}` : "Not saved yet"}
              </span>
              <span
                className={cn(
                  "tabular inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold",
                  remainingSeconds < 600 ? "bg-rust-soft text-rust" : "bg-paper-3 text-ink",
                )}
                role="timer"
                aria-live="off"
              >
                <Clock size={15} aria-hidden />
                {formatTime(remainingSeconds)}
              </span>
            </div>
          </div>

          {/* Section progress */}
          <nav aria-label="Assessment sections" className="hb-scroll-x -mx-1 mt-2.5 flex gap-1.5 px-1 pb-0.5 sm:mt-3">
            {sections.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => void goToSection(i)}
                aria-current={i === sectionIndex ? "step" : undefined}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-200 ease-apple",
                  i === sectionIndex ? "bg-ink text-paper" : "bg-paper-3 text-graphite hover:bg-paper-4",
                )}
              >
                {i + 1}. {s.title}
                <span
                  className={cn("tabular ml-1.5 font-normal", i === sectionIndex ? "text-paper/70" : "text-muted")}
                >
                  {s.weight}%
                </span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main id="main-content" className="hb-container py-7 sm:py-9">
        {/* Scenario brief */}
        {sectionIndex === 0 && (
          <section className="hb-card mb-9 p-6 sm:p-8">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">The brief</h2>
            <div className="mt-4 max-w-4xl space-y-3.5 text-base leading-relaxed text-graphite">
              {scenario.split("\n\n").map((para, i) => (
                <p key={i} className={para.startsWith(">") ? "rounded-md bg-paper-2 px-5 py-4 text-ink" : ""}>
                  <InlineText>{para.replace(/^>\s?/, "").replace(/\*\*/g, "")}</InlineText>
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Section header */}
        <div key={section.key} className="hb-swap-in mb-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
            <h2 className="display-sm text-ink">{section.title}</h2>
            <p className="tabular text-sm text-muted">
              <span className="font-medium text-ink">
                {answeredInSection} of {section.items.length}
              </span>{" "}
              answered · worth {section.weight}% of your result
            </p>
          </div>
          {section.instructions && (
            <p className="mt-2.5 max-w-3xl text-base leading-relaxed text-muted">
              <InlineText>{section.instructions}</InlineText>
            </p>
          )}
        </div>

        {showDataset && (
          <div className="mb-6">
            <DatasetPreview {...dataset} />
          </div>
        )}

        {/* Items */}
        <div className="space-y-4">
          {section.items.map((item, index) => (
            <article key={item.key} className="hb-card p-5 sm:p-7">
              <div className="mb-4 flex items-start gap-3.5">
                <span className="tabular mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-link">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold leading-relaxed text-ink">
                    <InlineText>{item.prompt}</InlineText>
                  </h3>
                  {item.helperText && (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.helperText}</p>
                  )}
                </div>
                {responses[item.key] !== undefined && (
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-moss-soft text-moss">
                    <Check size={14} strokeWidth={2.6} aria-label="Answered" />
                  </span>
                )}
              </div>
              <div className="sm:pl-[42px]">
                <ItemInput
                  item={item}
                  value={responses[item.key]}
                  onChange={(value) => setResponse(item.key, value)}
                  onPaste={(chars) => recordPaste(item.key, chars)}
                />
              </div>
            </article>
          ))}
        </div>

        {error && (
          <div className="mt-6">
            <ErrorState message={error} onRetry={() => setError(null)} />
          </div>
        )}
      </main>

      {/* Action bar. Clears the mobile tab bar and the desktop sidebar. */}
      <div className="hb-glass-bar hb-glass-dense fixed inset-x-0 bottom-[58px] z-30 border-t border-black/[0.06] md:bottom-0 md:left-[260px]">
        {isLast && (
          <p className="flex items-start justify-center gap-2 border-b border-ochre/15 bg-ochre-soft px-4 py-2.5 text-center text-xs leading-relaxed text-ochre sm:px-6">
            <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />
            <span>
              After submitting you will answer defense questions generated from your own work. Your
              score is calculated on the server — nothing in this browser decides your result.
            </span>
          </p>
        )}
        <div className="hb-container flex items-center justify-between gap-3 py-3">
          <Button
            variant="secondary"
            size="md"
            className="max-sm:w-10 max-sm:px-0"
            onClick={() => void goToSection(sectionIndex - 1)}
            disabled={sectionIndex === 0 || submitting}
            aria-label="Previous section"
          >
            <ChevronLeft size={16} aria-hidden />
            <span className="max-sm:hidden">Previous</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="md"
              onClick={() => void saveSection(section.key)}
              disabled={saving || submitting}
            >
              <Save size={15} aria-hidden />
              {saving ? "Saving" : "Save"}
            </Button>
            {isLast ? (
              <Button size="md" onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? (
                  <>
                    <span className="sm:hidden">Submitting…</span>
                    <span className="max-sm:hidden">Submitting for evaluation…</span>
                  </>
                ) : (
                  "Submit for evaluation"
                )}
              </Button>
            ) : (
              <Button size="md" onClick={() => void goToSection(sectionIndex + 1)} disabled={submitting}>
                Next section
                <ChevronRight size={16} aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function blankMeta(existing?: ItemMeta): ItemMeta {
  return (
    existing ?? { timeSpentSeconds: 0, pastedCharacters: 0, focusLossCount: 0, revisions: 0 }
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
