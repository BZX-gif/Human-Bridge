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
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      {/* Sticky workspace header */}
      <header className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1a56ff]">
                Work simulation
              </p>
              <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {blueprint.title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold tabular-nums",
                  remainingSeconds < 600
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-100 text-slate-600",
                )}
                role="timer"
                aria-live="off"
              >
                <Clock size={13} aria-hidden />
                {formatTime(remainingSeconds)}
              </span>
              <span className="hidden text-xs text-slate-400 sm:inline">
                {saving ? "Saving..." : savedAt ? `Saved ${formatClock(savedAt)}` : "Not saved yet"}
              </span>
            </div>
          </div>

          {/* Section progress */}
          <nav aria-label="Assessment sections" className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {sections.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => void goToSection(i)}
                aria-current={i === sectionIndex ? "step" : undefined}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56ff]",
                  i === sectionIndex
                    ? "bg-[#1a56ff] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {i + 1}. {s.title}
                <span className="ml-1.5 opacity-70">{s.weight}%</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Scenario brief */}
        {sectionIndex === 0 && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-900">
              The brief
            </h2>
            <div className="prose-sm max-w-none space-y-3 text-sm leading-relaxed text-slate-600">
              {scenario.split("\n\n").map((para, i) => (
                <p key={i} className={para.startsWith(">") ? "border-l-2 border-[#1a56ff] pl-4 italic" : ""}>
                  {para.replace(/^>\s?/, "").replace(/\*\*/g, "")}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Section header */}
        <div className="mb-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
            <p className="text-xs text-slate-500">
              {answeredInSection} of {section.items.length} answered · worth {section.weight}% of
              your result
            </p>
          </div>
          {section.instructions && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              {section.instructions}
            </p>
          )}
        </div>

        {showDataset && (
          <div className="mb-6">
            <DatasetPreview {...dataset} />
          </div>
        )}

        {/* Items */}
        <div className="space-y-5">
          {section.items.map((item, index) => (
            <article
              key={item.key}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
            >
              <div className="mb-3 flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold leading-relaxed text-slate-900">
                    {item.prompt}
                  </h3>
                  {item.helperText && (
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {item.helperText}
                    </p>
                  )}
                </div>
                {responses[item.key] !== undefined && (
                  <Check size={16} className="mt-1 shrink-0 text-green-500" aria-label="Answered" />
                )}
              </div>
              <div className="sm:pl-9">
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

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void goToSection(sectionIndex - 1)}
            disabled={sectionIndex === 0 || submitting}
          >
            <ChevronLeft size={14} aria-hidden />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void saveSection(section.key)}
              disabled={saving || submitting}
            >
              <Save size={14} aria-hidden />
              {saving ? "Saving" : "Save"}
            </Button>
            {isLast ? (
              <Button size="sm" onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? "Submitting for evaluation..." : "Submit for evaluation"}
              </Button>
            ) : (
              <Button size="sm" onClick={() => void goToSection(sectionIndex + 1)} disabled={submitting}>
                Next section
                <ChevronRight size={14} aria-hidden />
              </Button>
            )}
          </div>
        </div>
        {isLast && (
          <p className="border-t border-slate-100 bg-amber-50/60 px-4 py-2 text-center text-[11px] text-amber-800 sm:px-6">
            <AlertTriangle size={11} className="mr-1 inline" aria-hidden />
            After submitting you will answer defense questions generated from your own work. Your
            score is calculated on the server — nothing in this browser decides your result.
          </p>
        )}
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
