import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Compass,
  FolderGit2,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/db";
import { listCareerSummaries } from "@/lib/services/career-service";
import { DEMO_PROJECTS } from "@/lib/demo-data";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const DEMAND_LABEL: Record<string, string> = {
  very_high: "Very high demand",
  high: "High demand",
  medium: "Steady demand",
  low: "Niche demand",
};

const SYSTEM = [
  {
    step: "01",
    title: "Discover",
    body: "Understand what a role actually involves before you commit years to it. The work, the skills, the entry points and the honest trade-offs.",
    href: "/careers",
    link: "Explore careers",
    icon: Compass,
  },
  {
    step: "02",
    title: "Direction",
    body: "Choose a primary career goal. It becomes the spine of everything: your roadmap, your weekly plan, your project choices and your portfolio.",
    href: "/journey",
    link: "See the roadmap",
    icon: Target,
  },
  {
    step: "03",
    title: "Plan",
    body: "Turn milestones into sessions that fit the hours you really have. Daily, weekly and monthly views. Reschedule without shame.",
    href: "/planner",
    link: "Open the planner",
    icon: CalendarDays,
  },
  {
    step: "04",
    title: "Build",
    body: "Work through exercises and real projects. Track skills against the role's requirements and see exactly where the gaps are.",
    href: "/projects",
    link: "Browse projects",
    icon: Layers,
  },
  {
    step: "05",
    title: "Prove",
    body: "Completed work becomes portfolio evidence. Assessments create verified scores. You decide what is public, and you can change your mind.",
    href: "/portfolio",
    link: "See the portfolio",
    icon: FolderGit2,
  },
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

export default async function HomePage() {
  const [user, careers] = await Promise.all([
    getCurrentUser(),
    isDatabaseConfigured() ? listCareerSummaries().catch(() => []) : Promise.resolve([]),
  ]);

  const featured = careers.slice(0, 6);
  const workspaceHref = user ? (user.role === "employer" ? "/employers/dashboard" : "/dashboard") : "/signup";
  const projects = DEMO_PROJECTS.slice(0, 3);

  return (
    <main id="main-content">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-paper">
        <div className="hb-container grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:items-center lg:gap-14 lg:py-20">
          <div className="animate-rise">
            <p className="eyebrow">Career-building operating system</p>
            <h1 className="display-xl mt-4 max-w-[560px] text-balance">
              Your ambition deserves a direction.
            </h1>
            <p className="lede mt-5 max-w-[520px]">
              Human Bridge turns the career you want into a staged roadmap, a plan that fits your
              real week, and evidence you can show. One connected system — not another list of
              courses.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <ButtonLink href={workspaceHref} size="lg">
                {user ? "Open your workspace" : "Build your direction"}
                <ArrowRight size={15} aria-hidden />
              </ButtonLink>
              <ButtonLink href="/careers" variant="secondary" size="lg">
                Explore careers
              </ButtonLink>
            </div>

            <p className="mt-5 flex items-start gap-2 text-[11.5px] leading-relaxed text-muted">
              <ShieldCheck size={13} className="mt-0.5 shrink-0 text-graphite" aria-hidden />
              Free to use. No invented statistics, no fake job listings, no guaranteed outcomes.
            </p>

            <dl className="mt-8 grid max-w-[500px] grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Connected</dt>
                <dd className="mt-1 text-[12px] leading-snug text-graphite">5 parts, one plan</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Career paths</dt>
                <dd className="mt-1 text-[12px] leading-snug text-graphite">
                  {careers.length > 0 ? `${careers.length} mapped roles` : "Mapped roles"}
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">Built for</dt>
                <dd className="mt-1 text-[12px] leading-snug text-graphite">Studying alongside life</dd>
              </div>
            </dl>
          </div>

          <div className="animate-scale-in min-w-0 [animation-delay:120ms]">
            <ProductPreview />
            <p className="mt-2 text-center text-[10px] text-faint">
              Interactive preview with sample data. Your workspace is private.
            </p>
          </div>
        </div>
      </section>

      {/* ── Positioning ──────────────────────────────────────────────────── */}
      <section className="bg-ink text-paper">
        <div className="hb-container py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">The problem</p>
              <h2 className="mt-4 max-w-[520px] font-display text-[clamp(1.9rem,3.6vw,2.75rem)] leading-[1.08] tracking-[-0.015em] text-balance">
                Most career advice gives you a title and a pile of links. That is not a direction.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:pt-2">
              {[
                ["A gap, not a list", "Knowing you need SQL is not the same as knowing which query to practise on Tuesday."],
                ["Plans that survive life", "A plan built on ten imaginary hours collapses in week two. Yours is sized to the hours you have."],
                ["Evidence over adjectives", "“Hard-working” is a claim. A finished project with a reflection is something a person can inspect."],
                ["You own the record", "Your portfolio is private by default. Nothing is shared with an employer unless you enable it."],
              ].map(([title, body]) => (
                <div key={title} className="border-t border-white/15 pt-4">
                  <h3 className="text-[12.5px] font-medium text-paper">{title}</h3>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-paper/60">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The system ───────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-paper-2 py-12 sm:py-16">
        <div className="hb-container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">One system</p>
              <h2 className="display-lg mt-3 max-w-[620px]">
                Five parts that actually talk to each other.
              </h2>
            </div>
            <p className="max-w-[360px] text-[12px] leading-relaxed text-muted">
              A career goal changes the roadmap. The roadmap changes the plan. The plan produces
              work. The work becomes evidence. Evidence changes what you apply for.
            </p>
          </div>

          <ol className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {SYSTEM.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.step} className="flex flex-col bg-paper p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-paper-2 text-graphite">
                      <Icon size={14} aria-hidden />
                    </span>
                    <span className="font-display text-[20px] text-line-strong">{item.step}</span>
                  </div>
                  <h3 className="mt-4 font-display text-[21px] leading-tight">{item.title}</h3>
                  <p className="mt-1.5 flex-1 text-[11px] leading-relaxed text-muted">{item.body}</p>
                  <Link href={item.href} className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                    {item.link}
                    <ArrowRight size={11} aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 border-b border-line bg-paper py-12 sm:py-16">
        <div className="hb-container">
          <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-16">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className="display-lg mt-3">From “I think I want this” to “here is what I built.”</h2>
              <p className="mt-3 text-[12px] leading-relaxed text-muted">
                Four steps, in order. Each one produces something the next one needs — no
                motivational filler in between.
              </p>
              <ButtonLink href={workspaceHref} size="md" className="mt-5">
                Start with a direction
                <ArrowRight size={14} aria-hidden />
              </ButtonLink>
            </div>

            <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
              {HOW.map((item, index) => (
                <li key={item.title} className="bg-paper p-5 sm:p-6">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-[10px] tabular text-muted">
                    {index + 1}
                  </span>
                  <h3 className="mt-3 text-[13.5px] font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Career exploration ───────────────────────────────────────────── */}
      <section className="border-b border-line bg-paper-2 py-12 sm:py-16">
        <div className="hb-container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Career exploration</p>
              <h2 className="display-lg mt-3">Look before you commit.</h2>
              <p className="mt-2 max-w-[600px] text-[12.5px] leading-relaxed text-muted">
                Every career page explains the day-to-day work, the skills that matter, the entry
                points and the projects that prove competence. Salary ranges are indicative context,
                not promises.
              </p>
            </div>
            <ButtonLink href="/careers" variant="secondary" size="md">
              All careers
              <ArrowUpRight size={13} aria-hidden />
            </ButtonLink>
          </div>

          {featured.length === 0 ? (
            <div className="mt-7 rounded-lg border border-dashed border-line-strong bg-paper p-8 text-center">
              <p className="text-[12.5px] text-muted">
                Career data is not available right now. You can still create an account and choose a
                direction later.
              </p>
            </div>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((career) => (
                <li key={career.id}>
                  <Link
                    href={`/careers/${career.slug}`}
                    className="group flex h-full flex-col rounded-lg border border-line bg-paper p-5 transition-colors hover:border-line-strong"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                        {career.trackName ?? "Career"}
                      </span>
                      {career.demandLevel && (
                        <span className="rounded-[3px] bg-paper-3 px-1.5 py-0.5 text-[9px] text-graphite">
                          {DEMAND_LABEL[career.demandLevel] ?? career.demandLevel}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-display text-[22px] leading-tight text-ink">{career.name}</h3>
                    <p className="mt-1.5 line-clamp-2 flex-1 text-[11.5px] leading-relaxed text-muted">
                      {career.tagline ?? career.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                      <span className="text-[10.5px] text-faint">
                        {career.skillCount} skills · {career.essentialCount} essential
                      </span>
                      <ArrowUpRight
                        size={13}
                        className="text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Skill journeys + roadmap ─────────────────────────────────────── */}
      <section className="border-b border-line bg-paper py-12 sm:py-16">
        <div className="hb-container grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="eyebrow">Skill journeys</p>
            <h2 className="display-lg mt-3">A route, not a library.</h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              Courses rarely tell you the order. Human Bridge stages the skills a role needs, so you
              always know what to learn next and why it unlocks what follows.
            </p>
            <ol className="mt-6 space-y-0">
              {STAGES.map((stage, index) => (
                <li key={stage.name} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < STAGES.length - 1 && (
                    <span className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-px bg-line" aria-hidden />
                  )}
                  <span className="relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper text-[8.5px] tabular text-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-[12.5px] font-semibold text-ink">{stage.name}</h3>
                      <span className="text-[9.5px] text-faint">~{stage.weeks} weeks at 6h/wk</span>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{stage.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[10px] leading-relaxed text-faint">
              Time ranges are estimates based on the milestone effort, not deadlines. Your pace
              depends on your starting point and the hours you have.
            </p>
          </div>

          <div>
            <p className="eyebrow">Personal roadmap</p>
            <h2 className="display-lg mt-3">Every milestone earns its place.</h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              Generated from your chosen career and adjusted to whether you are starting fresh or
              already have some experience.
            </p>

            <div className="mt-6 rounded-lg border border-line bg-paper-2 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-[3px] border border-line bg-paper px-1.5 py-0.5 text-[9px] font-medium text-graphite">
                  Stage 2 · Core skills
                </span>
                <span className="text-[10px] text-faint">~6 hours · estimate</span>
              </div>
              <h3 className="mt-3 font-display text-[24px] leading-tight">Query a database with confidence</h3>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                Filtering and joins are the difference between reading a table and being able to ask
                it a question. Every later analysis depends on this.
              </p>
              <dl className="mt-4 grid gap-3 border-t border-line pt-3 text-[11px] sm:grid-cols-2">
                {[
                  ["Skills", "SQL, data literacy"],
                  ["Practice", "3 query sets on a sample database"],
                  ["Done when", "Output matches the expected result"],
                  ["Depends on", "Foundations"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</dt>
                    <dd className="mt-0.5 leading-relaxed text-graphite">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {["Progress saved automatically", "Adjust or skip milestones", "Rebuild when your goal changes"].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-[10.5px] text-muted">
                  <Check size={11} className="text-moss" aria-hidden />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Projects ─────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-paper-2 py-12 sm:py-16">
        <div className="hb-container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Project-based learning</p>
              <h2 className="display-lg mt-3">Finish something. Then explain it.</h2>
              <p className="mt-2 max-w-[620px] text-[12.5px] leading-relaxed text-muted">
                Projects carry the skills, deliverables and completion criteria that make learning
                visible. Completed work enters your portfolio — labelled as self-attested until an
                assessment verifies it.
              </p>
            </div>
            <ButtonLink href="/projects" variant="secondary" size="md">
              Project library
              <ArrowUpRight size={13} aria-hidden />
            </ButtonLink>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li key={project.id} className="flex flex-col rounded-lg border border-line bg-paper p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                    {project.difficulty}
                  </span>
                  <span className="text-[9.5px] text-faint">~{project.estimatedHours}h</span>
                </div>
                <h3 className="mt-2 text-[13.5px] font-semibold leading-snug text-ink">{project.title}</h3>
                <p className="mt-1.5 flex-1 text-[11px] leading-relaxed text-muted">{project.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {project.skills.slice(0, 3).map((skill) => (
                    <span key={skill} className="rounded-[3px] bg-paper-3 px-1.5 py-0.5 text-[9.5px] text-graphite">
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="mt-3 border-t border-line pt-2 text-[9.5px] text-faint">
                  {project.deliverables.length} deliverables · {project.careerName}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] text-faint">
            Illustrative catalogue projects. You can also add your own work.
          </p>
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-paper py-12 sm:py-16">
        <div className="hb-container">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
            <div>
              <p className="eyebrow">Trust</p>
              <h2 className="display-lg mt-3">What this product will never do.</h2>
              <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
                Career tools have a habit of inventing certainty. Human Bridge is built the other
                way: show the evidence, name the estimate, and let you decide what to do with it.
              </p>
              <div className="mt-5 flex items-center gap-2 rounded-md border border-line bg-paper-2 p-3">
                <ShieldCheck size={15} className="shrink-0 text-graphite" aria-hidden />
                <p className="text-[10.5px] leading-relaxed text-muted">
                  Your plan and evidence stay private until you enable a public portfolio. You choose
                  which sections it shows.
                </p>
              </div>
            </div>

            <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
              <div className="bg-paper p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-moss">We do</p>
                <ul className="mt-3 space-y-2.5">
                  {[
                    "Show the source of every score",
                    "Label effort and salary as estimates",
                    "Separate claimed skills from verified ones",
                    "Work without AI when it is unavailable",
                    "Let you change direction",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[11px] leading-relaxed text-graphite">
                      <Check size={11} className="mt-0.5 shrink-0 text-moss" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-paper p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rust">We do not</p>
                <ul className="mt-3 space-y-2.5">
                  {[
                    "Guarantee a job, interview or salary",
                    "Publish invented statistics or success stories",
                    "Create fake employers or vacancies",
                    "Mark a skill verified from a checkbox",
                    "Sell your data to recruiters",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[11px] leading-relaxed text-graphite">
                      <X size={11} className="mt-0.5 shrink-0 text-rust" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mentor ───────────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-paper-2 py-12 sm:py-16">
        <div className="hb-container grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <p className="eyebrow">Guidance</p>
            <h2 className="display-lg mt-3">Advice that knows your actual plan.</h2>
            <p className="mt-3 max-w-[540px] text-[12.5px] leading-relaxed text-muted">
              The mentor reads your roadmap, your recorded skills and your week — not a generic
              template. It can reduce an overloaded plan to one useful action, explain a concept, or
              point to the gap that blocks the most progress.
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "Grounded in your own data, with its limits stated",
                "Never invents resources, certificates or opportunities",
                "Falls back to a guided response if AI is unavailable",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-graphite">
                  <Sparkles size={12} className="mt-0.5 shrink-0 text-faint" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <ButtonLink href={user ? "/mentor" : "/signup"} variant="secondary" size="md" className="mt-5">
              {user ? "Ask the mentor" : "Try it with your own plan"}
              <ArrowRight size={13} aria-hidden />
            </ButtonLink>
          </div>
          <div className="rounded-lg border border-line bg-paper p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Mentor</p>
              <span className="rounded-[3px] border border-line bg-paper-2 px-1.5 py-0.5 text-[9px] text-muted">Guided mode</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="ml-auto max-w-[85%] rounded-lg rounded-br-[3px] bg-ink px-3.5 py-2.5 text-[11.5px] leading-relaxed text-paper">
                I have an interview in two weeks and feel underprepared.
              </div>
              <div className="max-w-[90%] rounded-lg rounded-bl-[3px] border border-line bg-paper px-3.5 py-2.5">
                <p className="text-[11.5px] leading-[1.7] text-graphite">
                  Start from evidence, not adjectives. Choose two projects and write a three-minute
                  walkthrough of each: the problem, what you decided, what failed. Then rehearse the
                  hardest question — what would you do differently. I will not invent questions from
                  a real employer.
                </p>
                <p className="mt-2 border-t border-line pt-2 text-[9px] uppercase tracking-[0.1em] text-faint">
                  Guided response · from your portfolio
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-ink text-paper">
        <div className="hb-container py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">Start here</p>
              <h2 className="mt-4 max-w-[680px] font-display text-[clamp(2rem,4.6vw,3.2rem)] leading-[1.02] tracking-[-0.02em] text-balance">
                A direction, then a plan, then evidence.
              </h2>
              <p className="mt-4 max-w-[520px] text-[12.5px] leading-relaxed text-paper/60">
                You do not need to know everything today. Choose one role worth exploring and let the
                system turn it into a first week you can actually complete.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
              <Link
                href={workspaceHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-paper px-5 text-[13px] font-medium text-ink transition-colors hover:bg-paper-3"
              >
                {user ? "Open your workspace" : "Create your plan"}
                <ArrowRight size={14} aria-hidden />
              </Link>
              <Link
                href="/careers"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 px-5 text-[13px] font-medium text-paper transition-colors hover:border-white/40"
              >
                Browse careers
              </Link>
            </div>
          </div>
          <p className="mt-10 border-t border-white/10 pt-4 text-[10px] leading-relaxed text-paper/40">
            Human Bridge is a career-building tool, not an employment agency. We do not promise
            interviews, offers, salaries or promotions. Outcomes depend on your work, the market and
            factors outside any product&apos;s control.
          </p>
        </div>
      </section>
    </main>
  );
}
