"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import type { RoadmapMilestoneView, RoadmapView } from "@/lib/services/roadmap-service";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { cn, formatSlug } from "@/lib/utils";

type Notice = { tone: "success" | "error" | "info"; message: string; href?: string } | null;

export function RoadmapWorkspace({
  initialRoadmap,
  weeklyHours,
}: {
  initialRoadmap: RoadmapView;
  weeklyHours: number;
}) {
  const [roadmap, setRoadmap] = useState(initialRoadmap);
  const [expanded, setExpanded] = useState<number | null>(
    initialRoadmap.currentMilestone?.id ?? null,
  );
  const [busyMilestone, setBusyMilestone] = useState<number | null>(null);
  const [generating, setGenerating] = useState<number | null>(null);
  const [rebuildOpen, setRebuildOpen] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const allMilestones = useMemo(
    () => roadmap.stages.flatMap((stage) => stage.milestones),
    [roadmap],
  );
  const remainingHours = roadmap.remainingEstimatedHours;
  const nextMilestone = allMilestones.find(
    (milestone) => milestone.status !== "completed" && milestone.status !== "skipped",
  );

  async function setStatus(
    milestone: RoadmapMilestoneView,
    status: "not_started" | "in_progress" | "completed",
  ) {
    if (busyMilestone !== null) return;
    setBusyMilestone(milestone.id);
    setNotice(null);
    try {
      const result = await apiFetch<{ roadmap: RoadmapView }>(
        `/api/roadmap/milestones/${milestone.id}`,
        { method: "PATCH", json: { status } },
      );
      if (result.roadmap) setRoadmap(result.roadmap);
      setNotice({
        tone: "success",
        message:
          status === "completed"
            ? "Milestone marked complete. Progress is based on your own record — keep the evidence."
            : status === "in_progress"
              ? "Milestone moved into focus."
              : "Milestone reopened.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof ApiClientError ? error.message : "Could not update the milestone.",
      });
    } finally {
      setBusyMilestone(null);
    }
  }

  async function addToPlanner(milestone: RoadmapMilestoneView) {
    if (generating !== null) return;
    setGenerating(milestone.id);
    setNotice(null);
    try {
      const result = await apiFetch<{ created: number; scheduled: number; existing: number }>(
        "/api/planner/generate",
        {
          method: "POST",
          json: { milestoneId: milestone.id, weeklyHours },
        },
      );
      setRoadmap((current) => ({
        ...current,
        stages: current.stages.map((stage) => ({
          ...stage,
          milestones: stage.milestones.map((item) =>
            item.id === milestone.id
              ? {
                  ...item,
                  status: item.status === "not_started" ? "in_progress" : item.status,
                  openTaskCount: item.openTaskCount + result.created,
                }
              : item,
          ),
        })),
      }));
      setNotice({
        tone: "success",
        message:
          result.created > 0
            ? `${result.created} action${result.created === 1 ? "" : "s"} scheduled across ${result.scheduled} day${result.scheduled === 1 ? "" : "s"}, within your ${weeklyHours}h/week.`
            : "This milestone already has scheduled actions in your planner.",
        href: "/planner",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof ApiClientError ? error.message : "Could not create planner tasks.",
      });
    } finally {
      setGenerating(null);
    }
  }

  async function rebuild() {
    setRebuilding(true);
    setNotice(null);
    try {
      const result = await apiFetch<{ roadmap: RoadmapView }>("/api/roadmap", {
        method: "POST",
        json: {
          careerId: roadmap.careerId,
          weeklyHours,
          regenerate: true,
        },
      });
      if (result.roadmap) setRoadmap(result.roadmap);
      setRebuildOpen(false);
      setNotice({
        tone: "info",
        message:
          "Roadmap rebuilt from your current verified evidence. Existing planner tasks were kept.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof ApiClientError ? error.message : "Could not rebuild the roadmap.",
      });
    } finally {
      setRebuilding(false);
    }
  }

  return (
    <div className="app-page">
      <header className="animate-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">My journey</p>
          <h1 className="display-md mt-2.5 text-ink">{roadmap.careerName}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{roadmap.summary}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <ButtonLink href="/planner" variant="primary" size="md">
            <CalendarPlus size={15} aria-hidden />
            Open planner
          </ButtonLink>
          <Button variant="secondary" size="md" onClick={() => setRebuildOpen(true)}>
            <RefreshCw size={14} aria-hidden />
            Rebuild
          </Button>
        </div>
      </header>

      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={cn(
            "animate-rise mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-4 py-3 text-sm",
            notice.tone === "error"
              ? "bg-rust-soft text-rust"
              : notice.tone === "success"
                ? "bg-moss-soft text-moss"
                : "bg-paper-3 text-graphite",
          )}
        >
          <span>{notice.message}</span>
          {notice.href && (
            <Link href={notice.href} className="font-medium underline underline-offset-4">
              Go to planner
            </Link>
          )}
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200 hover:bg-black/[0.07]"
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Progress strip */}
      <section className="stagger mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="hb-card p-5 sm:p-6">
          <p className="text-xs font-medium text-muted">Roadmap progress</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
            <span className="stat-value">{roadmap.progress}%</span>
            <span className="text-xs text-muted">weighted by effort</span>
          </div>
          <ProgressBar value={roadmap.progress} size="sm" className="mt-3" label="Roadmap progress" />
        </div>
        <div className="hb-card p-5 sm:p-6">
          <p className="text-xs font-medium text-muted">Milestones</p>
          <p className="stat-value mt-2">
            {roadmap.completedMilestones}
            <span className="text-xl text-muted">/{roadmap.totalMilestones}</span>
          </p>
          <p className="mt-1.5 text-xs text-muted">Completed from your own record</p>
        </div>
        <div className="hb-card p-5 sm:p-6">
          <p className="text-xs font-medium text-muted">Remaining effort</p>
          <p className="stat-value mt-2">
            ~{remainingHours}
            <span className="text-base text-muted"> h</span>
          </p>
          <p className="mt-1.5 text-xs text-muted">Estimate, not a deadline</p>
        </div>
        <div className="hb-card p-5 sm:p-6">
          <p className="text-xs font-medium text-muted">Your availability</p>
          <p className="stat-value mt-2">
            {weeklyHours}
            <span className="text-base text-muted"> h/week</span>
          </p>
          <Link href="/profile" className="hb-link mt-1.5 text-xs">
            Adjust availability
            <ChevronRight size={12} strokeWidth={2.4} aria-hidden />
          </Link>
        </div>
      </section>

      {/* Current focus */}
      {nextMilestone && (
        <section className="hb-tile hb-tile-dark on-dark animate-rise-lg mt-4 p-7 sm:mt-5 sm:p-9 [animation-delay:160ms]">
          <div className="hb-aurora hb-aurora-dark opacity-80" aria-hidden />
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
            <div className="min-w-0 max-w-2xl">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#a1a1a6]">
                <Target size={15} aria-hidden />
                Current focus
              </p>
              <h2 className="display-md mt-4">{nextMilestone.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-[#a1a1a6]">
                {nextMilestone.whyItMatters ?? nextMilestone.objective}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#a1a1a6]">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} aria-hidden /> ~{nextMilestone.estimatedHours}h estimate
                </span>
                <span>{nextMilestone.openTaskCount} scheduled actions</span>
                {nextMilestone.skillSlugs.length > 0 && (
                  <span className="truncate">{nextMilestone.skillSlugs.slice(0, 3).map(formatSlug).join(" · ")}</span>
                )}
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-wrap items-center gap-x-6 gap-y-3 sm:w-auto">
              <Button size="md" onClick={() => void addToPlanner(nextMilestone)} disabled={generating !== null}>
                {generating === nextMilestone.id ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden />
                ) : (
                  <CalendarPlus size={15} aria-hidden />
                )}
                Add to planner
              </Button>
              <button type="button" className="hb-link text-md" onClick={() => setExpanded(nextMilestone.id)}>
                View details
                <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Stages */}
      <div className="mt-12 space-y-12 sm:mt-14 sm:space-y-14">
        {roadmap.stages.map((stage, stageIndex) => {
          const done = stage.milestones.filter((milestone) => milestone.status === "completed").length;
          return (
            <section key={stage.id} aria-labelledby={`stage-${stage.id}`}>
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div className="min-w-0">
                  <p className="tabular text-sm font-semibold text-link">
                    Stage {String(stageIndex + 1).padStart(2, "0")}
                  </p>
                  <h2 id={`stage-${stage.id}`} className="display-sm mt-1.5 text-ink">
                    {stage.title}
                  </h2>
                  <p className="mt-2 max-w-2xl text-md leading-relaxed text-muted">{stage.description}</p>
                </div>
                <p className="tabular shrink-0 pb-0.5 text-sm text-muted">
                  <span className="font-medium text-ink">
                    {done}/{stage.milestones.length}
                  </span>{" "}
                  complete · ~{stage.estimatedWeeks} weeks
                </p>
              </div>

              <ul className="mt-5 space-y-2.5">
                {stage.milestones.map((milestone) => {
                  const isOpen = expanded === milestone.id;
                  const complete = milestone.status === "completed";
                  const skipped = milestone.status === "skipped";
                  const busy = busyMilestone === milestone.id;
                  return (
                    <li
                      key={milestone.id}
                      className={cn(
                        "hb-card",
                        complete && "bg-paper/60 shadow-none",
                        isOpen && "shadow-md",
                      )}
                    >
                      <div className="flex items-start gap-3 p-4 sm:p-5">
                        <button
                          type="button"
                          onClick={() => void setStatus(milestone, complete ? "not_started" : "completed")}
                          disabled={busy}
                          aria-label={complete ? `Reopen ${milestone.title}` : `Mark ${milestone.title} complete`}
                          className={cn(
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-[background-color,border-color,transform] duration-200 ease-apple active:scale-90",
                            complete
                              ? "border-accent bg-accent text-white"
                              : "border-field bg-paper text-transparent hover:border-accent hover:bg-accent-soft",
                          )}
                        >
                          {busy ? (
                            <Loader2 size={12} className="animate-spin text-muted" aria-hidden />
                          ) : (
                            <Check size={13} strokeWidth={2.5} aria-hidden />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={cn(
                                "text-md font-medium leading-snug",
                                complete ? "text-muted line-through decoration-line-strong" : "text-ink",
                              )}
                            >
                              {milestone.title}
                            </p>
                            {milestone.status === "in_progress" && (
                              <Badge size="sm" variant="yellow">In focus</Badge>
                            )}
                            {skipped && <Badge size="sm" variant="ghost">Skipped</Badge>}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <Clock size={11} aria-hidden /> ~{milestone.estimatedHours}h
                            </span>
                            <span>
                              {milestone.openTaskCount} planned · {milestone.doneTaskCount} done
                            </span>
                            {milestone.skillSlugs.slice(0, 2).map((slug) => (
                              <span key={slug} className="rounded-full bg-paper-2 px-2 py-0.5 text-2xs text-graphite">
                                {formatSlug(slug)}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void addToPlanner(milestone)}
                            disabled={generating === milestone.id}
                            className="hidden h-8 items-center gap-1.5 rounded-full bg-paper-2 px-3.5 text-xs font-medium text-ink transition-[background-color,transform] duration-200 ease-apple hover:bg-paper-3 active:scale-[0.97] disabled:opacity-50 sm:flex"
                          >
                            {generating === milestone.id ? (
                              <Loader2 size={12} className="animate-spin" aria-hidden />
                            ) : (
                              <CalendarPlus size={12} aria-hidden />
                            )}
                            Plan
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : milestone.id)}
                            aria-expanded={isOpen}
                            aria-controls={`milestone-${milestone.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper-3 hover:text-ink"
                            aria-label={isOpen ? "Collapse milestone" : "Expand milestone"}
                          >
                            <ChevronDown
                              size={16}
                              className={cn("transition-transform duration-500 ease-out-expo", isOpen && "rotate-180")}
                              aria-hidden
                            />
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div id={`milestone-${milestone.id}`} className="hb-swap-in border-t border-line px-4 pb-6 pt-5 sm:px-5">
                          <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <div>
                              <p className="text-xs font-medium text-muted">
                                Objective
                              </p>
                              <p className="mt-1.5 text-sm leading-relaxed text-graphite">
                                {milestone.objective}
                              </p>

                              {milestone.whyItMatters && (
                                <>
                                  <p className="mt-4 text-xs font-medium text-muted">
                                    Why it matters
                                  </p>
                                  <p className="mt-1.5 text-sm leading-relaxed text-graphite">
                                    {milestone.whyItMatters}
                                  </p>
                                </>
                              )}

                              {milestone.exercises.length > 0 && (
                                <>
                                  <p className="mt-4 text-xs font-medium text-muted">
                                    Practice work
                                  </p>
                                  <ul className="mt-2 space-y-2">
                                    {milestone.exercises.map((exercise) => (
                                      <li key={exercise} className="flex gap-2.5 text-sm leading-relaxed text-graphite">
                                        <Circle size={7} className="mt-1.5 shrink-0 fill-current text-line-strong" aria-hidden />
                                        {exercise}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}

                              {milestone.completionCriteria.length > 0 && (
                                <>
                                  <p className="mt-4 text-xs font-medium text-muted">
                                    You are done when
                                  </p>
                                  <ul className="mt-2 space-y-1.5">
                                    {milestone.completionCriteria.map((criterion) => (
                                      <li key={criterion} className="flex gap-2 text-sm leading-relaxed text-graphite">
                                        <Check size={12} className="mt-0.5 shrink-0 text-moss" aria-hidden />
                                        {criterion}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                            </div>

                            <aside className="space-y-4">
                              <div className="rounded-md bg-paper-2 p-4">
                                <p className="text-xs font-medium text-muted">
                                  Resources
                                </p>
                                {milestone.resources.length > 0 ? (
                                  <ul className="mt-2 space-y-2">
                                    {milestone.resources.map((resource) => (
                                      <li key={resource.title} className="text-xs leading-relaxed text-graphite">
                                        {resource.url ? (
                                          <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-start gap-1 font-medium text-link hover:underline hover:underline-offset-2"
                                          >
                                            {resource.title}
                                            <ExternalLink size={10} className="mt-0.5 shrink-0" aria-hidden />
                                          </a>
                                        ) : (
                                          <span className="font-medium text-ink">{resource.title}</span>
                                        )}
                                        {resource.provider && (
                                          <span className="block text-2xs text-muted">{resource.provider}</span>
                                        )}
                                        {resource.note && (
                                          <span className="mt-0.5 block text-2xs text-faint">{resource.note}</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                                    No curated resource recorded. Use the practice work, or ask Paper
                                    to explain the concept. Human Bridge does not invent links.
                                  </p>
                                )}
                              </div>

                              {milestone.dependsOn.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-muted">
                                    Comes after
                                  </p>
                                  <p className="mt-1 text-xs leading-relaxed text-muted">
                                    {milestone.dependsOn.join(", ")}
                                  </p>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
                                {milestone.skillSlugs.map((slug) => (
                                  <Link
                                    key={slug}
                                    href={`/skills/${slug}`}
                                    className="rounded-full bg-paper-2 px-2.5 py-1 text-2xs text-graphite transition-colors duration-200 hover:bg-accent-soft hover:text-link"
                                  >
                                    {formatSlug(slug)}
                                  </Link>
                                ))}
                              </div>

                              <div className="flex flex-col gap-2">
                                {!complete && milestone.status !== "in_progress" && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => void setStatus(milestone, "in_progress")}
                                    disabled={busy}
                                  >
                                    <Target size={12} aria-hidden />
                                    Move into focus
                                  </Button>
                                )}
                                {!complete && (
                                  <Button
                                    size="sm"
                                    onClick={() => void setStatus(milestone, "completed")}
                                    disabled={busy}
                                  >
                                    <Check size={12} aria-hidden />
                                    Mark complete
                                  </Button>
                                )}
                                {complete && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => void setStatus(milestone, "not_started")}
                                    disabled={busy}
                                  >
                                    <RotateCcw size={12} aria-hidden />
                                    Reopen milestone
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void addToPlanner(milestone)}
                                  disabled={generating !== null}
                                >
                                  <CalendarPlus size={12} aria-hidden />
                                  Add actions to planner
                                </Button>
                              </div>
                            </aside>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="hb-card mt-12 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-3.5">
          <Info size={18} className="mt-0.5 shrink-0 text-link" aria-hidden />
          <div>
            <p className="text-md font-medium text-ink">A plan is not a promise.</p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              Progress here reflects what you record. Completions you mark yourself remain
              self-attested. Only assessments and employer review create verified evidence.
            </p>
          </div>
        </div>
        <ButtonLink href="/portfolio" variant="secondary" size="md" className="shrink-0">
          Open portfolio
          <ArrowRight size={14} aria-hidden />
        </ButtonLink>
      </section>

      <Modal
        open={rebuildOpen}
        onOpenChange={setRebuildOpen}
        title="Rebuild this roadmap?"
        description="The plan is regenerated from your current verified evidence. Completed milestones backed by verification are recognised automatically. Planner tasks are preserved."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRebuildOpen(false)} disabled={rebuilding}>
              Cancel
            </Button>
            <Button onClick={() => void rebuild()} disabled={rebuilding}>
              {rebuilding ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Sparkles size={14} aria-hidden />}
              Rebuild roadmap
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm leading-relaxed text-graphite">
          <p>
            Milestone statuses you set manually will reset unless the skill already has verified
            evidence at or above the required score.
          </p>
          <p className="text-muted">You can rebuild again at any time. Nothing is deleted from your portfolio.</p>
        </div>
      </Modal>
    </div>
  );
}
