"use client";

import { useState } from "react";
import { Check, Copy, Lock, Loader2 } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Props {
  publicId: string | null;
  isPublic: boolean;
  visibility: Record<string, boolean>;
}

const TOGGLES: { key: string; label: string; help: string }[] = [
  { key: "skills", label: "Skills and evidence", help: "Skill names, scores, levels and the evidence behind them." },
  { key: "projects", label: "Projects", help: "Public projects with descriptions, links and reflections." },
  { key: "journey", label: "Learning journey", help: "Roadmap progress and completed milestones." },
  { key: "assessments", label: "Assessment history", help: "Which assessments you have taken and the results." },
  { key: "evidence", label: "Evidence detail", help: "Individual evidence entries behind each score." },
  { key: "contact", label: "Links and location", help: "Professional links and your city. Email is never shown." },
];

/**
 * Candidate-controlled privacy. Nothing is public by default — the candidate
 * opts in, then chooses which sections a public viewer can see.
 */
export function PassportPrivacyControls({ publicId, isPublic, visibility }: Props) {
  const [publicEnabled, setPublicEnabled] = useState(isPublic);
  const [flags, setFlags] = useState(visibility);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const save = async (next: { isPublic?: boolean; visibility?: Record<string, boolean> }) => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/passport/privacy", { method: "POST", json: next });
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not save your privacy settings.");
    } finally {
      setSaving(false);
    }
  };

  const shareUrl =
    publicId && typeof window !== "undefined"
      ? `${window.location.origin}/passport/${publicId}`
      : "";

  return (
    <section id="visibility" className="scroll-mt-24 rounded-lg border border-line bg-paper p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        <Lock size={14} aria-hidden />
        Visibility and sharing
      </h2>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
        Your portfolio is private until you choose otherwise. Your email and account details are
        never exposed on a public page.
      </p>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-md border border-line bg-paper-2 p-3.5">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-ink"
          checked={publicEnabled}
          onChange={(event) => {
            setPublicEnabled(event.target.checked);
            void save({ isPublic: event.target.checked });
          }}
        />
        <span>
          <span className="block text-[12px] font-medium text-ink">Enable a public portfolio link</span>
          <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">
            Anyone with the link can view only the sections you allow below.
          </span>
        </span>
      </label>

      {publicEnabled && publicId && (
        <div className="mt-2.5 flex items-center gap-2 rounded-md border border-line px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-[11px] text-graphite">
            {shareUrl}
          </code>
          <button
            type="button"
            onClick={() => {
              if (!shareUrl) return;
              void navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-[4px] border border-line px-2 py-1 text-[10.5px] font-medium text-graphite transition-colors hover:border-line-strong hover:text-ink"
          >
            {copied ? <Check size={11} aria-hidden /> : <Copy size={11} aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      <fieldset className="mt-5">
        <legend className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          What a public viewer can see
        </legend>
        <div className="divide-y divide-line">
          {TOGGLES.map((toggle) => (
            <label key={toggle.key} className="flex cursor-pointer items-start justify-between gap-4 py-2.5">
              <span>
                <span className="block text-[12px] text-graphite">{toggle.label}</span>
                <span className="mt-0.5 block text-[10.5px] leading-relaxed text-faint">{toggle.help}</span>
              </span>
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 accent-ink"
                checked={flags[toggle.key] !== false}
                onChange={(event) => {
                  const next = { ...flags, [toggle.key]: event.target.checked };
                  setFlags(next);
                  void save({ visibility: next });
                }}
                aria-label={toggle.label}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <p
        className={cn(
          "mt-4 flex items-center gap-1.5 text-[10.5px]",
          error ? "text-rust" : "text-faint",
        )}
        aria-live="polite"
      >
        {saving && <Loader2 size={10} className="animate-spin" aria-hidden />}
        {saving
          ? "Saving…"
          : error
            ? error
            : savedAt
              ? "Changes saved."
              : "Changes save automatically."}
      </p>
    </section>
  );
}
