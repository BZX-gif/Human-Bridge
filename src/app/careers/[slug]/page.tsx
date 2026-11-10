import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
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

  let data;
  try {
    data = await getCareerBySlug(slug);
  } catch {
    notFound();
  }

  const { career, requiredSkills, blueprint } = data;
  const user = await getCurrentUser();
  const gaps = user ? await getCareerGapForUser(career.id, user.id) : [];
  const gapBySlug = new Map(gaps.map((gap) => [gap.slug, gap]));
  const tasks = Array.isArray(career.typicalTasks) ? (career.typicalTasks as string[]) : [];
  const requirements = Array.isArray(career.typicalRequirements)
    ? (career.typicalRequirements as string[])
    : [];
  const pathway = Array.isArray(career.careerPathway)
    ? (career.careerPathway as { title: string; description?: string }[])
    : [];

  let preview = null;
  let projectCatalogue: Awaited<ReturnType<typeof listProjectCatalogue>> = [];
  try {
    preview = await previewRoadmapForCareer(career.id, { hoursPerWeek: 6 });
    projectCatalogue = await listProjectCatalogue(career.id);
  } catch {
    // The career page must still render if a secondary query fails.
  }

  const sortedSkills = [...requiredSkills].sort(
    (a, b) => IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance],
  );
  const foundationStage = preview?.stages[0];
  const isTarget = user?.targetCareerId === career.id;

  return (
    <main id="main-content" className="bg-paper pt-16">
      {/* Header */}
      <section className="border-b border-line">
        <div className="hb-container py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted">
            <Link href="/careers" className="transition-colors hover:text-ink">
              Careers
            </Link>
            <ChevronRight size={12} aria-hidden />
            <span className="text-graphite">{career.name}</span>
          </nav>

          <div className="mt-7 grid gap-10 lg:grid-cols-[1.45fr_0.85fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{DEMAND_LABELS[career.demandLevel ?? "medium"]}</Badge>
                {career.experienceLevel && <Badge variant="default">{career.experienceLevel}</Badge>}
                {career.isDemo && <Badge variant="yellow">Illustrative catalogue</Badge>}
              </div>
              <h1 className="display-lg mt-5">{career.name}</h1>
              {career.tagline && <p className="mt-3 font-display text-[22px] text-graphite">{career.tagline}</p>}
              {career.description && <p className="lede mt-4">{career.description}</p>}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                {!user ? (
                  <ButtonLink href="/signup">
                    Start this journey
                    <ArrowRight size={15} aria-hidden />
                  </ButtonLink>
                ) : isTarget ? (
                  <ButtonLink href="/journey">
                    Open my journey
                    <ArrowRight size={15} aria-hidden />
                  </ButtonLink>
                ) : (
                  <SelectCareerButton careerId={career.id} careerName={career.name} />
                )}
                {blueprint && (
                  <ButtonLink href={`/assessments/${blueprint.slug}`} variant="secondary">
                    <ShieldCheck size={15} aria-hidden />
                    See the assessment
                  </ButtonLink>
                )}
                <Link
                  href="/careers"
                  className="text-[12.5px] font-medium text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                >
                  Compare another path
                </Link>
              </div>
            </div>

            <aside className="rounded-lg border border-line bg-paper-2 p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                At a glance
              </p>
              <dl className="mt-4 space-y-3.5">
                <GlanceRow
                  label="Indicative salary"
                  value={
                    career.salaryMin !== null && career.salaryMax !== null
                      ? `${career.salaryMin}–${career.salaryMax} ${career.salaryUnit ?? "LPA"}`
                      : "Not listed"
                  }
                  note="Market context only, not an offer"
                />
                <GlanceRow
                  label="Entry point"
                  value={career.experienceLevel ?? "Not specified"}
                />
                <GlanceRow
                  label="Required skills"
                  value={`${sortedSkills.length} mapped · ${sortedSkills.filter((s) => s.importance === "essential").length} essential`}
                />
                {preview && (
                  <GlanceRow
                    label="Realistic study estimate"
                    value={`~${preview.estimatedWeeks} weeks at 6h/week`}
                    note="An estimate, not a deadline"
                  />
                )}
              </dl>
              <div className="mt-5 flex items-start gap-2 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
                <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
                Salary and demand figures are indicative market context. Human Bridge does not
                promise employment or a specific salary.
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="hb-container py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          <div className="min-w-0 space-y-14 sm:space-y-16">
            {/* What the role does */}
            <section aria-labelledby="work">
              <SectionTitle
                id="work"
                number="01"
                title="What the work actually looks like"
                description="The honest version, including the parts people find difficult."
              />
              {career.whatThisRoleDoes && (
                <p className="mt-6 max-w-3xl text-[13.5px] leading-[1.75] text-graphite">
                  {career.whatThisRoleDoes}
                </p>
              )}
              {tasks.length > 0 && (
                <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
                  {tasks.map((task) => (
                    <li key={task} className="flex gap-3 bg-paper p-4 text-[12.5px] leading-relaxed text-graphite">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-faint" aria-hidden />
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
              <div className="mt-6 overflow-hidden rounded-lg border border-line">
                {sortedSkills.map((skill, index) => {
                  const gap = gapBySlug.get(skill.slug);
                  return (
                    <div
                      key={skill.slug}
                      className={`grid gap-3 p-4 sm:grid-cols-[1fr_180px] sm:items-center ${
                        index > 0 ? "border-t border-line" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/skills/${skill.slug}`}
                            className="text-[13px] font-medium text-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-line-strong"
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
                        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted">
                          Required level: {skill.requiredLevel.replace(/_/g, " ")} · {skill.requiredScore}/100
                        </p>
                      </div>
                      <div className="sm:text-right">
                        {gap ? (
                          <>
                            <div className="flex items-center justify-between text-[11px] sm:justify-end sm:gap-2">
                              <span className="text-muted">Your evidence</span>
                              <span className="tabular text-graphite">
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
                          <p className="text-[11px] text-faint">Evidence shown after you sign in</p>
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
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-line p-5">
                  <h3 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink">
                    <BookOpen size={14} aria-hidden />
                    Useful starting point
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {requirements.length > 0 ? (
                      requirements.map((item) => (
                        <li key={item} className="flex gap-2.5 text-[12.5px] leading-relaxed text-graphite">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden />
                          {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-[12.5px] text-muted">
                        No formal prerequisites are listed for this catalogue entry.
                      </li>
                    )}
                  </ul>
                </div>
                <div className="rounded-lg border border-line p-5">
                  <h3 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink">
                    <Layers size={14} aria-hidden />
                    First foundations
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {foundationStage?.milestones.slice(0, 4).map((milestone) => (
                      <li key={milestone.key} className="flex gap-2.5 text-[12.5px] leading-relaxed text-graphite">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden />
                        {milestone.title}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[11px] leading-relaxed text-faint">
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
                <div className="mt-6 space-y-3">
                  {preview.stages.map((stage, index) => (
                    <details
                      key={stage.key}
                      className="group rounded-lg border border-line bg-paper open:bg-paper-2/50"
                      open={index === 0}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5">
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper text-[10px] font-semibold tabular text-graphite">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[13.5px] font-semibold text-ink">{stage.title}</span>
                            <span className="mt-0.5 block text-[11.5px] text-muted">
                              {stage.milestones.length} milestones · ~{stage.estimatedWeeks} weeks
                            </span>
                          </span>
                        </span>
                        <ChevronRight
                          size={16}
                          className="shrink-0 text-faint transition-transform duration-200 group-open:rotate-90"
                          aria-hidden
                        />
                      </summary>
                      <div className="border-t border-line px-4 pb-5 pt-4 sm:px-5">
                        <p className="text-[12.5px] leading-relaxed text-graphite">{stage.description}</p>
                        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                          {stage.milestones.map((milestone) => (
                            <li key={milestone.key} className="rounded-md border border-line bg-paper p-3">
                              <p className="text-[12px] font-medium text-ink">{milestone.title}</p>
                              <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-muted">
                                <Clock size={10} aria-hidden /> ~{milestone.estimatedHours}h estimate
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-faint">
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
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {projectCatalogue.map((project) => (
                    <article key={project.id} className="flex flex-col rounded-lg border border-line p-5">
                      <div className="flex items-start justify-between gap-2">
                        <FolderGit2 size={16} className="text-faint" aria-hidden />
                        <span className="text-[10.5px] uppercase tracking-[0.1em] text-faint">
                          {project.difficulty ?? "Project"} · ~{project.estimatedHours ?? 10}h
                        </span>
                      </div>
                      <h3 className="mt-3 text-[13.5px] font-semibold text-ink">{project.title}</h3>
                      <p className="mt-2 flex-1 text-[12px] leading-relaxed text-muted">
                        {project.description}
                      </p>
                      {project.deliverables.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {project.deliverables.slice(0, 3).map((deliverable) => (
                            <li key={deliverable} className="flex gap-2 text-[11px] text-graphite">
                              <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-faint" aria-hidden />
                              {deliverable}
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-lg border border-line bg-paper-2 p-5 text-[12.5px] leading-relaxed text-muted">
                  No catalogue projects are tagged to this career yet. Your roadmap will still
                  include an applied project, and you can add your own work to your portfolio at any
                  time.
                </p>
              )}
              <Link
                href="/projects"
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink underline decoration-line-strong underline-offset-4"
              >
                Browse the project library
                <ArrowUpRight size={13} aria-hidden />
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
                <ol className="mt-6 space-y-0">
                  {pathway.map((stage, index) => (
                    <li key={stage.title} className="relative flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-paper text-[10px] font-semibold tabular text-graphite">
                          {index + 1}
                        </span>
                        {index < pathway.length - 1 && <span className="mt-1 w-px flex-1 bg-line" aria-hidden />}
                      </div>
                      <div className="pb-1">
                        <p className="text-[13px] font-medium text-ink">{stage.title}</p>
                        {stage.description && (
                          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{stage.description}</p>
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
              <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
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
                ].map((item) => (
                  <div key={item.title} className="bg-paper p-5">
                    <h3 className="text-[12.5px] font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{item.body}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-ink bg-ink p-5 text-paper">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Your next step
              </p>
              <p className="mt-3 font-display text-[24px] leading-tight">
                Turn this career into a plan you can follow this week.
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-white/55">
                Human Bridge maps every required skill to milestones, then breaks the current one
                into daily actions around your available time.
              </p>
              <div className="mt-5 space-y-2">
                {!user ? (
                  <ButtonLink href="/signup" variant="secondary" className="w-full border-paper bg-paper text-ink hover:bg-paper-3">
                    Create a free account
                  </ButtonLink>
                ) : isTarget ? (
                  <ButtonLink href="/journey" variant="secondary" className="w-full border-paper bg-paper text-ink hover:bg-paper-3">
                    Open my journey
                  </ButtonLink>
                ) : (
                  <SelectCareerButton careerId={career.id} careerName={career.name} fullWidth />
                )}
                <ButtonLink
                  href="/careers"
                  variant="ghost"
                  className="w-full text-white/65 hover:bg-white/5 hover:text-paper"
                >
                  Explore other careers
                </ButtonLink>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-paper p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                Suggested next steps
              </p>
              <ol className="mt-4 space-y-3">
                {[
                  "Read the work section and note what you would dislike.",
                  "Check the essential skills against what you can already show.",
                  "Pick one beginner project and finish it before adding another.",
                  "Take an assessment only when you can do the work unaided.",
                ].map((step, index) => (
                  <li key={step} className="flex gap-3 text-[12px] leading-relaxed text-graphite">
                    <span className="font-display text-base leading-none text-faint">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 flex items-start gap-2 px-1 text-[11px] leading-relaxed text-faint">
              <Info size={12} className="mt-0.5 shrink-0" aria-hidden />
              Career information is reviewed as catalogue data and clearly marked when illustrative.
              It is not personalised advice.
            </div>
          </aside>
        </div>
      </div>
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
    <div className="border-t border-line pt-6">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-[15px] tabular text-faint">{number}</span>
        <h2 id={id} className="font-display text-[clamp(1.5rem,2.6vw,2rem)] leading-tight text-ink">
          {title}
        </h2>
      </div>
      {description && <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

function GlanceRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-[11px] text-faint">{label}</dt>
      <dd className="mt-0.5 text-[13px] font-medium text-ink">{value}</dd>
      {note && <p className="mt-0.5 text-[10.5px] text-faint">{note}</p>}
    </div>
  );
}
