"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Build a job"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white p-5">
          <div>
            <h2 className="font-bold text-slate-900">Build a job — skills first</h2>
            {step < 3 && <p className="text-xs text-slate-500">Step {step} of 2</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="p-5">
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Job title" htmlFor="job-title">
                <input
                  id="job-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Data Analyst"
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Location" htmlFor="job-location">
                  <input
                    id="job-location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Bangalore"
                    className={inputClass}
                  />
                </Field>
                <Field label="Work type" htmlFor="job-worktype">
                  <select
                    id="job-worktype"
                    value={workType}
                    onChange={(e) =>
                      setWorkType(e.target.value as "remote" | "hybrid" | "onsite")
                    }
                    className={inputClass}
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
                  className={inputClass}
                />
              </Field>

              {error && (
                <p role="alert" className="text-xs text-red-600">
                  {error}
                </p>
              )}

              <Button
                onClick={() => void extract()}
                disabled={busy || title.trim().length < 2 || description.trim().length < 20}
                className="w-full"
              >
                <Sparkles size={15} aria-hidden />
                {busy ? "Extracting..." : "Extract skill requirements"}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {note && (
                <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                  {note}
                </p>
              )}

              {requirements.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  No skills were recognised in that description. Go back and mention the concrete
                  tools and abilities the role needs.
                </p>
              ) : (
                <ul className="space-y-3">
                  {requirements.map((req) => (
                    <li key={req.slug} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{req.name}</p>
                          {req.matchedPhrase && (
                            <p className="text-[11px] text-slate-400">
                              matched on &ldquo;{req.matchedPhrase}&rdquo;
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setRequirements((p) => p.filter((r) => r.slug !== req.slug))
                          }
                          className="text-xs font-medium text-slate-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <label className="text-xs text-slate-500">
                          Importance
                          <select
                            value={req.importance}
                            onChange={(e) =>
                              update(req.slug, { importance: e.target.value as Importance })
                            }
                            className={`${inputClass} mt-1`}
                          >
                            <option value="essential">Essential</option>
                            <option value="important">Important</option>
                            <option value="helpful">Helpful</option>
                          </select>
                        </label>
                        <label className="text-xs text-slate-500">
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
                            className={`${inputClass} mt-1`}
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                            <option value="expert">Expert</option>
                          </select>
                        </label>
                        <label className="text-xs text-slate-500">
                          Minimum score
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={req.requiredScore}
                            onChange={(e) =>
                              update(req.slug, {
                                requiredScore: Math.max(
                                  0,
                                  Math.min(100, Number(e.target.value) || 0),
                                ),
                              })
                            }
                            className={`${inputClass} mt-1`}
                          />
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[#1a56ff]"
                  checked={requireHumanReview}
                  onChange={(e) => setRequireHumanReview(e.target.checked)}
                />
                <span>
                  <span className="block font-medium text-slate-900">
                    Require human review before shortlisting
                  </span>
                  <span className="block text-xs text-slate-500">
                    Automated evaluations are surfaced to you for confirmation rather than acted on
                    automatically.
                  </span>
                </span>
              </label>

              {error && (
                <p role="alert" className="text-xs text-red-600">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => void publish()}
                  disabled={busy || requirements.length === 0}
                  className="flex-1"
                >
                  {busy ? "Publishing..." : "Publish job"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-8 text-center">
              <h3 className="text-xl font-bold text-slate-900">Job published</h3>
              <p className="mt-2 text-sm text-slate-500">
                Candidates will be matched against your requirements as they build verified
                evidence. We will not quote you a candidate count we cannot substantiate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1a56ff] focus:outline-none focus:ring-2 focus:ring-[#1a56ff]/20";

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
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}
