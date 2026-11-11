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
    <main id="main-content" className="min-h-[calc(100dvh-52px)] bg-paper-2">
      <div className="mx-auto max-w-[640px] px-5 py-10 sm:px-8 sm:py-16">
        {/* Progress: one segment per step, so the label and the bar cannot disagree. */}
        <div
          className="mb-7"
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={1}
          aria-valuemax={5}
          aria-valuenow={step}
          aria-valuetext={`Step ${step} of 5`}
        >
          <p className="mb-3 text-sm font-medium text-muted">Step {step} of 5</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((index) => (
              <span key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-paper-4">
                <span
                  className="block h-full origin-left rounded-full bg-accent transition-transform duration-700 ease-out-expo"
                  style={{ transform: `scaleX(${index <= step ? 1 : 0})` }}
                />
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-paper p-6 shadow-md ring-1 ring-black/[0.04] sm:p-9">
          <div key={step} className="hb-swap-in">
          {step === 1 && (
            <>
              <h1 className="display-sm text-ink">What are you here to do?</h1>
              <p className="mt-2 text-md text-muted">
                This shapes what we recommend, nothing else.
              </p>
              <div className="mt-6 space-y-2.5">
                {GOALS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setGoal(option.id)}
                    aria-pressed={goal === option.id}
                    className={`block w-full rounded-md text-left transition-[background-color,box-shadow,transform] duration-200 ease-apple active:scale-[0.99] p-4 ${
                      goal === option.id ? "bg-accent-soft ring-2 ring-inset ring-accent" : "bg-paper ring-1 ring-inset ring-line-strong hover:bg-paper-2"
                    }`}
                  >
                    <span className="block text-md font-semibold text-ink">{option.label}</span>
                    <span className="mt-0.5 block text-sm text-muted">{option.description}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="display-sm text-ink">Where are you starting from?</h1>
              <p className="mt-2 text-md text-muted">
                Your background does not gate anything here — evidence does.
              </p>
              <div className="mt-6 space-y-2.5">
                {EDUCATION.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEducation(level)}
                    aria-pressed={education === level}
                    className={`block w-full rounded-md text-left transition-[background-color,box-shadow,transform] duration-200 ease-apple active:scale-[0.99] px-4 py-3.5 text-md ${
                      education === level
                        ? "bg-accent-soft ring-2 ring-inset ring-accent font-semibold text-ink"
                        : "bg-paper ring-1 ring-inset ring-line-strong hover:bg-paper-2 text-graphite"
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
              <h1 className="display-sm text-ink">Your experience</h1>
              <p className="mt-2 text-md text-muted">Optional, but it helps us calibrate.</p>
              <label htmlFor="years" className="hb-label mt-6">
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
                className="hb-input w-32"
              />
              <label htmlFor="summary" className="hb-label mt-5">
                Briefly, what have you worked on?
              </label>
              <textarea
                id="summary"
                rows={5}
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                className="hb-input"
              />
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="display-sm text-ink">What can you already do?</h1>
              <div className="mt-4 flex items-start gap-3 rounded-md bg-ochre-soft p-4">
                <Info size={16} className="mt-0.5 shrink-0 text-ochre" aria-hidden />
                <p className="text-sm leading-relaxed text-ochre">
                  These are recorded as <strong>self-reported claims only</strong>. They will not
                  produce a score, a level, or a verified badge, and employers see them marked as
                  unverified. To turn a claim into evidence, complete a work simulation.
                </p>
              </div>
              <div className="-mr-2 mt-5 max-h-80 space-y-1.5 overflow-y-auto pr-2">
                {skills.map((skill) => {
                  const claimed = claims[skill.slug];
                  return (
                    <div
                      key={skill.slug}
                      className="flex flex-wrap items-center gap-1.5 rounded-md bg-paper-2 px-3.5 py-2.5"
                    >
                      <span className="min-w-[110px] flex-1 text-sm font-medium text-ink">
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
                          className={`h-8 rounded-full px-3.5 text-xs font-medium capitalize transition-[background-color,color,transform] duration-200 ease-apple active:scale-[0.97] ${
                            claimed === level
                              ? "bg-accent text-white"
                              : "bg-paper text-graphite ring-1 ring-inset ring-line-strong hover:bg-paper-3"
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
              <h1 className="display-sm text-ink">Pick a target role</h1>
              <p className="mt-2 text-md text-muted">
                You can change this any time from the career explorer.
              </p>
              <div className="-mr-2 mt-6 max-h-96 space-y-2.5 overflow-y-auto p-0.5 pr-2">
                {careers.map((career) => (
                  <button
                    key={career.id}
                    type="button"
                    onClick={() => setTargetCareerSlug(career.slug)}
                    aria-pressed={targetCareerSlug === career.slug}
                    className={`block w-full rounded-md text-left transition-[background-color,box-shadow,transform] duration-200 ease-apple active:scale-[0.99] p-4 ${
                      targetCareerSlug === career.slug ? "bg-accent-soft ring-2 ring-inset ring-accent" : "bg-paper ring-1 ring-inset ring-line-strong hover:bg-paper-2"
                    }`}
                  >
                    <span className="block text-md font-semibold text-ink">{career.name}</span>
                    {career.tagline && (
                      <span className="mt-0.5 block text-sm text-muted">{career.tagline}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          </div>

          {error && (
            <p role="alert" className="animate-rise mt-5 rounded-md bg-rust-soft px-3.5 py-3 text-sm text-rust">
              {error}
            </p>
          )}

          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setStep((s) => (s - 1) as Step)}
                disabled={saving}
              >
                <ChevronLeft size={15} aria-hidden />
                Back
              </Button>
            )}
            <Button
              className="flex-1"
              size="lg"
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
