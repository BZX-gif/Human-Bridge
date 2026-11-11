import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FolderGit2,
  Info,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { getCareerBySlug, getCareerGapForUser } from "@/lib/services/career-service";
import { previewRoadmapForCareer } from "@/lib/services/roadmap-service";
import { listProjectCatalogue } from "@/lib/services/portfolio-service";
import { getCurrentUser } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui/Button";
import { SelectCareerButton } from "@/components/careers/SelectCareerButton";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ScrollMotion } from "@/components/motion/ScrollMotion";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { career } = await getCareerBySlug(slug);
    return {
      title: `${career.name} — career path`,
      description: career.tagline ?? career.description ?? undefined,
    };
  } catch {
    return { title: "Career not found" };
  }
}

const DEMAND_LABELS: Record<string, string> = {
  very_high: "Very high demand signal",
  high: "High demand signal",
  medium: "Moderate demand signal",
  low: "Steady demand signal",
};

const IMPORTANCE_ORDER = { essential: 0, important: 1, helpful: 2 } as const;

export default async function CareerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Career data and session are independent — fetch together. (generateMetadata
  // calls getCareerBySlug too; the request memo collapses it to one execution.)
  const [data, user] = await Promise.all([
    getCareerBySlug(slug).catch(() => null),
    getCurrentUser(),
  ]);
  if (!data) notFound();

  const { career, requiredSkills, blueprint } = data;
  const gapBySlug = new Map<string, Awaited<ReturnType<typeof getCareerGapForUser>>[number]>();
  const tasks = Array.isArray(career.typicalTasks) ? (career.typicalTasks as string[]) : [];
  const requirements = Array.isArray(career.typicalRequirements)
    ? (career.typicalRequirements as string[])
    : [];
  const pathway = Array.isArray(career.careerPathway)
    ? (career.careerPathway as { title: string; description?: string }[])
    : [];

  // Gaps, preview and catalogue are independent — one wave. The page must
  // still render if a secondary query fails, so each is guarded.
  const [gaps, preview, projectCatalogue] = await Promise.all([
    user ? getCareerGapForUser(career.id, user.id).catch(() => []) : Promise.resolve([]),
    previewRoadmapForCareer(career.id, { hoursPerWeek: 6 }).catch(() => null),
    listProjectCatalogue(career.id).catch(
      (): Awaited<ReturnType<typeof listProjectCatalogue>> => [],
    ),
  ]);
  for (const gap of gaps) gapBySlug.set(gap.slug, gap);

  const sortedSkills = [...requiredSkills].sort(
    (a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance],
  );
  const foundationStage = preview?.stages[0];
  const isTarget = user?.targetCareerId === career.id;

  const essentialCount = sortedSkills.filter((skill) => skill.importance === "essential").length;

  return (
    <main id="main-content" className="bg-paper">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-x-clip">
        <div className="hb-aurora -top-[30%] bottom-[30%] opacity-50" aria-hidden />
        <div className="hb-container pb-12 pt-8 sm:pb-16 sm:pt-10">
          <nav aria-label="Breadcrumb" className="animate-fade flex items-center gap-1 text-xs text-muted">
            <Link href="/careers" className="transition-colors duration-200 hover:text-ink">
              Careers
            </Link>
            <ChevronRight size={13} aria-hidden />
            <span className="text-ink" aria-current="page">
              {career.name}
            </span>
          </nav>

          <div className="mt-10 max-w-[860px] sm:mt-14">
            <div className="animate-rise flex flex-wrap items-center gap-2">
              <Badge variant="outline">{DEMAND_LABELS[career.demandLevel ?? "medium"]}</Badge>
              {career.experienceLevel && <Badge variant="default">{career.experienceLevel}</Badge>}
              {career.isDemo && <Badge variant="yellow">Illustrative catalogue</Badge>}
            </div>
            <h1 className="display-xl animate-focus-in mt-6 [animation-delay:60ms]">{career.name}</h1>
            {career.tagline && (
              <p className="animate-rise mt-4 text-2xl font-semibold leading-tight tracking-[-0.02em] text-muted sm:text-3xl [animation-delay:160ms]">
                {career.tagline}
              </p>
            )}
            {career.description && (
              <p className="lede animate-rise mt-6 max-w-[680px] [animation-delay:230ms]">{career.description}</p>
            )}

            <div className="animate-rise mt-9 flex flex-wrap items-center gap-x-7 gap-y-4 [animation-delay:300ms]">
              {!user ? (
                <ButtonLink href="/signup" size="lg">
                  Start this journey
                </ButtonLink>
              ) : isTarget ? (
                <ButtonLink href="/journey" size="lg">
                  Open my journey
                </ButtonLink>
              ) : (
                <SelectCareerButton careerId={career.id} careerName={career.name} size="lg" />
              )}
              {blueprint && (
                <Link href={`/assessments/${blueprint.slug}`} className="hb-link text-base">
                  <ShieldCheck size={17} strokeWidth={1.75} aria-hidden />
                  See the assessment
                </Link>
              )}
              <Link href="/careers" className="hb-link text-base">
                Compare another path
                <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
              </Link>
            </div>
          </div>

          {/* At a glance */}
          <div className="animate-rise-lg mt-12 sm:mt-16 [animation-delay:380ms]">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-6 border-y border-line py-7 sm:grid-cols-2 lg:grid-cols-4">
              <GlanceRow
                label="Indicative salary"
                value={
                  career.salaryMin !== null && career.salaryMax !== null
                    ? `${career.salaryMin}–${career.salaryMax} ${career.salaryUnit ?? "LPA"}`
                    : "Not listed"
                }
                note="Market context only, not an offer"
              />
              <GlanceRow label="Entry point" value={career.experienceLevel ?? "Not specified"} />
              <GlanceRow
                label="Required skills"
                value={`${sortedSkills.length} mapped`}
                note={`${essentialCount} essential`}
              />
              {preview && (
                <GlanceRow
                  label="Realistic study estimate"
                  value={`~${preview.estimatedWeeks} weeks`}
                  note="At 6h/week. An estimate, not a deadline"
                />
              )}
            </dl>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
              Salary and demand figures are indicative market context. Human Bridge does not promise
              employment or a specific salary.
            </p>
          </div>
        </div>
      </section>

      <div className="bg-paper-2">
        <div className="hb-container py-14 sm:py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
            <div className="min-w-0 space-y-16 sm:space-y-24">
              {/* What the role does */}
              <section aria-labelledby="work">
                <SectionTitle
                  id="work"
                  number="01"
                  title="What the work actually looks like"
                  description="The honest version, including the parts people find difficult."
                />
                {career.whatThisRoleDoes && (
                  <p className="mt-7 max-w-3xl text-base leading-relaxed text-graphite" data-reveal>
                    {career.whatThisRoleDoes}
                  </p>
                )}
                {tasks.length > 0 && (
                  <ul className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2" data-reveal>
                    {tasks.map((task) => (
                      <li
                        key={task}
                        className="flex gap-3 rounded-lg bg-paper p-5 text-md leading-snug text-ink"
                      >
                        <Check size={16} strokeWidth={2.4} className="mt-0.5 shrink-0 text-link" aria-hidden />
                        {task}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Skills */}
              <section aria-labelledby="skills">
                <SectionTitle
                  id="skills"
                  number="02"
                  title="Skills this role requires"
                  description={
                    user
                      ? "Your recorded evidence against each requirement. Claims are not scored."
                      : "Sign in to see your own evidence against each requirement."
                  }
                />
                <div className="hb-tile hb-tile-white mt-7 px-6 sm:px-7" data-reveal>
                  {sortedSkills.map((skill, index) => {
                    const gap = gapBySlug.get(skill.slug);
                    return (
                      <div
                        key={skill.slug}
                        className={`grid grid-cols-1 gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_230px] sm:items-center sm:gap-6 ${
                          index > 0 ? "border-t border-line" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <Link
                              href={`/skills/${skill.slug}`}
                              className="text-base font-semibold text-ink transition-colors duration-200 hover:text-link"
                            >
                              {skill.name}
                            </Link>
                            <Badge
                              size="sm"
                              variant={
                                skill.importance === "essential"
                                  ? "dark"
                                  : skill.importance === "important"
                                    ? "outline"
                                    : "ghost"
                              }
                            >
                              {skill.importance}
                            </Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                            Required level: {skill.requiredLevel.replace(/_/g, " ")} · {skill.requiredScore}/100
                          </p>
                        </div>
                        <div className="sm:text-right">
                          {gap ? (
                            <>
                              <div className="flex items-center justify-between text-xs sm:justify-end sm:gap-2">
                                <span className="text-muted">Your evidence</span>
                                <span className="tabular font-medium text-ink">
                                  {gap.currentScore}/{gap.requiredScore}
                                </span>
                              </div>
                              <ProgressBar
                                value={Math.min(100, (gap.currentScore / Math.max(1, gap.requiredScore)) * 100)}
                                size="sm"
                                color={gap.status === "ready" ? "green" : gap.status === "major_gap" ? "red" : "yellow"}
                                className="mt-2"
                                label={`${skill.name} progress`}
                              />
                            </>
                          ) : (
                            <p className="text-xs text-muted">Evidence shown after you sign in</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Entry requirements */}
              <section aria-labelledby="entry">
                <SectionTitle
                  id="entry"
                  number="03"
                  title="Beginner prerequisites and entry requirements"
                  description="What you genuinely need before starting — separated from what is merely helpful."
                />
                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  <div className="hb-tile hb-tile-white p-7" data-reveal>
                    <BookOpen size={24} strokeWidth={1.5} className="text-link" aria-hidden />
                    <h3 className="mt-4 text-lg font-semibold text-ink">Useful starting point</h3>
                    <ul className="mt-4 space-y-3">
                      {requirements.length > 0 ? (
                        requirements.map((item) => (
                          <li key={item} className="flex gap-3 text-md leading-snug text-graphite">
                            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-field" aria-hidden />
                            {item}
                          </li>
                        ))
                      ) : (
                        <li className="text-md text-muted">
                          No formal prerequisites are listed for this catalogue entry.
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="hb-tile hb-tile-white p-7" data-reveal data-reveal-delay={90}>
                    <Layers size={24} strokeWidth={1.5} className="text-link" aria-hidden />
                    <h3 className="mt-4 text-lg font-semibold text-ink">First foundations</h3>
                    <ul className="mt-4 space-y-3">
                      {foundationStage?.milestones.slice(0, 4).map((milestone) => (
                        <li key={milestone.key} className="flex gap-3 text-md leading-snug text-graphite">
                          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-field" aria-hidden />
                          {milestone.title}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                      Proof of ability matters more than a specific degree. The roadmap adapts to your
                      starting level and already-verified skills.
                    </p>
                  </div>
                </div>
              </section>

              {/* Pathway */}
              {preview && (
                <section aria-labelledby="pathway">
                  <SectionTitle
                    id="pathway"
                    number="04"
                    title="A realistic learning pathway"
                    description={`${preview.stages.length} stages, ${preview.stages.reduce((sum, stage) => sum + stage.milestones.length, 0)} milestones. Every milestone has an objective, practice work and completion criteria.`}
                  />
                  <div className="mt-7 space-y-3">
                    {preview.stages.map((stage, index) => (
                      <details
                        key={stage.key}
                        className="group rounded-xl bg-paper transition-shadow duration-500 ease-out-expo open:shadow-md"
                        open={index === 0}
                        data-reveal
                        data-reveal-delay={Math.min(index, 4) * 60}
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
                          <span className="flex min-w-0 items-center gap-4">
                            <span className="tabular flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-xs font-semibold text-graphite transition-colors duration-300 ease-apple group-open:bg-accent group-open:text-white">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-lg font-semibold leading-snug text-ink">{stage.title}</span>
                              <span className="mt-0.5 block text-sm text-muted">
                                {stage.milestones.length} milestones · ~{stage.estimatedWeeks} weeks
                              </span>
                            </span>
                          </span>
                          <ChevronDown
                            size={18}
                            className="shrink-0 text-muted transition-transform duration-500 ease-out-expo group-open:rotate-180"
                            aria-hidden
                          />
                        </summary>
                        <div className="px-5 pb-6 sm:px-6">
                          <p className="border-t border-line pt-5 text-md leading-relaxed text-graphite">
                            {stage.description}
                          </p>
                          <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {stage.milestones.map((milestone) => (
                              <li key={milestone.key} className="rounded-md bg-paper-2 p-4">
                                <p className="text-sm font-medium leading-snug text-ink">{milestone.title}</p>
                                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                                  <Clock size={12} aria-hidden /> ~{milestone.estimatedHours}h estimate
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-muted">
                    This is a structured starting point, not a rigid universal curriculum. Effort
                    estimates are approximate and should be adjusted to your pace.
                  </p>
                </section>
              )}

              {/* Projects */}
              <section aria-labelledby="projects">
                <SectionTitle
                  id="projects"
                  number="05"
                  title="Projects that prove the skills"
                  description="Practical work with deliverables, not tutorials you can copy."
                />
                {projectCatalogue.length > 0 ? (
                  <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                    {projectCatalogue.map((project, index) => (
                      <article
                        key={project.id}
                        className="hb-tile hb-tile-white flex flex-col p-7"
                        data-reveal
                        data-reveal-delay={(index % 2) * 90}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <FolderGit2 size={24} strokeWidth={1.5} className="text-link" aria-hidden />
                          <span className="text-xs text-muted">
                            {project.difficulty ?? "Project"} · ~{project.estimatedHours ?? 10}h
                          </span>
                        </div>
                        <h3 className="mt-5 text-xl font-semibold leading-tight text-ink">{project.title}</h3>
                        <p className="mt-2 flex-1 text-md leading-relaxed text-muted">{project.description}</p>
                        {project.deliverables.length > 0 && (
                          <ul className="mt-5 space-y-2 border-t border-line pt-5">
                            {project.deliverables.slice(0, 3).map((deliverable) => (
                              <li key={deliverable} className="flex gap-2.5 text-sm leading-snug text-graphite">
                                <Check size={14} strokeWidth={2.4} className="mt-0.5 shrink-0 text-moss" aria-hidden />
                                {deliverable}
                              </li>
                            ))}
                          </ul>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-7 rounded-xl bg-paper p-6 text-md leading-relaxed text-muted">
                    No catalogue projects are tagged to this career yet. Your roadmap will still
                    include an applied project, and you can add your own work to your portfolio at any
                    time.
                  </p>
                )}
                <Link href="/projects" className="hb-link mt-6 text-base">
                  Browse the project library
                  <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
                </Link>
              </section>

              {/* Progression */}
              {pathway.length > 0 && (
                <section aria-labelledby="progression">
                  <SectionTitle
                    id="progression"
                    number="06"
                    title="Where this can lead"
                    description="Typical progression, not a guaranteed promotion path."
                  />
                  <ol className="hb-tile hb-tile-white mt-7 p-7" data-reveal>
                    {pathway.map((stage, index) => (
                      <li key={stage.title} className="flex gap-5">
                        <div className="flex flex-col items-center">
                          <span className="tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-link">
                            {index + 1}
                          </span>
                          {index < pathway.length - 1 && (
                            <span className="my-1.5 w-px flex-1 bg-line-strong" aria-hidden />
                          )}
                        </div>
                        <div className={index < pathway.length - 1 ? "pb-7 pt-1" : "pt-1"}>
                          <p className="text-base font-semibold leading-snug text-ink">{stage.title}</p>
                          {stage.description && (
                            <p className="mt-1 text-sm leading-relaxed text-muted">{stage.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {/* Portfolio expectations */}
              <section aria-labelledby="portfolio">
                <SectionTitle
                  id="portfolio"
                  number="07"
                  title="What a credible portfolio looks like"
                  description="What a hiring manager can actually check, and what they will discount."
                />
                <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                  {[
                    {
                      title: "Two or three finished pieces",
                      body: "Finished beats numerous. Each project should have a clear problem, a deliverable and a short explanation of your decisions.",
                    },
                    {
                      title: "Evidence of process",
                      body: "Show how you approached the work, what you tried that failed and how you validated the result.",
                    },
                    {
                      title: "Skills you can defend",
                      body: "Every skill you list should survive a follow-up question. Self-reported claims are labelled, not inflated.",
                    },
                    {
                      title: "Honest limits",
                      body: "State what the project does not do. Credibility comes from precision, not from overclaiming.",
                    },
                  ].map((item, index) => (
                    <div
                      key={item.title}
                      className="hb-tile hb-tile-white p-7"
                      data-reveal
                      data-reveal-delay={(index % 2) * 90}
                    >
                      <h3 className="text-lg font-semibold leading-snug text-ink">{item.title}</h3>
                      <p className="mt-2 text-md leading-relaxed text-muted">{item.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-[76px] lg:self-start">
              <div className="hb-tile hb-tile-dark on-dark p-7">
                <div className="hb-aurora hb-aurora-dark opacity-70" aria-hidden />
                <p className="text-sm font-semibold text-[#a1a1a6]">Your next step</p>
                <p className="mt-3 text-2xl font-semibold leading-[1.15] tracking-[-0.02em]">
                  Turn this career into a plan you can follow this week.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#a1a1a6]">
                  Human Bridge maps every required skill to milestones, then breaks the current one
                  into daily actions around your available time.
                </p>
                <div className="mt-6 flex flex-col items-stretch gap-4">
                  {!user ? (
                    <ButtonLink href="/signup" className="w-full">
                      Create a free account
                    </ButtonLink>
                  ) : isTarget ? (
                    <ButtonLink href="/journey" className="w-full">
                      Open my journey
                    </ButtonLink>
                  ) : (
                    <SelectCareerButton careerId={career.id} careerName={career.name} fullWidth />
                  )}
                  <Link href="/careers" className="hb-link justify-center text-sm">
                    Explore other careers
                    <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                  </Link>
                </div>
              </div>

              <div className="hb-tile hb-tile-white mt-4 p-7">
                <p className="text-sm font-semibold text-ink">Suggested next steps</p>
                <ol className="mt-4 space-y-3.5">
                  {[
                    "Read the work section and note what you would dislike.",
                    "Check the essential skills against what you can already show.",
                    "Pick one beginner project and finish it before adding another.",
                    "Take an assessment only when you can do the work unaided.",
                  ].map((step, index) => (
                    <li key={step} className="flex gap-3 text-sm leading-snug text-graphite">
                      <span className="tabular w-3 shrink-0 font-semibold text-link">{index + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <p className="mt-4 flex items-start gap-2 px-1 text-2xs leading-relaxed text-muted">
                <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
                Career information is reviewed as catalogue data and clearly marked when illustrative.
                It is not personalised advice.
              </p>
            </aside>
          </div>
        </div>
      </div>

      <ScrollMotion />
    </main>
  );
}

function SectionTitle({
  id,
  number,
  title,
  description,
}: {
  id: string;
  number: string;
  title: string;
  description?: string;
}) {
  return (
    <div data-reveal>
      <p className="tabular text-sm font-semibold text-link" aria-hidden>
        {number}
      </p>
      <h2 id={id} className="display-md mt-2 max-w-2xl text-ink">
        {title}
      </h2>
      {description && <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

function GlanceRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1.5 text-2xl font-semibold leading-tight tracking-[-0.02em] text-ink">{value}</dd>
      {note && <dd className="mt-1 text-xs leading-snug text-muted">{note}</dd>}
    </div>
  );
}
