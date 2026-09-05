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
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs text-slate-500">
            <span>
              Step {step} of 5
            </span>
            <span>{Math.round(((step - 1) / 5) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[#1a56ff] transition-all"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-slate-900">What are you here to do?</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                This shapes what we recommend, nothing else.
              </p>
              <div className="mt-6 space-y-2">
                {GOALS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setGoal(option.id)}
                    aria-pressed={goal === option.id}
                    className={`block w-full rounded-xl border p-4 text-left transition-colors ${
                      goal === option.id
                        ? "border-[#1a56ff] bg-[#eef3ff]"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-900">
                      {option.label}
                    </span>
                    <span className="block text-xs text-slate-500">{option.description}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-slate-900">Where are you starting from?</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Your background does not gate anything here — evidence does.
              </p>
              <div className="mt-6 space-y-2">
                {EDUCATION.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEducation(level)}
                    aria-pressed={education === level}
                    className={`block w-full rounded-xl border p-3.5 text-left text-sm transition-colors ${
                      education === level
                        ? "border-[#1a56ff] bg-[#eef3ff] font-semibold text-slate-900"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
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
              <h1 className="text-2xl font-bold text-slate-900">Your experience</h1>
              <p className="mt-1.5 text-sm text-slate-500">Optional, but it helps us calibrate.</p>
              <label htmlFor="years" className="mt-6 block text-xs font-medium text-slate-600">
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
                className="mt-1.5 w-32 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#1a56ff] focus:outline-none focus:ring-2 focus:ring-[#1a56ff]/20"
              />
              <label htmlFor="summary" className="mt-5 block text-xs font-medium text-slate-600">
                Briefly, what have you worked on?
              </label>
              <textarea
                id="summary"
                rows={5}
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#1a56ff] focus:outline-none focus:ring-2 focus:ring-[#1a56ff]/20"
              />
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="text-2xl font-bold text-slate-900">What can you already do?</h1>
              <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-amber-50 p-3.5">
                <Info size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
                <p className="text-xs leading-relaxed text-amber-900">
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
                      className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <span className="min-w-[110px] flex-1 text-sm text-slate-800">
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
                              ? "bg-[#1a56ff] text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
              <h1 className="text-2xl font-bold text-slate-900">Pick a target role</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                You can change this any time from the career explorer.
              </p>
              <div className="mt-6 max-h-96 space-y-2 overflow-y-auto pr-1">
                {careers.map((career) => (
                  <button
                    key={career.id}
                    type="button"
                    onClick={() => setTargetCareerSlug(career.slug)}
                    aria-pressed={targetCareerSlug === career.slug}
                    className={`block w-full rounded-xl border p-4 text-left transition-colors ${
                      targetCareerSlug === career.slug
                        ? "border-[#1a56ff] bg-[#eef3ff]"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-900">
                      {career.name}
                    </span>
                    {career.tagline && (
                      <span className="block text-xs text-slate-500">{career.tagline}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
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
              {saving ? "Saving..." : step === 5 ? "Finish setup" : "Continue"}
              {step < 5 && <ChevronRight size={15} aria-hidden />}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
