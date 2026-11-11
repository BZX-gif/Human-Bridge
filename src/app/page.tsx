import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, ShieldCheck, Sparkles, X } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/db";
import { listCareerSummaries } from "@/lib/services/career-service";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { ScrollMotion } from "@/components/motion/ScrollMotion";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DEMAND_LABEL: Record<string, string> = {
  very_high: "Very high demand",
  high: "High demand",
  medium: "Steady demand",
  low: "Niche demand",
};

type SystemArt = "discover" | "direction" | "plan" | "build" | "prove";

const SYSTEM: {
  step: string;
  title: string;
  body: string;
  href: string;
  link: string;
  art: SystemArt;
  span: string;
}[] = [
  {
    step: "01",
    title: "Discover",
    body: "Understand what a role actually involves before you commit years to it. The work, the skills, the entry points and the honest trade-offs.",
    href: "/careers",
    link: "Explore careers",
    art: "discover",
    span: "lg:col-span-3",
  },
  {
    step: "02",
    title: "Direction",
    body: "Choose a primary career goal. It becomes the spine of everything: your roadmap, your weekly plan, your project choices and your portfolio.",
    href: "/journey",
    link: "See the roadmap",
    art: "direction",
    span: "lg:col-span-3",
  },
  {
    step: "03",
    title: "Plan",
    body: "Turn milestones into sessions that fit the hours you really have. Daily, weekly and monthly views. Reschedule without shame.",
    href: "/planner",
    link: "Open the planner",
    art: "plan",
    span: "lg:col-span-2",
  },
  {
    step: "04",
    title: "Build",
    body: "Work through exercises and real projects. Track skills against the role's requirements and see exactly where the gaps are.",
    href: "/projects",
    link: "Browse projects",
    art: "build",
    span: "lg:col-span-2",
  },
  {
    step: "05",
    title: "Prove",
    body: "Completed work becomes portfolio evidence. Assessments create verified scores. You decide what is public, and you can change your mind.",
    href: "/portfolio",
    link: "See the portfolio",
    art: "prove",
    span: "sm:col-span-2 lg:col-span-2",
  },
];

const PROBLEM = "Most career advice gives you a title and a pile of links. That is not a direction.";

const POSITIONING = [
  ["A gap, not a list", "Knowing you need SQL is not the same as knowing which query to practise on Tuesday."],
  ["Plans that survive life", "A plan built on ten imaginary hours collapses in week two. Yours is sized to the hours you have."],
  ["Evidence over adjectives", "“Hard-working” is a claim. A finished project with a reflection is something a person can inspect."],
  ["You own the record", "Your portfolio is private by default. Nothing is shared with an employer unless you enable it."],
];

const HOW = [
  {
    title: "Choose a direction",
    body: "Read what the work is really like, compare entry points, and select one primary goal. You can change it later without losing your evidence.",
  },
  {
    title: "Get a staged roadmap",
    body: "Foundations, core skills, real practice, projects, professional readiness. Every milestone states why it matters and how you will know it is done.",
  },
  {
    title: "Plan around your real week",
    body: "Tell Human Bridge how many hours you have. It breaks milestones into sessions, then lets you move, shrink or drop them.",
  },
  {
    title: "Build evidence you own",
    body: "Finish projects, take assessments where available, and keep a portfolio that separates what you claim from what has been demonstrated.",
  },
];

const STAGES = [
  { name: "Foundations", detail: "The vocabulary and basic tools of the field.", weeks: "1–2" },
  { name: "Core skills", detail: "The essential abilities the role depends on.", weeks: "3–6" },
  { name: "Applied practice", detail: "Exercises with real constraints, not tutorials.", weeks: "6–10" },
  { name: "Real projects", detail: "Work that produces something another person can inspect.", weeks: "2–4" },
  { name: "Professional readiness", detail: "Portfolio, applications and interview evidence.", weeks: "1–2" },
];

const WE_DO = [
  "Show the source of every score",
  "Label effort and salary as estimates",
  "Separate claimed skills from verified ones",
  "Work without AI when it is unavailable",
  "Let you change direction",
];

const WE_DO_NOT = [
  "Guarantee a job, interview or salary",
  "Publish invented statistics or success stories",
  "Create fake employers or vacancies",
  "Mark a skill verified from a checkbox",
  "Sell your data to recruiters",
];

/** What a career page covers — the fallback rail when no careers are loaded. */
const DISCOVER_TOPICS = ["Day-to-day work", "Skills that matter", "Entry points", "Honest trade-offs", "Proof projects"];

export default async function HomePage() {
  const [user, careers] = await Promise.all([
    getCurrentUser(),
    isDatabaseConfigured() ? listCareerSummaries().catch(() => []) : Promise.resolve([]),
  ]);

  const featured = careers.slice(0, 6);
  const workspaceHref = user ? (user.role === "employer" ? "/employers/dashboard" : "/dashboard") : "/signup";
  const projects = DEMO_PROJECTS.slice(0, 3);
  const problemWords = PROBLEM.split(" ");
  const railNames = careers.length >= 4 ? careers.map((career) => career.name) : DISCOVER_TOPICS;

  return (
    <main id="main-content">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-x-clip bg-paper">
        <div className="hb-container pt-[clamp(52px,8.5vw,112px)] text-center">
          <p className="eyebrow animate-rise">Career-building operating system</p>
          <h1 className="display-xl animate-focus-in mx-auto mt-5 max-w-[1040px] [animation-delay:80ms]">
            Your ambition deserves{" "}
            <span className="text-gradient whitespace-nowrap">a direction.</span>
          </h1>
          <p className="lede animate-rise mx-auto mt-6 max-w-[650px] [animation-delay:220ms]">
            Human Bridge turns the career you want into a staged roadmap, a plan that fits your real
            week, and evidence you can show. One connected system — not another list of courses.
          </p>

          <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-x-8 gap-y-5 sm:flex-row [animation-delay:320ms]">
            <ButtonLink href={workspaceHref} size="lg">
              {user ? "Open your workspace" : "Build your direction"}
            </ButtonLink>
            <Link href="/careers" className="hb-link text-base sm:text-lg">
              Explore careers
              <ChevronRight size={17} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>

          <p className="animate-fade mx-auto mt-8 flex max-w-[520px] items-start justify-center gap-2 text-xs leading-relaxed text-muted [animation-delay:560ms]">
            <ShieldCheck size={15} className="mt-px shrink-0" aria-hidden />
            <span>Free to use. No invented statistics, no fake job listings, no guaranteed outcomes.</span>
          </p>
        </div>

        <div className="relative mx-auto mt-14 w-full max-w-[1128px] px-4 sm:mt-20 sm:px-8 lg:px-11">
          <div className="hb-aurora -inset-x-[8%] -bottom-[4%] -top-[14%]" aria-hidden />
          <div className="animate-rise-lg [animation-delay:420ms]">
            <div className="hb-settle" data-progress="enter" data-progress-end="0.85">
              <ProductPreview />
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            Interactive preview with sample data. Your workspace is private.
          </p>
        </div>

        <dl className="hb-container mt-16 grid gap-y-9 pb-[clamp(72px,9vw,128px)] text-center sm:mt-24 sm:grid-cols-3">
          {[
            ["Connected", "5 parts, one plan"],
            ["Career paths", careers.length > 0 ? `${careers.length} mapped roles` : "Mapped roles"],
            ["Built for", "Studying alongside life"],
          ].map(([term, value], index) => (
            <div
              key={term}
              data-reveal
              data-reveal-delay={index * 90}
              className="px-6 sm:border-l sm:border-line sm:first:border-l-0"
            >
              <dt className="text-sm text-muted">{term}</dt>
              <dd className="display-sm mt-1.5 text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Positioning ──────────────────────────────────────────────────── */}
      <section className="on-dark hb-nav-dark bg-night text-[#f5f5f7]">
        <div className="hb-container hb-section">
          <p className="eyebrow text-[#a1a1a6]">The problem</p>
          <h2
            className="hb-lit display-lg mt-6 max-w-[1000px]"
            data-progress="cross"
            style={{ "--n": problemWords.length } as CSSProperties}
          >
            {problemWords.map((word, index) => (
              <span key={`${word}-${index}`} style={{ "--i": index } as CSSProperties}>
                {word}{" "}
              </span>
            ))}
          </h2>

          <div className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
            {POSITIONING.map(([title, body], index) => (
              <div
                key={title}
                data-reveal
                data-reveal-delay={index * 90}
                className="border-t border-white/[0.18] pt-5"
              >
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-md leading-relaxed text-[#a1a1a6]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The system ───────────────────────────────────────────────────── */}
      <section className="bg-paper-2">
        <div className="hb-container hb-section">
          <SectionIntro
            eyebrow="One system"
            title="Five parts that actually talk to each other."
            body="A career goal changes the roadmap. The roadmap changes the plan. The plan produces work. The work becomes evidence. Evidence changes what you apply for."
          />

          <ol className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-5 lg:grid-cols-6">
            {SYSTEM.map((item, index) => (
              <li
                key={item.step}
                data-reveal="scale"
                data-reveal-delay={(index < 2 ? index : index - 2) * 90}
                className={cn("min-w-0", item.span)}
              >
                <article className="hb-tile hb-tile-white hb-tile-lift group flex h-full flex-col">
                  <div className="relative h-[188px] overflow-clip sm:h-[204px]" aria-hidden>
                    <SystemArtwork art={item.art} names={railNames} />
                  </div>
                  <div className="flex flex-1 flex-col px-7 pb-7 pt-1 sm:px-8 sm:pb-8">
                    <p className="tabular text-sm font-semibold text-faint">{item.step}</p>
                    <h3 className="display-sm mt-1">{item.title}</h3>
                    <p className="mt-2.5 flex-1 text-md leading-relaxed text-muted">{item.body}</p>
                    <Link href={item.href} className="hb-link mt-5 self-start text-md after:absolute after:inset-0">
                      {item.link}
                      <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-paper">
        <div className="hb-container hb-section grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-24">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow" data-reveal>
              How it works
            </p>
            <h2 className="display-lg mt-4" data-reveal data-reveal-delay={60}>
              From “I think I want this” to “here is what I built.”
            </h2>
            <p className="lede mt-5" data-reveal data-reveal-delay={120}>
              Four steps, in order. Each one produces something the next one needs — no motivational
              filler in between.
            </p>
            <div className="mt-8" data-reveal data-reveal-delay={180}>
              <ButtonLink href={workspaceHref} size="lg">
                Start with a direction
              </ButtonLink>
            </div>
          </div>

          <ol>
            {HOW.map((item, index) => (
              <li
                key={item.title}
                className="hb-step relative flex gap-6 pb-14 last:pb-0 sm:gap-8 lg:pb-20"
                data-progress="enter"
                data-progress-start="0.25"
                data-progress-end="0.45"
              >
                {index < HOW.length - 1 && (
                  <span
                    aria-hidden
                    className="hb-step-rail absolute bottom-0 left-[19px] top-10 w-0.5 bg-line"
                    data-progress="line"
                  >
                    <span className="hb-step-rail-fill absolute inset-0 bg-accent" />
                  </span>
                )}
                <span className="hb-step-dot tabular relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-md font-semibold">
                  {index + 1}
                </span>
                <div className="hb-step-body pt-1">
                  <h3 className="display-sm">{item.title}</h3>
                  <p className="mt-3 max-w-[540px] text-base leading-relaxed text-muted lg:text-lg">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Career exploration ───────────────────────────────────────────── */}
      <section className="bg-paper-2">
        <div className="hb-container hb-section">
          <SectionIntro
            align="split"
            eyebrow="Career exploration"
            title="Look before you commit."
            body="Every career page explains the day-to-day work, the skills that matter, the entry points and the projects that prove competence. Salary ranges are indicative context, not promises."
            action={
              <Link href="/careers" className="hb-link text-base">
                All careers
                <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
              </Link>
            }
          />

          {featured.length === 0 ? (
            <div className="hb-tile hb-tile-white mt-12 p-10 text-center" data-reveal>
              <p className="mx-auto max-w-md text-md text-muted">
                Career data is not available right now. You can still create an account and choose a
                direction later.
              </p>
            </div>
          ) : (
            <ul className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {featured.map((career, index) => (
                <li key={career.id} data-reveal data-reveal-delay={(index % 3) * 90}>
                  <Link
                    href={`/careers/${career.slug}`}
                    className="hb-tile hb-tile-white hb-tile-lift group flex h-full flex-col p-7 sm:p-8"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-medium text-muted">{career.trackName ?? "Career"}</span>
                      {career.demandLevel && (
                        <span className="shrink-0 rounded-full bg-paper-2 px-2.5 py-1 text-2xs font-medium text-graphite">
                          {DEMAND_LABEL[career.demandLevel] ?? career.demandLevel}
                        </span>
                      )}
                    </div>
                    <h3 className="display-sm mt-6">{career.name}</h3>
                    <p className="mt-2 line-clamp-2 text-md leading-relaxed text-muted">
                      {career.tagline ?? career.description}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-8">
                      <span className="text-xs text-muted">
                        {career.skillCount} skills · {career.essentialCount} essential
                      </span>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-graphite transition-[background-color,color] duration-500 ease-out-expo group-hover:bg-accent group-hover:text-white">
                        <ArrowUpRight
                          size={16}
                          className="transition-transform duration-500 ease-out-expo group-hover:-translate-y-px group-hover:translate-x-px"
                          aria-hidden
                        />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Skill journeys + roadmap ─────────────────────────────────────── */}
      <section className="bg-paper">
        <div className="hb-container hb-section">
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
            <div className="hb-tile p-7 sm:p-10 lg:p-12" data-reveal>
              <p className="eyebrow">Skill journeys</p>
              <h2 className="display-md mt-3">A route, not a library.</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Courses rarely tell you the order. Human Bridge stages the skills a role needs, so you
                always know what to learn next and why it unlocks what follows.
              </p>
              <ol className="mt-9">
                {STAGES.map((stage, index) => (
                  <li key={stage.name} className="relative flex gap-4 pb-6 last:pb-0">
                    {index < STAGES.length - 1 && (
                      <span className="absolute bottom-0 left-[15px] top-8 w-px bg-line-strong" aria-hidden />
                    )}
                    <span className="tabular relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-semibold text-ink shadow-xs">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <h3 className="text-base font-semibold text-ink">{stage.name}</h3>
                        <span className="text-xs text-muted">~{stage.weeks} weeks at 6h/wk</span>
                      </div>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted">{stage.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-8 text-xs leading-relaxed text-muted">
                Time ranges are estimates based on the milestone effort, not deadlines. Your pace
                depends on your starting point and the hours you have.
              </p>
            </div>

            <div className="hb-tile flex flex-col p-7 sm:p-10 lg:p-12" data-reveal data-reveal-delay={110}>
              <p className="eyebrow">Personal roadmap</p>
              <h2 className="display-md mt-3">Every milestone earns its place.</h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Generated from your chosen career and adjusted to whether you are starting fresh or
                already have some experience.
              </p>

              <div className="mt-9 rounded-xl bg-paper p-6 shadow-md sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-2xs font-medium text-link">
                    Stage 2 · Core skills
                  </span>
                  <span className="text-2xs text-muted">Example milestone · ~6 hours, estimate</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-ink">Query a database with confidence</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">
                  Filtering and joins are the difference between reading a table and being able to ask
                  it a question. Every later analysis depends on this.
                </p>
                <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-2">
                  {[
                    ["Skills", "SQL, data literacy"],
                    ["Practice", "3 query sets on a sample database"],
                    ["Done when", "Output matches the expected result"],
                    ["Depends on", "Foundations"],
                  ].map(([term, value]) => (
                    <div key={term}>
                      <dt className="text-2xs font-medium text-muted">{term}</dt>
                      <dd className="mt-0.5 text-sm leading-relaxed text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <ul className="mt-auto flex flex-wrap gap-x-6 gap-y-2.5 pt-8">
                {["Progress saved automatically", "Adjust or skip milestones", "Rebuild when your goal changes"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-graphite">
                      <Check size={15} strokeWidth={2.4} className="shrink-0 text-moss" aria-hidden />
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Projects ─────────────────────────────────────────────────────── */}
      <section className="bg-paper-2">
        <div className="hb-container hb-section">
          <SectionIntro
            align="split"
            eyebrow="Project-based learning"
            title="Finish something. Then explain it."
            body="Projects carry the skills, deliverables and completion criteria that make learning visible. Completed work enters your portfolio — labelled as self-attested until an assessment verifies it."
            action={
              <Link href="/projects" className="hb-link text-base">
                Project library
                <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
              </Link>
            }
          />

          <ul className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {projects.map((project, index) => (
              <li
                key={project.id}
                data-reveal
                data-reveal-delay={index * 90}
                className="hb-tile hb-tile-white flex flex-col p-7 sm:p-8"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-paper-2 px-2.5 py-1 text-2xs font-medium text-graphite">
                    {project.difficulty}
                  </span>
                  <span className="text-xs text-muted">~{project.estimatedHours}h</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold leading-snug text-ink">{project.title}</h3>
                <p className="mt-2 flex-1 text-md leading-relaxed text-muted">{project.description}</p>
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {project.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full px-2.5 py-1 text-2xs font-medium text-graphite ring-1 ring-inset ring-line-strong"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="mt-6 border-t border-line pt-4 text-xs text-muted">
                  {project.deliverables.length} deliverables · {project.careerName}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-muted">
            Illustrative catalogue projects. You can also add your own work.
          </p>
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────────────────── */}
      <section id="trust" className="bg-paper">
        <div className="hb-container hb-section">
          <SectionIntro
            eyebrow="Trust"
            title="What this product will never do."
            body="Career tools have a habit of inventing certainty. Human Bridge is built the other way: show the evidence, name the estimate, and let you decide what to do with it."
          />

          <div className="mx-auto mt-12 grid max-w-[960px] grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-5">
            <PrincipleList title="We do" items={WE_DO} tone="do" />
            <PrincipleList title="We do not" items={WE_DO_NOT} tone="dont" delay={110} />
          </div>

          <p
            className="mx-auto mt-8 flex max-w-[620px] items-start justify-center gap-2.5 text-center text-sm leading-relaxed text-muted"
            data-reveal
          >
            <ShieldCheck size={17} className="mt-0.5 shrink-0 text-graphite" aria-hidden />
            <span>
              Your plan and evidence stay private until you enable a public portfolio. You choose
              which sections it shows.
            </span>
          </p>
        </div>
      </section>

      {/* ── Paper career guide ─────────────────────────────────────────────── */}
      <section className="bg-paper-2">
        <div className="hb-container hb-section grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <p className="eyebrow" data-reveal>
              Guidance
            </p>
            <h2 className="display-lg mt-4" data-reveal data-reveal-delay={60}>
              Advice that knows your actual plan.
            </h2>
            <p className="lede mt-5" data-reveal data-reveal-delay={120}>
              Paper reads your roadmap, your recorded skills and your week — not a generic template.
              It can reduce an overloaded plan to one useful action, explain a concept, or point to
              the gap that blocks the most progress.
            </p>
            <ul className="mt-8 space-y-3.5" data-reveal data-reveal-delay={180}>
              {[
                "Grounded in your own data, with its limits stated",
                "Never invents resources, certificates or opportunities",
                "Falls back to a guided response if AI is unavailable",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-base leading-snug text-graphite">
                  <Sparkles size={17} className="mt-0.5 shrink-0 text-link" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-9" data-reveal data-reveal-delay={240}>
              <Link href={user ? "/mentor" : "/signup"} className="hb-link text-base sm:text-lg">
                {user ? "Ask Paper" : "Try it with your own plan"}
                <ChevronRight size={17} strokeWidth={2.2} aria-hidden />
              </Link>
            </div>
          </div>

          <div className="hb-tile hb-tile-white p-6 shadow-lg sm:p-8" data-reveal="scale">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper-3 text-graphite">
                  <Sparkles size={13} aria-hidden />
                </span>
                Paper
              </p>
              <span className="rounded-full bg-paper-3 px-2.5 py-1 text-2xs font-medium text-graphite">
                Guided mode
              </span>
            </div>
            <div className="mt-7 space-y-3">
              <p className="ml-auto w-fit max-w-[85%] text-wrap rounded-[22px] rounded-br-[6px] bg-accent px-4 py-2.5 text-md leading-relaxed text-white">
                I have an interview in two weeks and feel underprepared.
              </p>
              <div className="w-fit max-w-[92%] rounded-[22px] rounded-bl-[6px] bg-paper-2 px-4 py-3.5">
                <p className="text-wrap text-md leading-relaxed text-ink">
                  Start from evidence, not adjectives. Choose two projects and write a three-minute
                  walkthrough of each: the problem, what you decided, what failed. Then rehearse the
                  hardest question — what would you do differently. I will not invent questions from
                  a real employer.
                </p>
                <p className="mt-2.5 text-2xs text-muted">Guided response · from your portfolio</p>
              </div>
            </div>
            <p className="mt-6 text-2xs text-faint">Illustrative conversation.</p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="on-dark hb-nav-dark relative isolate overflow-clip bg-night text-[#f5f5f7]">
        <div className="hb-aurora hb-aurora-dark" aria-hidden />
        <div className="hb-container hb-section text-center">
          <p className="eyebrow text-[#a1a1a6]" data-reveal>
            Start here
          </p>
          <h2 className="display-xl mx-auto mt-5" data-reveal="blur" data-reveal-delay={60}>
            A direction, <span className="whitespace-nowrap">then a plan,</span>{" "}
            <br className="hidden md:block" />
            <span className="text-gradient-dark whitespace-nowrap">then evidence.</span>
          </h2>
          <p className="lede mx-auto mt-6 max-w-[580px] text-[#a1a1a6]" data-reveal data-reveal-delay={140}>
            You do not need to know everything today. Choose one role worth exploring and let the
            system turn it into a first week you can actually complete.
          </p>
          <div
            className="mt-10 flex flex-col items-center justify-center gap-x-8 gap-y-5 sm:flex-row"
            data-reveal
            data-reveal-delay={220}
          >
            <ButtonLink href={workspaceHref} size="lg">
              {user ? "Open your workspace" : "Create your plan"}
            </ButtonLink>
            <Link href="/careers" className="hb-link text-base sm:text-lg">
              Browse careers
              <ChevronRight size={17} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
          <p className="mx-auto mt-16 max-w-[700px] text-xs leading-relaxed text-[#86868b] sm:mt-20">
            Human Bridge is a career-building tool, not an employment agency. We do not promise
            interviews, offers, salaries or promotions. Outcomes depend on your work, the market and
            factors outside any product&apos;s control.
          </p>
        </div>
      </section>

      <ScrollMotion />
    </main>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function SectionIntro({
  eyebrow,
  title,
  body,
  action,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  body: string;
  action?: ReactNode;
  align?: "center" | "split";
}) {
  if (align === "split") {
    return (
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="max-w-[720px]">
          <p className="eyebrow" data-reveal>
            {eyebrow}
          </p>
          <h2 className="display-lg mt-4" data-reveal data-reveal-delay={60}>
            {title}
          </h2>
          <p className="lede mt-5" data-reveal data-reveal-delay={120}>
            {body}
          </p>
        </div>
        {action && (
          <div className="shrink-0 lg:pb-1.5" data-reveal data-reveal-delay={180}>
            {action}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[820px] text-center">
      <p className="eyebrow" data-reveal>
        {eyebrow}
      </p>
      <h2 className="display-lg mt-4" data-reveal data-reveal-delay={60}>
        {title}
      </h2>
      <p className="lede mx-auto mt-5" data-reveal data-reveal-delay={120}>
        {body}
      </p>
      {action && (
        <div className="mt-7" data-reveal data-reveal-delay={180}>
          {action}
        </div>
      )}
    </div>
  );
}

function PrincipleList({
  title,
  items,
  tone,
  delay = 0,
}: {
  title: string;
  items: string[];
  tone: "do" | "dont";
  delay?: number;
}) {
  const Icon = tone === "do" ? Check : X;
  return (
    <div className="hb-tile p-7 sm:p-9" data-reveal data-reveal-delay={delay}>
      <h3 className={cn("text-xl font-semibold", tone === "do" ? "text-moss" : "text-rust")}>{title}</h3>
      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-base leading-snug text-ink">
            <span
              className={cn(
                "mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-white",
                tone === "do" ? "bg-moss" : "bg-rust",
              )}
              aria-hidden
            >
              <Icon size={13} strokeWidth={3} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Abstract, decorative artwork for the system tiles. No data, no claims. */
function SystemArtwork({ art, names }: { art: SystemArt; names: string[] }) {
  if (art === "discover") {
    const half = Math.ceil(names.length / 2);
    const rows = [names.slice(0, half), names.slice(half)];
    return (
      <div className="hb-marquee-host hb-fade-x flex h-full flex-col justify-center gap-3">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="overflow-hidden">
            <div
              className={cn("hb-marquee", rowIndex === 1 && "hb-marquee-reverse")}
              style={{ "--marquee-duration": rowIndex === 0 ? "46s" : "58s" } as CSSProperties}
            >
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0 gap-3 pr-3">
                  {/* Repeated so one half always fills the tile, however few names there are. */}
                  {[...row, ...row, ...row].map((name, index) => (
                    <span
                      key={`${name}-${index}`}
                      className={cn(
                        "whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium",
                        (index + rowIndex) % 3 === 0 ? "bg-ink text-paper" : "bg-paper-2 text-graphite",
                      )}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (art === "direction") {
    return (
      <svg viewBox="0 0 520 204" className="h-full w-full" fill="none" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="hb-route" x1="40" y1="160" x2="470" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1d1d1f" />
            <stop offset="0.5" stopColor="#0071e3" />
            <stop offset="1" stopColor="#5e5ce6" />
          </linearGradient>
        </defs>
        <path d="M40 160C150 160 210 176 300 150S430 120 486 150" stroke="#d2d2d7" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 9" />
        <path d="M40 160C120 160 150 96 230 84S380 40 470 30" stroke="#d2d2d7" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 9" />
        <path
          className="hb-draw-path"
          pathLength={1}
          d="M40 160C170 160 250 60 470 56"
          stroke="url(#hb-route)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="470" cy="56" r="26" fill="#0071e3" fillOpacity="0.1" />
        <circle cx="470" cy="56" r="15" fill="#0071e3" fillOpacity="0.2" />
        <circle cx="470" cy="56" r="6.5" fill="#0071e3" />
        {[
          [148.6, 138.3],
          [240.7, 101.9],
          [353.3, 68.4],
        ].map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="6" fill="#fff" stroke="#0071e3" strokeWidth="2.5" />
        ))}
        <circle cx="40" cy="160" r="7.5" fill="#1d1d1f" />
      </svg>
    );
  }

  if (art === "plan") {
    const week: Array<Array<[number, "done" | "today" | "next"]>> = [
      [[46, "done"], [26, "done"]],
      [[38, "done"]],
      [[58, "today"], [22, "next"]],
      [],
      [[34, "next"]],
      [[66, "next"]],
      [],
    ];
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    return (
      <div className="flex h-full items-end justify-center gap-2 px-7 pb-3 pt-7 sm:gap-2.5 sm:px-8">
        {week.map((blocks, index) => (
          <div key={index} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            {blocks.map(([height, state], blockIndex) => (
              <span
                key={blockIndex}
                className={cn(
                  "w-full rounded-[9px]",
                  state === "done" ? "bg-ink" : state === "today" ? "bg-accent" : "bg-paper-3",
                )}
                style={{ height }}
              />
            ))}
            {blocks.length === 0 && <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />}
            <span
              className={cn(
                "mt-1 text-2xs font-medium",
                index === 2 ? "text-link" : "text-faint",
              )}
            >
              {days[index]}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (art === "build") {
    const levels = [78, 46, 64, 28];
    return (
      <div className="relative flex h-full flex-col justify-center gap-4 px-7 pt-4 sm:px-8">
        <span
          className="absolute bottom-7 left-[calc(1.75rem+(100%-3.5rem)*0.7)] top-9 border-l-2 border-dashed border-line-strong sm:left-[calc(2rem+(100%-4rem)*0.7)]"
        />
        {levels.map((level, index) => (
          <div key={index} className="relative h-3 overflow-hidden rounded-full bg-paper-3">
            <span
              className={cn("absolute inset-y-0 left-0 rounded-full", level >= 70 ? "bg-accent" : "bg-ink")}
              style={{ width: `${level}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center pt-5">
      <div className="relative">
        <span className="absolute inset-0 -translate-x-5 translate-y-2 -rotate-6 rounded-[18px] bg-paper-3" />
        <div className="relative h-[116px] w-[188px] rounded-[18px] bg-paper p-5 shadow-md ring-1 ring-black/[0.05]">
          <span className="block h-2.5 w-20 rounded-full bg-ink" />
          <span className="mt-4 block h-2 w-full rounded-full bg-paper-3" />
          <span className="mt-2 block h-2 w-4/5 rounded-full bg-paper-3" />
          <span className="mt-2 block h-2 w-3/5 rounded-full bg-paper-3" />
          <span className="absolute -right-4 -top-4 flex h-11 w-11 items-center justify-center rounded-full bg-moss text-white shadow-md ring-4 ring-paper">
            <Check size={20} strokeWidth={3} />
          </span>
        </div>
      </div>
    </div>
  );
}
