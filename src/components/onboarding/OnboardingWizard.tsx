"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

interface CareerOption {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
}

interface Props {
  careers: CareerOption[];
  skills: { slug: string; name: string }[];
}

const GOALS = [
  { id: "first_job", label: "Get my first job", description: "I am entering the workforce." },
  { id: "switch_career", label: "Switch careers", description: "I want to move into a different field." },
  { id: "improve", label: "Grow in my current field", description: "I want to level up where I am." },
  { id: "better_opportunities", label: "Find better opportunities", description: "A better role, company or salary." },
  { id: "explore", label: "Explore what is out there", description: "I am not sure yet." },
];

const EDUCATION = [
  "Currently studying",
  "Recent graduate (0–1 year)",
  "Graduate with some work experience",
  "Working professional",
  "No formal degree — self-taught or bootcamp",
  "Prefer not to say",
];

const CLAIM_LEVELS = ["beginner", "intermediate", "advanced"] as const;

type Step = 1 | 2 | 3 | 4 | 5;

export function OnboardingWizard({ careers, skills }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [goal, setGoal] = useState("");
  const [education, setEducation] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [experienceSummary, setExperienceSummary] = useState("");
  const [claims, setClaims] = useState<Record<string, string>>({});
  const [targetCareerSlug, setTargetCareerSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdvance =
    step === 1 ? goal !== "" : step === 2 ? education !== "" : step === 4 ? true : step === 5 ? targetCareerSlug !== "" : true;

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/onboarding", {
        method: "POST",
        json: {
          goal,
          educationBackground: education,
          experienceSummary: experienceSummary || undefined,
          experienceYears,
          targetCareerSlug,
          selfReportedSkills: Object.entries(claims).map(([slug, claimedLevel]) => ({
            slug,
            claimedLevel,
          })),
        },
      });
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not save your profile.");
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-paper-2">
      <div className="mx-auto max-w-[720px] px-5 py-10 sm:px-8 sm:py-14">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs text-muted">
            <span>
              Step {step} of 5
            </span>
            <span>{Math.round(((step - 1) / 5) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-paper-3">
            <div
              className="h-full rounded-full bg-ink transition-all"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-line bg-paper p-6 sm:p-8">
          {step === 1 && (
            <>
              <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.2rem)] leading-tight tracking-[-0.015em] text-ink">What are you here to do?</h1>
              <p className="mt-1.5 text-sm text-muted">
                This shapes what we recommend, nothing else.
              </p>
              <div className="mt-6 space-y-2">
                {GOALS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setGoal(option.id)}
                    aria-pressed={goal === option.id}
                    className={`block w-full rounded-md border p-4 text-left transition-colors ${
                      goal === option.id
                        ? "border-ink bg-paper-2"
                        : "border-line hover:border-line-strong"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink">
                      {option.label}
                    </span>
                    <span className="block text-xs text-muted">{option.description}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.2rem)] leading-tight tracking-[-0.015em] text-ink">Where are you starting from?</h1>
              <p className="mt-1.5 text-sm text-muted">
                Your background does not gate anything here — evidence does.
              </p>
              <div className="mt-6 space-y-2">
                {EDUCATION.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEducation(level)}
                    aria-pressed={education === level}
                    className={`block w-full rounded-md border p-3.5 text-left text-sm transition-colors ${
                      education === level
                        ? "border-ink bg-paper-2 font-semibold text-ink"
                        : "border-line text-graphite hover:border-line-strong"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.2rem)] leading-tight tracking-[-0.015em] text-ink">Your experience</h1>
              <p className="mt-1.5 text-sm text-muted">Optional, but it helps us calibrate.</p>
              <label htmlFor="years" className="mt-6 block text-xs font-medium text-graphite">
                Years of work experience
              </label>
              <input
                id="years"
                type="number"
                min={0}
                max={60}
                value={experienceYears}
                onChange={(e) =>
                  setExperienceYears(Math.max(0, Math.min(60, Number(e.target.value) || 0)))
                }
                className="mt-1.5 w-32 rounded-md border border-line px-3 py-2.5 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-[#0B0B0C]/20"
              />
              <label htmlFor="summary" className="mt-5 block text-xs font-medium text-graphite">
                Briefly, what have you worked on?
              </label>
              <textarea
                id="summary"
                rows={5}
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line px-3 py-2.5 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-[#0B0B0C]/20"
              />
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.2rem)] leading-tight tracking-[-0.015em] text-ink">What can you already do?</h1>
              <div className="mt-3 flex items-start gap-2.5 rounded-md bg-ochre-soft p-3.5">
                <Info size={15} className="mt-0.5 shrink-0 text-ochre" aria-hidden />
                <p className="text-xs leading-relaxed text-ochre">
                  These are recorded as <strong>self-reported claims only</strong>. They will not
                  produce a score, a level, or a verified badge, and employers see them marked as
                  unverified. To turn a claim into evidence, complete a work simulation.
                </p>
              </div>
              <div className="mt-5 max-h-80 space-y-1.5 overflow-y-auto pr-1">
                {skills.map((skill) => {
                  const claimed = claims[skill.slug];
                  return (
                    <div
                      key={skill.slug}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-line px-3 py-2"
                    >
                      <span className="min-w-[110px] flex-1 text-sm text-graphite">
                        {skill.name}
                      </span>
                      {CLAIM_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          aria-pressed={claimed === level}
                          onClick={() =>
                            setClaims((prev) => {
                              const next = { ...prev };
                              if (next[skill.slug] === level) delete next[skill.slug];
                              else next[skill.slug] = level;
                              return next;
                            })
                          }
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                            claimed === level
                              ? "bg-ink text-paper"
                              : "bg-paper-3 text-graphite hover:bg-paper-4"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.2rem)] leading-tight tracking-[-0.015em] text-ink">Pick a target role</h1>
              <p className="mt-1.5 text-sm text-muted">
                You can change this any time from the career explorer.
              </p>
              <div className="mt-6 max-h-96 space-y-2 overflow-y-auto pr-1">
                {careers.map((career) => (
                  <button
                    key={career.id}
                    type="button"
                    onClick={() => setTargetCareerSlug(career.slug)}
                    aria-pressed={targetCareerSlug === career.slug}
                    className={`block w-full rounded-md border p-4 text-left transition-colors ${
                      targetCareerSlug === career.slug
                        ? "border-ink bg-paper-2"
                        : "border-line hover:border-line-strong"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-ink">
                      {career.name}
                    </span>
                    {career.tagline && (
                      <span className="block text-xs text-muted">{career.tagline}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="mt-5 rounded-md border border-rust/20 bg-rust-soft p-3 text-[12px] text-rust">
              {error}
            </p>
          )}

          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button
                variant="secondary"
                onClick={() => setStep((s) => (s - 1) as Step)}
                disabled={saving}
              >
                <ChevronLeft size={15} aria-hidden />
                Back
              </Button>
            )}
            <Button
              className="flex-1"
              disabled={!canAdvance || saving}
              onClick={() => {
                if (step < 5) setStep((s) => (s + 1) as Step);
                else void finish();
              }}
            >
              {saving ? "Saving…" : step === 5 ? "Finish setup" : "Continue"}
              {step < 5 && <ChevronRight size={15} aria-hidden />}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
