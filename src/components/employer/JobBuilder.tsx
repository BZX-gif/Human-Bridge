"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { ExtractedSkill } from "@/lib/services/skill-extraction";

interface Props {
  onClose: () => void;
  onCreated: (jobId: number) => void;
}

type Importance = "essential" | "important" | "helpful";
type Level = "beginner" | "intermediate" | "advanced" | "expert";

interface Requirement {
  slug: string;
  name: string;
  importance: Importance;
  requiredLevel: Level;
  requiredScore: number;
  matchedPhrase?: string;
}

const LEVEL_SCORES: Record<Level, number> = {
  beginner: 35,
  intermediate: 60,
  advanced: 78,
  expert: 90,
};

/**
 * Skill-first job builder.
 *
 * Requirements are *suggested* by deterministic extraction and then edited and
 * confirmed by the employer. Nothing is published without their review, and the
 * phrase that produced each suggestion is always shown.
 */
export function JobBuilder({ onClose, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState<"remote" | "hybrid" | "onsite">("hybrid");
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [requireHumanReview, setRequireHumanReview] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const extract = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<{ skills: ExtractedSkill[]; note: string }>(
        "/api/employer/extract-skills",
        { method: "POST", json: { title, description } },
      );
      setRequirements(
        data.skills.map((s) => ({
          slug: s.slug,
          name: s.name,
          importance: s.importance,
          requiredLevel: s.requiredLevel,
          requiredScore: s.requiredScore,
          matchedPhrase: s.matchedPhrase,
        })),
      );
      setNote(data.note);
      setStep(2);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not extract skills.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<{ jobId: number }>("/api/employer/jobs", {
        method: "POST",
        json: {
          title,
          description,
          location: location || undefined,
          workType,
          requireHumanReview,
          status: "active",
          skills: requirements.map((r) => ({
            slug: r.slug,
            importance: r.importance,
            requiredLevel: r.requiredLevel,
            requiredScore: r.requiredScore,
          })),
        },
      });
      setStep(3);
      setTimeout(() => onCreated(data.jobId), 1200);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not publish the job.");
      setBusy(false);
    }
  };

  const update = (slug: string, patch: Partial<Requirement>) =>
    setRequirements((prev) =>
      prev.map((r) => (r.slug === slug ? { ...r, ...patch } : r)),
    );

  return (
    <Modal
      open
      onOpenChange={(open) => !open && onClose()}
      title="Build a job — skills first"
      description={step < 3 ? `Step ${step} of 2` : undefined}
      size="lg"
      footer={
        step === 1 ? (
          <Button
            size="md"
            onClick={() => void extract()}
            disabled={busy || title.trim().length < 2 || description.trim().length < 20}
          >
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Sparkles size={16} aria-hidden />}
            {busy ? "Extracting…" : "Extract skill requirements"}
          </Button>
        ) : step === 2 ? (
          <>
            <Button size="md" variant="secondary" onClick={() => setStep(1)} disabled={busy}>
              Back
            </Button>
            <Button size="md" onClick={() => void publish()} disabled={busy || requirements.length === 0}>
              {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
              {busy ? "Publishing…" : "Publish job"}
            </Button>
          </>
        ) : undefined
      }
    >
      {step < 3 && (
        <div className="mb-5 flex gap-1.5" aria-hidden>
          <span className="h-1 flex-1 rounded-full bg-accent" />
          <span
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-500 ease-apple",
              step === 2 ? "bg-accent" : "bg-paper-3",
            )}
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field label="Job title" htmlFor="job-title">
            <input
              id="job-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Data Analyst"
              className="hb-input"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Location" htmlFor="job-location">
              <input
                id="job-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bangalore"
                className="hb-input"
              />
            </Field>
            <Field label="Work type" htmlFor="job-worktype">
              <select
                id="job-worktype"
                value={workType}
                onChange={(e) => setWorkType(e.target.value as "remote" | "hybrid" | "onsite")}
                className="hb-input"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </Field>
          </div>

          <Field label="Job description" htmlFor="job-desc">
            <textarea
              id="job-desc"
              rows={9}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role and what the person needs to be able to do. We will turn this into structured skill requirements you can edit."
              className="hb-input leading-relaxed"
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-md bg-rust-soft px-4 py-3 text-sm text-rust">
              {error}
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="hb-swap-in space-y-4">
          {note && <p className="rounded-md bg-ochre-soft px-4 py-3 text-sm leading-relaxed text-ochre">{note}</p>}

          {requirements.length === 0 ? (
            <p className="rounded-md bg-paper-2 p-5 text-md leading-relaxed text-graphite">
              No skills were recognised in that description. Go back and mention the concrete
              tools and abilities the role needs.
            </p>
          ) : (
            <ul className="space-y-3">
              {requirements.map((req) => (
                <li key={req.slug} className="rounded-md bg-paper-2 p-4 sm:p-5">
                  <div className="mb-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-ink">{req.name}</p>
                      {req.matchedPhrase && (
                        <p className="mt-0.5 text-xs text-muted">matched on &ldquo;{req.matchedPhrase}&rdquo;</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setRequirements((p) => p.filter((r) => r.slug !== req.slug))}
                      className="shrink-0 rounded-full px-2.5 py-1 text-sm font-medium text-muted transition-colors duration-200 hover:bg-rust-soft hover:text-rust"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="text-xs font-medium text-muted">
                      Importance
                      <select
                        value={req.importance}
                        onChange={(e) => update(req.slug, { importance: e.target.value as Importance })}
                        className="hb-input mt-1.5"
                      >
                        <option value="essential">Essential</option>
                        <option value="important">Important</option>
                        <option value="helpful">Helpful</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium text-muted">
                      Minimum level
                      <select
                        value={req.requiredLevel}
                        onChange={(e) => {
                          const level = e.target.value as Level;
                          update(req.slug, {
                            requiredLevel: level,
                            requiredScore: LEVEL_SCORES[level],
                          });
                        }}
                        className="hb-input mt-1.5"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </label>
                    <label className="text-xs font-medium text-muted">
                      Minimum score
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={req.requiredScore}
                        onChange={(e) =>
                          update(req.slug, {
                            requiredScore: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                          })
                        }
                        className="hb-input tabular mt-1.5"
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md bg-paper-2 p-4 sm:p-5">
            <span>
              <span className="block text-md font-semibold text-ink">Require human review before shortlisting</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-muted">
                Automated evaluations are surfaced to you for confirmation rather than acted on
                automatically.
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="hb-switch"
              checked={requireHumanReview}
              onChange={(e) => setRequireHumanReview(e.target.checked)}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-md bg-rust-soft px-4 py-3 text-sm text-rust">
              {error}
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="py-8 text-center" role="status">
          <span className="animate-focus-in mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-moss-soft text-moss">
            <Check size={28} strokeWidth={2.2} aria-hidden />
          </span>
          <h3 className="mt-5 text-2xl font-semibold tracking-[-0.022em] text-ink">Job published</h3>
          <p className="mx-auto mt-2 max-w-md text-md leading-relaxed text-muted">
            Candidates will be matched against your requirements as they build verified
            evidence. We will not quote you a candidate count we cannot substantiate.
          </p>
        </div>
      )}
    </Modal>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="hb-label">
        {label}
      </label>
      {children}
    </div>
  );
}
