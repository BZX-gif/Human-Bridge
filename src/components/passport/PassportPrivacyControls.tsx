"use client";

import { useState, useSyncExternalStore } from "react";
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

function subscribeToNothing(): () => void {
  return () => {};
}

function readOrigin(): string {
  return window.location.origin;
}

function readServerOrigin(): string {
  return "";
}

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

  // The origin is only known in the browser. Reading it through an external
  // store keeps the server and hydration renders identical (path only), then
  // upgrades to the absolute URL without a hydration mismatch.
  const origin = useSyncExternalStore(subscribeToNothing, readOrigin, readServerOrigin);
  const shareUrl = publicId ? `${origin}/passport/${publicId}` : "";

  return (
    <section id="visibility" className="hb-card scroll-mt-24 p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
        <Lock size={16} aria-hidden />
        Visibility and sharing
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Your portfolio is private until you choose otherwise. Your email and account details are
        never exposed on a public page.
      </p>

      <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-md bg-paper-2 p-4">
        <span>
          <span className="block text-sm font-semibold text-ink">Public portfolio link</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
            Anyone with the link can view only the sections you allow below.
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          className="hb-switch"
          checked={publicEnabled}
          onChange={(event) => {
            setPublicEnabled(event.target.checked);
            void save({ isPublic: event.target.checked });
          }}
        />
      </label>

      {publicEnabled && publicId && (
        <div className="hb-swap-in mt-2.5 flex items-center gap-2 rounded-md bg-paper-2 py-2 pl-4 pr-2">
          <code className="min-w-0 flex-1 truncate text-xs text-graphite">{shareUrl}</code>
          <button
            type="button"
            onClick={() => {
              if (!shareUrl) return;
              void navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-[background-color,color,transform] duration-200 ease-apple active:scale-[0.97]",
              copied ? "bg-moss-soft text-moss" : "bg-paper text-ink shadow-xs hover:bg-paper-3",
            )}
          >
            {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      <fieldset className="mt-6">
        <legend className="mb-1 text-sm font-semibold text-ink">What a public viewer can see</legend>
        <div className="divide-y divide-line">
          {TOGGLES.map((toggle) => (
            <label key={toggle.key} className="flex cursor-pointer items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-sm text-ink">{toggle.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{toggle.help}</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                className="hb-switch"
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
        className={cn("mt-4 flex items-center gap-1.5 text-xs", error ? "text-rust" : "text-muted")}
        aria-live="polite"
      >
        {saving && <Loader2 size={12} className="animate-spin" aria-hidden />}
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
