import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileSearch,
  Scale,
  Shield,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For Employers — Human Bridge",
  description:
    "Hire on evidence. Define the skills your role needs, and see candidates ranked by verified assessment evidence with the reasoning shown.",
};

const STEPS = [
  {
    step: "01",
    title: "Build a skill-first job",
    desc: "Paste your description and Human Bridge extracts structured skill requirements. You edit every requirement, set importance (essential / important / helpful) and the minimum level.",
    icon: Briefcase,
  },
  {
    step: "02",
    title: "Candidates are matched, explainably",
    desc: "Matching is deterministic: weighted by importance, discounted for unverified claims, and gated on essential skills. Every score comes with the reasons behind it.",
    icon: Users,
  },
  {
    step: "03",
    title: "Review the actual evidence",
    desc: "See which skills were verified by assessment, project or employer feedback — including the work simulation submissions and defense answers behind each score.",
    icon: FileSearch,
  },
  {
    step: "04",
    title: "Compare and decide",
    desc: "Compare shortlisted candidates side by side on the same requirements. Add a human review to any automated evaluation before it counts.",
    icon: Scale,
  },
];

export default async function EmployersPage() {
  const user = await getCurrentUser();
  const isEmployer = user?.role === "employer";

  return (
    <main className="min-h-screen bg-white pt-16">
      {/* Hero */}
      <section className="bg-slate-900 pb-20 pt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#1a56ff]/20 px-3 py-1.5 text-xs font-semibold text-blue-300">
                <Shield size={12} aria-hidden />
                For employers
              </div>
              <h1 className="mb-5 text-4xl font-bold leading-tight text-white sm:text-5xl">
                Hire on evidence.
                <br />
                <span className="text-[#1a56ff]">Not on claims.</span>
              </h1>
              <p className="mb-8 text-lg leading-relaxed text-slate-400">
                Candidates on Human Bridge prove skills through work simulations and a defense
                round, not multiple-choice quizzes. You see the score, the level, the confidence,
                and the evidence that produced them.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href={isEmployer ? "/employers/dashboard" : "/signup?role=employer"}>
                  {isEmployer ? "Go to your dashboard" : "Create an employer account"}
                  <ArrowRight size={16} aria-hidden />
                </ButtonLink>
                <Link
                  href="#how"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  How matching works
                </Link>
              </div>
            </div>

            {/* What you get — capabilities, not invented metrics */}
            <ul className="space-y-3">
              {[
                "Structured skill requirements with importance and minimum level",
                "Deterministic, explainable match scores — never a black box",
                "Unverified self-reported claims are discounted, not trusted",
                "Essential-skill gating so unqualified candidates are not surfaced as matches",
                "Human review on any automated evaluation",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300"
                >
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#1a56ff]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-10 max-w-2xl text-xs leading-relaxed text-slate-500">
            Human Bridge is early. We do not publish candidate-pool sizes, conversion rates or
            time-to-hire figures, because we will not quote numbers we cannot stand behind. What
            you can verify today is the evidence behind every candidate you see.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-slate-900">How hiring works here</h2>
            <p className="mx-auto max-w-xl text-lg text-slate-500">
              Skills-first, from the job post to the offer.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-100 p-5 transition-all hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3ff] text-[#1a56ff]">
                    <item.icon size={20} aria-hidden />
                  </div>
                  <span className="text-3xl font-black text-slate-100" aria-hidden>
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Matching transparency */}
      <section className="bg-[#f8fafc] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-3 text-2xl font-bold text-slate-900">
            The matching rules, in plain terms
          </h2>
          <p className="mb-6 text-slate-600">
            No proprietary magic. This is the whole algorithm.
          </p>
          <ol className="space-y-3 text-sm leading-relaxed text-slate-700">
            {[
              "Each required skill is weighted by importance: essential ×3, important ×2, helpful ×1.",
              "A candidate's score for a skill is compared against the minimum score you set for it.",
              "That score is multiplied by a verification factor: self-reported 0.5, assessed 1.0, project-verified 1.05, employer-verified 1.1.",
              "If any essential requirement is unmet, the candidate is marked ineligible and the specific blocking reason is shown — to you and to them.",
              "The final score is the weighted average, capped at 100. Strengths and gaps are listed explicitly.",
            ].map((rule, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <span className="shrink-0 font-bold text-[#1a56ff]">{i + 1}</span>
                {rule}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">Post a skill-first job</h2>
          <p className="mb-8 text-lg text-slate-500">
            Define what the role actually requires. We will show you who can prove it.
          </p>
          <ButtonLink
            href={isEmployer ? "/employers/dashboard" : "/signup?role=employer"}
            size="lg"
          >
            {isEmployer ? "Open the job builder" : "Get started"}
            <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
