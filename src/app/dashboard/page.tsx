import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
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
import { cn, formatSlug } from "@/lib/utils";

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
        <h1 className="display-md">Your workspace could not be loaded.</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
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

  const stageNumber = roadmap ? roadmap.stages.findIndex((item) => item.id === stage?.id) + 1 : 0;

  return (
    <main id="main-content" className="app-page">
      {/* Identity header */}
      <header className="animate-rise flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <span className="hb-avatar h-14 w-14 text-xl sm:h-16 sm:w-16">
            {portfolio.profile.initials || sessionUser.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">
              {greeting()} · {new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now)}
            </p>
            <h1 className="display-md mt-1 text-ink">{sessionUser.name.split(" ")[0]}.</h1>
            {portfolio.profile.headline ? (
              <p className="mt-1.5 max-w-xl text-md leading-relaxed text-graphite">{portfolio.profile.headline}</p>
            ) : (
              <Link href="/profile" className="hb-link mt-1.5 text-sm">
                Add a professional headline
                <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
              </Link>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <ButtonLink href="/planner" variant="secondary" size="md">
            <CalendarDays size={15} aria-hidden />
            Planner
          </ButtonLink>
          <ButtonLink href="/journey" size="md">
            <Map size={15} aria-hidden />
            View journey
          </ButtonLink>
        </div>
      </header>

      {targetCareer ? (
        <p className="animate-rise mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted [animation-delay:60ms]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 font-medium text-link">
            <Target size={13} aria-hidden />
            {targetCareer.name}
          </span>
          {roadmap && (
            <span>
              Stage {stageNumber} of {roadmap.stages.length} · {roadmap.progress}% of the roadmap
            </span>
          )}
        </p>
      ) : (
        <p className="mt-5 text-sm text-muted">No career goal selected yet.</p>
      )}

      {!targetCareer ? (
        <section className="hb-tile hb-tile-dark on-dark animate-rise-lg mt-8 p-7 sm:p-10 [animation-delay:120ms]">
          <div className="hb-aurora hb-aurora-dark opacity-80" aria-hidden />
          <p className="flex items-center gap-2 text-sm font-semibold text-[#a1a1a6]">
            <Compass size={15} aria-hidden />
            Start here
          </p>
          <h2 className="display-md mt-3 max-w-2xl">A command centre needs a direction.</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#a1a1a6]">
            Choose one career path. Human Bridge will build the roadmap from its real skill
            requirements, and this page becomes your daily view of the work.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4">
            <ButtonLink href="/careers" size="lg">
              Explore careers
            </ButtonLink>
            <Link href="/profile" className="hb-link text-base">
              Review your profile
              <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
          {setupCareers.length > 0 && (
            <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {setupCareers.map((career) => (
                <Link
                  key={career.id}
                  href={`/careers/${career.slug}`}
                  className="rounded-lg bg-white/[0.07] p-5 ring-1 ring-inset ring-white/[0.08] transition-colors duration-300 ease-apple hover:bg-white/[0.12]"
                >
                  <p className="text-xs text-[#a1a1a6]">{career.trackName ?? "Career"}</p>
                  <p className="mt-1.5 text-xl font-semibold leading-tight tracking-[-0.02em]">{career.name}</p>
                  <p className="mt-1.5 text-xs text-[#a1a1a6]">{career.essentialCount} essential skills</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Next action */}
          <section className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-5">
            <div className="hb-tile hb-tile-dark on-dark animate-rise-lg flex flex-col p-7 sm:p-9 [animation-delay:100ms]">
              <div className="hb-aurora hb-aurora-dark opacity-80" aria-hidden />
              <p className="flex items-center gap-2 text-sm font-semibold text-[#a1a1a6]">
                <Sparkles size={15} aria-hidden />
                Next action
              </p>
              <h2 className="display-md mt-4 max-w-xl">
                {current ? current.title : "Your roadmap is complete at milestone level."}
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-[#a1a1a6]">
                {current
                  ? current.whyItMatters ?? current.objective
                  : "Review your portfolio, make sure each project is explained, and check opportunities against your recorded evidence."}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-8">
                {current ? (
                  <>
                    <ButtonLink href="/journey" size="md">
                      Continue milestone
                      <ArrowRight size={15} aria-hidden />
                    </ButtonLink>
                    <span className="text-sm text-[#a1a1a6]">
                      ~{current.estimatedHours}h estimate · {current.openTaskCount} actions planned
                    </span>
                  </>
                ) : (
                  <ButtonLink href="/portfolio" size="md">
                    Review portfolio
                    <ArrowRight size={15} aria-hidden />
                  </ButtonLink>
                )}
              </div>
            </div>
            <div className="hb-card animate-rise-lg p-6 sm:p-7 [animation-delay:180ms]">
              <SectionHeader
                title="Today"
                description={`${todayTasks.length} open action${todayTasks.length === 1 ? "" : "s"}${planner.stats.overdue > 0 ? ` · ${planner.stats.overdue} overdue` : ""}`}
                action={
                  planner.stats.overdue > 0 ? (
                    <Link href="/planner" className="text-sm font-medium text-rust hover:underline">
                      Reschedule
                    </Link>
                  ) : undefined
                }
              />
              <div className="mt-5">
                <DashboardTodayTasks tasks={todayTasks} />
              </div>
            </div>
          </section>

          {/* Progress */}
          <section className="app-section">
            <SectionHeader
              title="Progress"
              description="Only what you have actually done counts."
              action={
                <Link href="/journey" className="hb-link text-sm">
                  Full roadmap
                  <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                </Link>
              }
            />
            <div className="stagger mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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

          <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
            <div className="min-w-0 space-y-4 lg:space-y-5">
              {/* Current stage + gaps */}
              <Panel>
                <SectionHeader
                  title="Current focus"
                  description={stage ? `${stage.title} · ${stage.completedCount}/${stage.milestones.length} milestones complete` : undefined}
                  action={
                    <Link href="/journey" className="hb-link text-sm">
                      Open
                      <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                    </Link>
                  }
                />
                {stage ? (
                  <ul className="mt-5 space-y-3">
                    {stage.milestones.slice(0, 4).map((milestone) => {
                      const done = milestone.status === "completed";
                      const active = milestone.id === current?.id;
                      return (
                        <li key={milestone.id} className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-[7px] h-2 w-2 shrink-0 rounded-full",
                              done ? "bg-moss" : active ? "bg-accent ring-4 ring-accent/15" : "bg-line-strong",
                            )}
                            aria-hidden
                          />
                          <span
                            className={cn(
                              "text-md leading-relaxed",
                              done
                                ? "text-muted line-through decoration-line-strong"
                                : active
                                  ? "font-medium text-ink"
                                  : "text-graphite",
                            )}
                          >
                            {milestone.title}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">No roadmap yet.</p>
                )}

                {topGaps.length > 0 && (
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-muted">
                      <TrendingUp size={14} aria-hidden />
                      Largest recorded gaps
                    </p>
                    <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
                      {topGaps.map((gap) => (
                        <li key={gap.slug} className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="truncate text-ink">{gap.name}</span>
                          <span className="tabular shrink-0 text-muted">
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
                    <Link href="/portfolio" className="hb-link text-sm">
                      Open portfolio
                      <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                    </Link>
                  }
                />
                {portfolio.projects.length === 0 ? (
                  <div className="mt-5 rounded-md bg-paper-2 px-5 py-5">
                    <p className="text-sm leading-relaxed text-muted">
                      No projects yet. A finished project is the strongest evidence you can build
                      without an employer.
                    </p>
                    <Link href="/projects" className="hb-link mt-2.5 text-sm">
                      <FolderGit2 size={14} aria-hidden />
                      Choose a project
                    </Link>
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-line">
                    {portfolio.projects.slice(0, 3).map((project) => (
                      <li key={project.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate text-md font-medium text-ink">{project.title}</p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {formatSlug(project.status)}
                            {project.skillSlugs.length > 0
                              ? ` · ${project.skillSlugs.slice(0, 2).map(formatSlug).join(", ")}`
                              : ""}
                          </p>
                        </div>
                        {project.projectUrl || project.repositoryUrl ? (
                          <a
                            href={project.projectUrl ?? project.repositoryUrl ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-paper-3 hover:text-ink"
                            aria-label={`Open ${project.title}`}
                          >
                            <ExternalLink size={15} aria-hidden />
                          </a>
                        ) : (
                          <Badge size="sm" variant="outline">{project.status === "completed" ? "Completed" : "Draft"}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {portfolio.skills.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
                    {portfolio.skills.slice(0, 6).map((skill) => (
                      <span key={skill.slug} className="rounded-full bg-paper-2 px-2.5 py-1 text-xs text-graphite">
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
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    No activity recorded yet. Completing a task or adding a project starts the record.
                  </p>
                ) : (
                  <ol className="mt-5">
                    {portfolio.activity.slice(0, 6).map((item, index) => {
                      const last = index >= Math.min(5, portfolio.activity.length - 1);
                      return (
                        <li key={item.id} className="flex gap-3.5">
                          <div className="flex flex-col items-center">
                            <span
                              className={cn(
                                "mt-[7px] h-2 w-2 shrink-0 rounded-full",
                                item.type === "project" ? "bg-ochre" : item.type === "milestone" ? "bg-moss" : "bg-accent",
                              )}
                              aria-hidden
                            />
                            {!last && <span className="my-1.5 w-px flex-1 bg-line-strong" aria-hidden />}
                          </div>
                          <div className={cn("min-w-0 flex-1", !last && "pb-4")}>
                            <p className="text-md leading-snug text-ink">{item.label}</p>
                            <p className="mt-0.5 text-xs text-muted">
                              {item.detail} · {formatRelative(item.at, now)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </Panel>
            </div>

            {/* Right rail */}
            <aside className="space-y-4 lg:space-y-5">
              <div className="hb-card p-6">
                <p className="text-sm font-semibold text-ink">Role readiness</p>
                <div className="mt-4 flex items-center gap-4">
                  <ReadinessRing value={portfolio.readiness} />
                  <div>
                    <p className="text-md font-medium text-ink">
                      {portfolio.readiness >= 75
                        ? "Strong evidence base"
                        : portfolio.readiness >= 40
                          ? "Building evidence"
                          : "Early stage"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      Based on verified evidence against {targetCareer.name} requirements.
                    </p>
                  </div>
                </div>
                <Link href="/skills" className="hb-link mt-5 text-sm">
                  <Layers size={14} aria-hidden />
                  Review skills
                </Link>
              </div>

              <div className="hb-card p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Last 7 days</p>
                  <span className="tabular text-xs text-muted">{planner.stats.weekDone} done</span>
                </div>
                <div className="mt-4 flex items-end gap-2" aria-label="Tasks completed in the last seven days">
                  {week.map((entry) => (
                    <div key={entry.day.toISOString()} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-14 w-full items-end">
                        <div
                          className={cn("w-full rounded-[5px]", entry.done > 0 ? "bg-accent" : "bg-paper-3")}
                          style={{ height: `${entry.done === 0 ? 5 : Math.max(14, (entry.done / weekMax) * 56)}px` }}
                        />
                      </div>
                      <span className="text-2xs text-muted">
                        {new Intl.DateTimeFormat("en-GB", { weekday: "narrow" }).format(entry.day)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  A streak is useful only if the work is real. Rest days are part of a plan.
                </p>
              </div>

              <div className="hb-card p-6">
                <p className="text-sm font-semibold text-ink">Opportunities</p>
                {topMatches.length === 0 ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    No strong matches yet. Matching improves with verified evidence, not applications.
                  </p>
                ) : (
                  <ul className="mt-3 divide-y divide-line">
                    {topMatches.map((job) => (
                      <li key={job.id}>
                        <Link href={`/jobs/${job.id}`} className="group flex items-center justify-between gap-3 py-2.5">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-ink transition-colors duration-200 group-hover:text-link">
                              {job.title}
                            </span>
                            <span className="block truncate text-xs text-muted">
                              {job.companyName} · {job.location}
                              {job.isDemo ? " · demo" : ""}
                            </span>
                          </span>
                          <span className="tabular shrink-0 text-sm font-semibold text-moss">{job.match?.score ?? 0}%</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href="/jobs" className="hb-link mt-4 text-sm">
                  <Briefcase size={14} aria-hidden />
                  All opportunities
                </Link>
              </div>

              <div className="hb-card p-6">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <ShieldCheck size={15} className="text-moss" aria-hidden />
                  Public portfolio
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {portfolio.isPublic
                    ? "Your portfolio is publicly viewable. Only the sections you allow are shown."
                    : "Your portfolio is private. You decide what, if anything, is visible."}
                </p>
                <Link
                  href={portfolio.isPublic ? `/passport/${portfolio.publicId}` : "/portfolio#visibility"}
                  className="hb-link mt-3 text-sm"
                >
                  {portfolio.isPublic ? "View public portfolio" : "Manage visibility"}
                  <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                </Link>
              </div>

              <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-muted">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" aria-hidden />
                Progress is calculated from your own record. Human Bridge does not estimate an
                employment outcome.
              </p>
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
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 56 56" className="h-16 w-16 -rotate-90" role="img" aria-label={`${clamped}% role readiness`}>
        <circle cx="28" cy="28" r={radius} fill="none" stroke="var(--color-paper-3)" strokeWidth="4.5" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <span className="tabular absolute inset-0 flex items-center justify-center text-base font-semibold text-ink">
        {clamped}
      </span>
    </div>
  );
}
