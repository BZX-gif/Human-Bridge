import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase, Check, ChevronRight, FileSearch, Scale, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui/Button";
import { ScrollMotion } from "@/components/motion/ScrollMotion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For Employers — Human Bridge",
  description:
    "Hire on evidence. Define the skills your role needs, and see candidates ranked by verified assessment evidence with the reasoning shown.",
};

const CAPABILITIES = [
  "Structured skill requirements with importance and minimum level",
  "Deterministic, explainable match scores — never a black box",
  "Unverified self-reported claims are discounted, not trusted",
  "Essential-skill gating so unqualified candidates are not surfaced as matches",
  "Human review on any automated evaluation",
];

const RULES = [
  "Each required skill is weighted by importance: essential ×3, important ×2, helpful ×1.",
  "A candidate's score for a skill is compared against the minimum score you set for it.",
  "That score is multiplied by a verification factor: self-reported 0.5, assessed 1.0, project-verified 1.05, employer-verified 1.1.",
  "If any essential requirement is unmet, the candidate is marked ineligible and the specific blocking reason is shown — to you and to them.",
  "The final score is the weighted average, capped at 100. Strengths and gaps are listed explicitly.",
];

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
  const primaryHref = isEmployer ? "/employers/dashboard" : "/signup?role=employer";

  return (
    <main id="main-content" className="bg-paper">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="on-dark hb-nav-dark relative isolate -mt-[52px] overflow-clip bg-night pt-[52px] text-[#f5f5f7]">
        <div className="hb-aurora hb-aurora-dark" aria-hidden />
        <div className="hb-container pb-[clamp(64px,8vw,120px)] pt-[clamp(56px,8vw,112px)]">
          <div className="mx-auto max-w-[860px] text-center">
            <p className="eyebrow animate-rise text-[#a1a1a6]">For employers</p>
            <h1 className="display-xl animate-focus-in mt-5 [animation-delay:70ms]">
              Hire on evidence. <span className="text-gradient-dark whitespace-nowrap">Not on claims.</span>
            </h1>
            <p className="lede animate-rise mx-auto mt-6 max-w-[660px] text-[#a1a1a6] [animation-delay:200ms]">
              Candidates on Human Bridge prove skills through work simulations and a defense round,
              not multiple-choice quizzes. You see the score, the level, the confidence, and the
              evidence that produced them.
            </p>
            <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-x-8 gap-y-5 sm:flex-row [animation-delay:300ms]">
              <ButtonLink href={primaryHref} size="lg">
                {isEmployer ? "Go to your dashboard" : "Create an employer account"}
              </ButtonLink>
              <Link href="#how" className="hb-link text-base sm:text-lg">
                How matching works
                <ChevronRight size={17} strokeWidth={2.2} aria-hidden />
              </Link>
            </div>
          </div>

          {/* What you get — capabilities, not invented metrics */}
          <ul className="animate-rise-lg mx-auto mt-14 grid max-w-[1040px] grid-cols-1 gap-3 sm:mt-20 sm:grid-cols-2 lg:grid-cols-6 [animation-delay:420ms]">
            {CAPABILITIES.map((item, index) => (
              <li
                key={item}
                className={`flex items-start gap-3.5 rounded-xl bg-white/[0.07] p-5 text-md leading-snug text-[#f5f5f7] ring-1 ring-inset ring-white/[0.08] lg:p-6 ${
                  index < 3 ? "lg:col-span-2" : "lg:col-span-3"
                } ${index === 4 ? "sm:col-span-2" : ""}`}
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-bright/20 text-accent-bright">
                  <Check size={12} strokeWidth={3} aria-hidden />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-12 max-w-[700px] text-center text-xs leading-relaxed text-[#86868b]">
            Human Bridge is early. We do not publish candidate-pool sizes, conversion rates or
            time-to-hire figures, because we will not quote numbers we cannot stand behind. What
            you can verify today is the evidence behind every candidate you see.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="bg-paper-2">
        <div className="hb-container hb-section">
          <div className="mx-auto max-w-[820px] text-center">
            <p className="eyebrow" data-reveal>
              The process
            </p>
            <h2 className="display-lg mt-4" data-reveal data-reveal-delay={60}>
              How hiring works here
            </h2>
            <p className="lede mx-auto mt-5 max-w-[560px]" data-reveal data-reveal-delay={120}>
              Skills-first, from the job post to the offer.
            </p>
          </div>

          <ol className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {STEPS.map((item, index) => (
              <li
                key={item.step}
                className="hb-tile hb-tile-white flex flex-col p-7"
                data-reveal
                data-reveal-delay={index * 90}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-link">
                    <item.icon size={20} strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="tabular text-sm font-semibold text-muted" aria-hidden>
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-7 text-xl font-semibold leading-tight text-ink">{item.title}</h3>
                <p className="mt-3 text-md leading-relaxed text-muted">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Matching transparency ────────────────────────────────────────── */}
      <section id="matching" className="hb-container hb-section">
        <div className="grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow" data-reveal>
              Transparency
            </p>
            <h2 className="display-md mt-4" data-reveal data-reveal-delay={60}>
              The matching rules, in plain terms
            </h2>
            <p className="lede mt-5" data-reveal data-reveal-delay={120}>
              No proprietary magic. This is the whole algorithm.
            </p>
          </div>

          <ol className="min-w-0">
            {RULES.map((rule, i) => (
              <li
                key={i}
                className="flex gap-5 border-t border-line py-6 first:border-t-0 first:pt-0 sm:gap-7 sm:py-7"
                data-reveal
                data-reveal-delay={i * 70}
              >
                <span className="tabular w-7 shrink-0 text-2xl font-semibold leading-none tracking-[-0.02em] text-link sm:text-3xl">
                  {i + 1}
                </span>
                <p className="text-base leading-relaxed text-ink sm:text-lg">{rule}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section id="post" className="hb-container pb-[clamp(64px,8vw,112px)]">
        <div className="hb-tile px-7 py-14 text-center sm:px-12 sm:py-20" data-reveal="scale">
          <h2 className="display-lg mx-auto max-w-[720px]">Post a skill-first job</h2>
          <p className="lede mx-auto mt-5 max-w-[560px]">
            Define what the role actually requires. We will show you who can prove it.
          </p>
          <div className="mt-9 flex justify-center">
            <ButtonLink href={primaryHref} size="lg">
              {isEmployer ? "Open the job builder" : "Get started"}
            </ButtonLink>
          </div>
        </div>
      </section>

      <ScrollMotion />
    </main>
  );
}
