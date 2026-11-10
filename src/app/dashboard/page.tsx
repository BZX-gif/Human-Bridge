import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Compass,
  ExternalLink,
  FolderGit2,
  Layers,
  Map,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { careers, users } from "@/db/schema";
import { ensureRoadmapForUser, getRoadmapForUser, loadRoadmapForUser } from "@/lib/services/roadmap-service";
import { getPlannerData, startOfDay, endOfDay, addDays } from "@/lib/services/planner-service";
import { getPortfolioForUser } from "@/lib/services/portfolio-service";
import { getCareerGapForUser, listCareerSummaries } from "@/lib/services/career-service";
import { listJobsWithMatch } from "@/lib/services/job-service";
import { DashboardTodayTasks } from "@/components/dashboard/DashboardTodayTasks";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Panel, SectionHeader, Stat } from "@/components/ui/AppPage";
import { ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Overview",
  description: "Your career command centre: direction, evidence and the next action.",
};

async function loadDashboardData(userId: number, record: typeof users.$inferSelect) {
  const db = await getDb();

    let targetCareer = null;
    if (record.targetCareerId) {
      const [career] = await db.select().from(careers).where(eq(careers.id, record.targetCareerId)).limit(1);
      targetCareer = career ?? null;
    }

    let roadmap = await getRoadmapForUser(userId);
    if (!roadmap && targetCareer) {
      await ensureRoadmapForUser(userId, targetCareer.id, {
        hoursPerWeek: record.weeklyHours,
      });
      // Fresh read: this request just created the roadmap.
      roadmap = await loadRoadmapForUser(userId);
    }

    // Planner, portfolio, gaps and job matches are independent — one wave,
    // not four sequential ones.
    const [planner, portfolio, gaps, jobMatches] = await Promise.all([
      getPlannerData(userId),
      getPortfolioForUser(userId),
      targetCareer ? getCareerGapForUser(targetCareer.id, userId) : Promise.resolve([]),
      listJobsWithMatch(userId).catch((): Awaited<ReturnType<typeof listJobsWithMatch>> => []),
    ]);

    const now = new Date();
    const todayEnd = endOfDay(now);
    const todayTasks = planner.tasks
      .filter(
        (task) =>
          task.status !== "done" &&
          task.scheduledFor &&
          new Date(task.scheduledFor) <= todayEnd,
      )
      .sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""));

    const openGaps = gaps.filter((gap) => gap.status !== "ready");
    const topGaps = [...openGaps].sort((a, b) => b.deficit - a.deficit).slice(0, 4);
    const topMatches = jobMatches
      .filter((job) => (job.match?.score ?? 0) >= 40)
      .slice(0, 2);

    const current = roadmap?.currentMilestone ?? null;
    const stage = current
      ? roadmap?.stages.find((item) => item.id === current.stageId)
      : roadmap?.stages[0];

    const week = Array.from({ length: 7 }, (_, index) => {
      const day = addDays(startOfDay(now), index - 6);
      const done = planner.tasks.filter(
        (task) =>
          task.status === "done" &&
          task.completedAt &&
          startOfDay(new Date(task.completedAt)).getTime() === day.getTime(),
      ).length;
      return { day, done };
    });
    const weekMax = Math.max(1, ...week.map((entry) => entry.done));

    const completedProjects = portfolio.projects.filter((project) => project.status === "completed");
    const activeProjects = portfolio.projects.filter((project) => project.status === "in_progress");
    const setupCareers = targetCareer ? [] : (await listCareerSummaries()).slice(0, 3);

  return {
    record,
    targetCareer,
    roadmap,
    planner,
    portfolio,
    todayTasks,
    topGaps,
    topMatches,
    current,
    stage,
    week,
    weekMax,
    completedProjects,
    activeProjects,
    setupCareers,
  };
}

export default async function DashboardPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login?next=/dashboard");
  if (sessionUser.role === "employer") redirect("/employers/dashboard");

  const db = await getDb();
  const [record] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
  if (!record) redirect("/login");
  if (!record.onboardingComplete) redirect("/onboarding");

  let data: Awaited<ReturnType<typeof loadDashboardData>> | null = null;
  try {
    data = await loadDashboardData(sessionUser.id, record);
  } catch (error) {
    console.error("[dashboard] failed to load", error);
  }

  if (!data) {
    return (
      <main id="main-content" className="app-page">
        <p className="eyebrow mb-3">Overview</p>
        <h1 className="font-display text-[clamp(2rem,4vw,2.9rem)] leading-tight">
          Your workspace could not be loaded.
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
          Your saved plan and evidence are unchanged. Please retry in a moment.
        </p>
        <div className="mt-6">
          <ErrorState message="The dashboard is temporarily unavailable." />
        </div>
      </main>
    );
  }

  const {
    targetCareer,
    roadmap,
    planner,
    portfolio,
    todayTasks,
    topGaps,
    topMatches,
    current,
    stage,
    week,
    weekMax,
    completedProjects,
    activeProjects,
    setupCareers,
  } = data;
  const now = new Date();

    return (
      <main id="main-content" className="app-page">
        {/* Identity header */}
        <header className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[8px] bg-ink font-display text-[22px] text-paper">
              {portfolio.profile.initials || sessionUser.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted">
                {greeting()} · {new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now)}
              </p>
              <h1 className="mt-1 font-display text-[clamp(2.1rem,4.6vw,3.1rem)] leading-[1.02] tracking-[-0.02em]">
                {sessionUser.name.split(" ")[0]}.
              </h1>
              {portfolio.profile.headline ? (
                <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-graphite">
                  {portfolio.profile.headline}
                </p>
              ) : (
                <Link
                  href="/profile"
                  className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-muted underline decoration-line underline-offset-4 hover:text-ink"
                >
                  Add a professional headline
                  <ArrowUpRight size={12} aria-hidden />
                </Link>
              )}
              {targetCareer ? (
                <p className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
                  <Badge variant="dark" size="sm">
                    <Target size={10} aria-hidden />
                    {targetCareer.name}
                  </Badge>
                  {roadmap && (
                    <span>
                      Stage {roadmap.stages.findIndex((item) => item.id === stage?.id) + 1} of {roadmap.stages.length} ·{" "}
                      {roadmap.progress}% of the roadmap
                    </span>
                  )}
                </p>
              ) : (
                <p className="mt-2 text-[11.5px] text-muted">No career goal selected yet.</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ButtonLink href="/planner" variant="secondary" size="md">
              <CalendarDays size={14} aria-hidden />
              Planner
            </ButtonLink>
            <ButtonLink href="/journey" size="md">
              <Map size={14} aria-hidden />
              View journey
            </ButtonLink>
          </div>
        </header>

        {!targetCareer ? (
          <section className="mt-8 rounded-lg border border-ink bg-ink p-6 text-paper sm:p-8">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              <Compass size={12} aria-hidden />
              Start here
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.8rem,3.2vw,2.5rem)] leading-tight">
              A command centre needs a direction.
            </h2>
            <p className="mt-3 max-w-xl text-[12.5px] leading-relaxed text-white/55">
              Choose one career path. Human Bridge will build the roadmap from its real skill
              requirements, and this page becomes your daily view of the work.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink href="/careers" variant="secondary" className="border-paper bg-paper text-ink hover:bg-paper-3">
                Explore careers
                <ArrowRight size={14} aria-hidden />
              </ButtonLink>
              <ButtonLink href="/profile" variant="ghost" className="text-white/65 hover:bg-white/10 hover:text-paper">
                Review your profile
              </ButtonLink>
            </div>
            {setupCareers.length > 0 && (
              <div className="mt-7 grid gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 sm:grid-cols-3">
                {setupCareers.map((career) => (
                  <Link
                    key={career.id}
                    href={`/careers/${career.slug}`}
                    className="bg-ink p-4 transition-colors hover:bg-graphite"
                  >
                    <p className="text-[9.5px] uppercase tracking-[0.12em] text-white/35">
                      {career.trackName ?? "Career"}
                    </p>
                    <p className="mt-1.5 font-display text-[20px] leading-tight">{career.name}</p>
                    <p className="mt-1 text-[10.5px] text-white/40">{career.essentialCount} essential skills</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Next action */}
            <section className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-[1.6fr_1fr]">
              <div className="bg-ink p-5 text-paper sm:p-7">
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  <Sparkles size={12} aria-hidden />
                  Next action
                </p>
                <h2 className="mt-3 max-w-xl font-display text-[clamp(1.6rem,2.9vw,2.2rem)] leading-tight">
                  {current ? current.title : "Your roadmap is complete at milestone level."}
                </h2>
                <p className="mt-2.5 max-w-lg text-[12.5px] leading-relaxed text-white/55">
                  {current
                    ? current.whyItMatters ?? current.objective
                    : "Review your portfolio, make sure each project is explained, and check opportunities against your recorded evidence."}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {current ? (
                    <>
                      <ButtonLink
                        href="/journey"
                        variant="secondary"
                        size="sm"
                        className="border-paper bg-paper text-ink hover:bg-paper-3"
                      >
                        Continue milestone
                        <ArrowRight size={13} aria-hidden />
                      </ButtonLink>
                      <span className="text-[10.5px] text-white/40">
                        ~{current.estimatedHours}h estimate · {current.openTaskCount} actions planned
                      </span>
                    </>
                  ) : (
                    <ButtonLink
                      href="/portfolio"
                      variant="secondary"
                      size="sm"
                      className="border-paper bg-paper text-ink hover:bg-paper-3"
                    >
                      Review portfolio
                      <ArrowRight size={13} aria-hidden />
                    </ButtonLink>
                  )}
                </div>
              </div>
              <div className="bg-paper p-5 sm:p-6">
                <SectionHeader
                  title="Today"
                  description={`${todayTasks.length} open action${todayTasks.length === 1 ? "" : "s"}${planner.stats.overdue > 0 ? ` · ${planner.stats.overdue} overdue` : ""}`}
                  action={
                    planner.stats.overdue > 0 ? (
                      <Link href="/planner" className="text-[11px] font-medium text-rust">
                        Reschedule
                      </Link>
                    ) : undefined
                  }
                />
                <div className="mt-4">
                  <DashboardTodayTasks tasks={todayTasks} />
                </div>
              </div>
            </section>

            {/* Progress */}
            <section className="mt-6">
              <SectionHeader
                title="Progress"
                description="Only what you have actually done counts."
                action={
                  <Link href="/journey" className="text-[11.5px] font-medium text-muted hover:text-ink">
                    Full roadmap
                  </Link>
                }
              />
              <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
                <Stat
                  label="Roadmap"
                  value={`${roadmap?.progress ?? 0}%`}
                  hint={`${roadmap?.completedMilestones ?? 0}/${roadmap?.totalMilestones ?? 0} milestones`}
                />
                <Stat
                  label="Verified skills"
                  value={portfolio.stats.verifiedSkills}
                  hint={`${portfolio.stats.selfReportedSkills} self-reported claims`}
                  accent="moss"
                />
                <Stat
                  label="Projects"
                  value={completedProjects.length}
                  hint={`${activeProjects.length} in progress`}
                />
                <Stat
                  label="Consistency"
                  value={`${planner.stats.streak}d`}
                  hint={`${planner.stats.weekDone} tasks completed this week`}
                />
              </div>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                {/* Current stage + gaps */}
                <Panel>
                  <SectionHeader
                    title="Current focus"
                    description={stage ? `${stage.title} · ${stage.completedCount}/${stage.milestones.length} milestones complete` : undefined}
                    action={
                      <Link href="/journey" className="text-[11.5px] font-medium text-muted hover:text-ink">
                        Open
                      </Link>
                    }
                  />
                  {stage ? (
                    <ul className="mt-4 space-y-2">
                      {stage.milestones.slice(0, 4).map((milestone) => {
                        const done = milestone.status === "completed";
                        return (
                          <li key={milestone.id} className="flex items-start gap-2.5">
                            <span
                              className={cn(
                                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                                done ? "bg-moss" : milestone.id === current?.id ? "bg-ink" : "bg-line-strong",
                              )}
                              aria-hidden
                            />
                            <span className={cn("text-[12.5px] leading-relaxed", done ? "text-muted line-through decoration-line" : "text-graphite")}>
                              {milestone.title}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[12px] text-muted">No roadmap yet.</p>
                  )}

                  {topGaps.length > 0 && (
                    <div className="mt-5 border-t border-line pt-4">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                        <TrendingUp size={11} aria-hidden />
                        Largest recorded gaps
                      </p>
                      <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
                        {topGaps.map((gap) => (
                          <li key={gap.slug} className="flex items-baseline justify-between gap-3 text-[11.5px]">
                            <span className="truncate text-graphite">{gap.name}</span>
                            <span className="shrink-0 tabular text-muted">
                              {gap.currentScore}/{gap.requiredScore}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Panel>

                {/* Portfolio preview */}
                <Panel>
                  <SectionHeader
                    title="Portfolio preview"
                    description="The work you can show, not just the list of things you studied."
                    action={
                      <Link href="/portfolio" className="text-[11.5px] font-medium text-muted hover:text-ink">
                        Open portfolio
                      </Link>
                    }
                  />
                  {portfolio.projects.length === 0 ? (
                    <div className="mt-4 rounded-md border border-dashed border-line-strong px-4 py-5">
                      <p className="text-[12px] leading-relaxed text-muted">
                        No projects yet. A finished project is the strongest evidence you can build
                        without an employer.
                      </p>
                      <Link href="/projects" className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-ink">
                        <FolderGit2 size={12} aria-hidden />
                        Choose a project
                      </Link>
                    </div>
                  ) : (
                    <ul className="mt-4 space-y-2.5">
                      {portfolio.projects.slice(0, 3).map((project) => (
                        <li key={project.id} className="flex items-start justify-between gap-4 border-b border-line pb-2.5 last:border-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-medium text-ink">{project.title}</p>
                            <p className="mt-0.5 truncate text-[10.5px] text-muted">
                              {project.status.replace(/_/g, " ")}
                              {project.skillSlugs.length > 0 ? ` · ${project.skillSlugs.slice(0, 2).join(", ")}` : ""}
                            </p>
                          </div>
                          {project.projectUrl || project.repositoryUrl ? (
                            <a
                              href={project.projectUrl ?? project.repositoryUrl ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-faint hover:bg-paper-3 hover:text-ink"
                              aria-label={`Open ${project.title}`}
                            >
                              <ExternalLink size={12} aria-hidden />
                            </a>
                          ) : (
                            <Badge size="sm" variant="outline">{project.status === "completed" ? "Completed" : "Draft"}</Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  {portfolio.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
                      {portfolio.skills.slice(0, 6).map((skill) => (
                        <span key={skill.slug} className="rounded-[3px] border border-line bg-paper-2 px-1.5 py-1 text-[10px] text-graphite">
                          {skill.name} · {skill.score}
                        </span>
                      ))}
                    </div>
                  )}
                </Panel>

                {/* Activity */}
                <Panel>
                  <SectionHeader title="Activity" description="What changed recently." />
                  {portfolio.activity.length === 0 ? (
                    <p className="mt-3 text-[12px] text-muted">
                      No activity recorded yet. Completing a task or adding a project starts the record.
                    </p>
                  ) : (
                    <ol className="mt-4 space-y-0">
                      {portfolio.activity.slice(0, 6).map((item, index) => (
                        <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
                          <div className="flex flex-col items-center">
                            <span className={cn("mt-1 h-1.5 w-1.5 rounded-full", item.type === "project" ? "bg-ochre" : item.type === "milestone" ? "bg-moss" : "bg-ink")} aria-hidden />
                            {index < Math.min(5, portfolio.activity.length - 1) && <span className="mt-1 w-px flex-1 bg-line" aria-hidden />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] leading-snug text-graphite">{item.label}</p>
                            <p className="mt-0.5 text-[10.5px] text-faint">
                              {item.detail} · {formatRelative(item.at, now)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </Panel>
              </div>

              {/* Right rail */}
              <aside className="space-y-4">
                <div className="rounded-lg border border-line bg-paper p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                    Role readiness
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <ReadinessRing value={portfolio.readiness} />
                    <div>
                      <p className="text-[12.5px] font-medium text-ink">
                        {portfolio.readiness >= 75
                          ? "Strong evidence base"
                          : portfolio.readiness >= 40
                            ? "Building evidence"
                            : "Early stage"}
                      </p>
                      <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
                        Based on verified evidence against {targetCareer.name} requirements.
                      </p>
                    </div>
                  </div>
                  <Link href="/skills" className="mt-4 inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                    <Layers size={12} aria-hidden />
                    Review skills
                  </Link>
                </div>

                <div className="rounded-lg border border-line bg-paper p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                      Last 7 days
                    </p>
                    <span className="text-[10.5px] text-muted">{planner.stats.weekDone} done</span>
                  </div>
                  <div className="mt-3 flex items-end gap-1.5" aria-label="Tasks completed in the last seven days">
                    {week.map((entry) => (
                      <div key={entry.day.toISOString()} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="flex h-12 w-full items-end rounded-sm bg-paper-2">
                          <div
                            className={cn("w-full rounded-sm", entry.done > 0 ? "bg-ink" : "bg-line")}
                            style={{ height: `${entry.done === 0 ? 4 : Math.max(14, (entry.done / weekMax) * 48)}px` }}
                          />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.08em] text-faint">
                          {new Intl.DateTimeFormat("en-GB", { weekday: "narrow" }).format(entry.day)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10.5px] leading-relaxed text-muted">
                    A streak is useful only if the work is real. Rest days are part of a plan.
                  </p>
                </div>

                <div className="rounded-lg border border-line bg-paper p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                    Opportunities
                  </p>
                  {topMatches.length === 0 ? (
                    <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                      No strong matches yet. Matching improves with verified evidence, not applications.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2.5">
                      {topMatches.map((job) => (
                        <li key={job.id}>
                          <Link href={`/jobs/${job.id}`} className="group flex items-start justify-between gap-3">
                            <span className="min-w-0">
                              <span className="block truncate text-[12px] font-medium text-ink">{job.title}</span>
                              <span className="block truncate text-[10.5px] text-muted">
                                {job.companyName} · {job.location}
                                {job.isDemo ? " · demo" : ""}
                              </span>
                            </span>
                            <span className="shrink-0 text-[11px] font-medium tabular text-moss">{job.match?.score ?? 0}%</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/jobs" className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                    <Briefcase size={12} aria-hidden />
                    All opportunities
                  </Link>
                </div>

                <div className="rounded-lg border border-line bg-paper-2 p-5">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                    <ShieldCheck size={11} aria-hidden />
                    Public portfolio
                  </p>
                  <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                    {portfolio.isPublic
                      ? "Your portfolio is publicly viewable. Only the sections you allow are shown."
                      : "Your portfolio is private. You decide what, if anything, is visible."}
                  </p>
                  <Link
                    href={portfolio.isPublic ? `/passport/${portfolio.publicId}` : "/portfolio#visibility"}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-ink"
                  >
                    {portfolio.isPublic ? "View public portfolio" : "Manage visibility"}
                    <ArrowRight size={11} aria-hidden />
                  </Link>
                </div>

                <div className="px-1">
                  <p className="flex items-start gap-2 text-[10.5px] leading-relaxed text-faint">
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0" aria-hidden />
                    Progress is calculated from your own record. Human Bridge does not estimate an
                    employment outcome.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatRelative(iso: string, now: Date): string {
  const date = new Date(iso);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}

function ReadinessRing({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90" role="img" aria-label={`${clamped}% role readiness`}>
        <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--color-paper-3)" strokeWidth="3" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[12px] font-medium tabular text-ink">
        {clamped}
      </span>
    </div>
  );
}
