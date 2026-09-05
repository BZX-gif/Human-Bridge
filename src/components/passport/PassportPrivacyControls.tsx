"use client";

import { useState } from "react";
import { Check, Copy, Lock } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";

interface Props {
  publicId: string;
  isPublic: boolean;
  visibility: Record<string, boolean>;
}

const TOGGLES: { key: string; label: string; help: string }[] = [
  { key: "skills", label: "Skill scores", help: "Your skill names, scores and levels." },
  { key: "evidence", label: "Evidence detail", help: "The individual evidence behind each score." },
  { key: "assessments", label: "Assessment history", help: "Which assessments you have taken." },
  { key: "projects", label: "Projects", help: "Projects linked to your profile." },
];

/**
 * Candidate-controlled privacy. Nothing is public by default — the candidate
 * opts in, and chooses which sections a public viewer can see.
 */
export function PassportPrivacyControls({ publicId, isPublic, visibility }: Props) {
  const [publicEnabled, setPublicEnabled] = useState(isPublic);
  const [flags, setFlags] = useState(visibility);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (next: { isPublic?: boolean; visibility?: Record<string, boolean> }) => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/passport/privacy", { method: "POST", json: next });
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not save your privacy settings.");
    } finally {
      setSaving(false);
    }
  };

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/passport/${publicId}` : "";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
        <Lock size={15} className="text-[#1a56ff]" aria-hidden />
        Privacy and sharing
      </h2>
      <p className="mb-5 text-xs text-slate-500">
        Your passport is private until you choose otherwise. Your email and contact details are
        never exposed on a public passport.
      </p>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-[#1a56ff]"
          checked={publicEnabled}
          onChange={(e) => {
            setPublicEnabled(e.target.checked);
            void save({ isPublic: e.target.checked });
          }}
        />
        <span>
          <span className="block text-sm font-medium text-slate-900">
            Enable a public passport link
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Anyone with the link can view the sections you allow below.
          </span>
        </span>
      </label>

      {publicEnabled && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3">
          <code className="min-w-0 flex-1 truncate text-xs text-slate-600">
            {shareUrl || `/passport/${publicId}`}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a56ff]"
          >
            {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      <fieldset className="mt-5">
        <legend className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          What a public viewer can see
        </legend>
        <div className="space-y-2">
          {TOGGLES.map((toggle) => (
            <label key={toggle.key} className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[#1a56ff]"
                checked={flags[toggle.key] !== false}
                onChange={(e) => {
                  const next = { ...flags, [toggle.key]: e.target.checked };
                  setFlags(next);
                  void save({ visibility: next });
                }}
              />
              <span>
                <span className="block text-slate-800">{toggle.label}</span>
                <span className="block text-xs text-slate-500">{toggle.help}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-4 text-xs text-slate-400" aria-live="polite">
        {saving ? "Saving..." : error ? <span className="text-red-600">{error}</span> : "Changes save automatically."}
      </p>
    </section>
  );
}
