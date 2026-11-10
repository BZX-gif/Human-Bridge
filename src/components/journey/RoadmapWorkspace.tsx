"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  Check,
  ChevronDown,
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
import { cn } from "@/lib/utils";

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
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">My journey</p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3.1rem)] leading-[1.02] tracking-[-0.02em]">
            {roadmap.careerName}
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
            {roadmap.summary}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            "mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-4 py-3 text-[12.5px]",
            notice.tone === "error"
              ? "border-rust/20 bg-rust-soft text-rust"
              : notice.tone === "success"
                ? "border-moss/20 bg-moss-soft text-moss"
                : "border-line bg-paper-2 text-graphite",
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
            className="ml-auto text-[11px] opacity-60 hover:opacity-100"
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Progress strip */}
      <section className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-paper p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-faint">
            Roadmap progress
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="stat-value">{roadmap.progress}%</span>
            <span className="text-[11px] text-muted">weighted by effort</span>
          </div>
          <ProgressBar value={roadmap.progress} size="sm" className="mt-3" label="Roadmap progress" />
        </div>
        <div className="bg-paper p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-faint">
            Milestones
          </p>
          <p className="stat-value mt-2">
            {roadmap.completedMilestones}
            <span className="text-[20px] text-faint">/{roadmap.totalMilestones}</span>
          </p>
          <p className="mt-1.5 text-[11px] text-muted">Completed from your own record</p>
        </div>
        <div className="bg-paper p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-faint">
            Remaining effort
          </p>
          <p className="stat-value mt-2">
            ~{remainingHours}
            <span className="text-[16px] text-faint"> h</span>
          </p>
          <p className="mt-1.5 text-[11px] text-muted">Estimate, not a deadline</p>
        </div>
        <div className="bg-paper p-5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-faint">
            Your availability
          </p>
          <p className="stat-value mt-2">
            {weeklyHours}
            <span className="text-[16px] text-faint"> h/week</span>
          </p>
          <Link
            href="/profile"
            className="mt-1.5 inline-block text-[11px] font-medium text-ink underline decoration-line-strong underline-offset-4"
          >
            Adjust availability
          </Link>
        </div>
      </section>

      {/* Current focus */}
      {nextMilestone && (
        <section className="mt-6 rounded-lg border border-ink bg-ink p-5 text-paper sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 max-w-2xl">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                <Target size={12} aria-hidden />
                Current focus
              </p>
              <h2 className="mt-3 font-display text-[clamp(1.5rem,2.8vw,2.1rem)] leading-tight">
                {nextMilestone.title}
              </h2>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-white/60">
                {nextMilestone.whyItMatters ?? nextMilestone.objective}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/45">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} aria-hidden /> ~{nextMilestone.estimatedHours}h estimate
                </span>
                <span>{nextMilestone.openTaskCount} scheduled actions</span>
                {nextMilestone.skillSlugs.length > 0 && (
                  <span className="truncate">{nextMilestone.skillSlugs.slice(0, 3).join(" · ")}</span>
                )}
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
              <Button
                variant="secondary"
                size="md"
                className="border-paper bg-paper text-ink hover:bg-paper-3"
                onClick={() => void addToPlanner(nextMilestone)}
                disabled={generating !== null}
              >
                {generating === nextMilestone.id ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                ) : (
                  <CalendarPlus size={14} aria-hidden />
                )}
                Add to planner
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="text-white/70 hover:bg-white/10 hover:text-paper"
                onClick={() => setExpanded(nextMilestone.id)}
              >
                View details
                <ArrowRight size={14} aria-hidden />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Stages */}
      <div className="mt-9 space-y-10">
        {roadmap.stages.map((stage, stageIndex) => {
          const done = stage.milestones.filter((milestone) => milestone.status === "completed").length;
          return (
            <section key={stage.id} aria-labelledby={`stage-${stage.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-t border-line pt-5">
                <div className="flex min-w-0 gap-4">
                  <span className="font-display text-[22px] leading-none tabular text-faint">
                    {String(stageIndex + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 id={`stage-${stage.id}`} className="font-display text-[clamp(1.4rem,2.4vw,1.8rem)] leading-tight">
                      {stage.title}
                    </h2>
                    <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
                      {stage.description}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] tabular text-graphite">
                    {done}/{stage.milestones.length} complete
                  </p>
                  <p className="text-[10.5px] text-faint">~{stage.estimatedWeeks} weeks</p>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {stage.milestones.map((milestone) => {
                  const isOpen = expanded === milestone.id;
                  const complete = milestone.status === "completed";
                  const skipped = milestone.status === "skipped";
                  const busy = busyMilestone === milestone.id;
                  return (
                    <li
                      key={milestone.id}
                      className={cn(
                        "rounded-lg border bg-paper transition-colors",
                        complete ? "border-line bg-paper-2/60" : "border-line",
                        isOpen && "border-line-strong",
                      )}
                    >
                      <div className="flex items-start gap-3 p-4 sm:p-5">
                        <button
                          type="button"
                          onClick={() => void setStatus(milestone, complete ? "not_started" : "completed")}
                          disabled={busy}
                          aria-label={complete ? `Reopen ${milestone.title}` : `Mark ${milestone.title} complete`}
                          className={cn(
                            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                            complete
                              ? "border-ink bg-ink text-paper"
                              : "border-line-strong bg-paper text-transparent hover:border-ink",
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
                                "text-[13.5px] font-medium leading-snug",
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
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
                            <span className="flex items-center gap-1">
                              <Clock size={11} aria-hidden /> ~{milestone.estimatedHours}h
                            </span>
                            <span>
                              {milestone.openTaskCount} planned · {milestone.doneTaskCount} done
                            </span>
                            {milestone.skillSlugs.slice(0, 2).map((slug) => (
                              <span key={slug} className="rounded-[3px] bg-paper-3 px-1.5 py-0.5 text-[10px]">
                                {slug.replace(/-/g, " ")}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void addToPlanner(milestone)}
                            disabled={generating === milestone.id}
                            className="hidden h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-[11px] font-medium text-graphite transition-colors hover:border-line-strong hover:text-ink sm:flex"
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
                            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-paper-3 hover:text-ink"
                            aria-label={isOpen ? "Collapse milestone" : "Expand milestone"}
                          >
                            <ChevronDown
                              size={16}
                              className={cn("transition-transform duration-200", isOpen && "rotate-180")}
                              aria-hidden
                            />
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <div id={`milestone-${milestone.id}`} className="animate-fade border-t border-line px-4 pb-5 pt-4 sm:px-5">
                          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                                Objective
                              </p>
                              <p className="mt-1.5 text-[12.5px] leading-relaxed text-graphite">
                                {milestone.objective}
                              </p>

                              {milestone.whyItMatters && (
                                <>
                                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                                    Why it matters
                                  </p>
                                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-graphite">
                                    {milestone.whyItMatters}
                                  </p>
                                </>
                              )}

                              {milestone.exercises.length > 0 && (
                                <>
                                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                                    Practice work
                                  </p>
                                  <ul className="mt-2 space-y-2">
                                    {milestone.exercises.map((exercise) => (
                                      <li key={exercise} className="flex gap-2.5 text-[12px] leading-relaxed text-graphite">
                                        <Circle size={7} className="mt-1.5 shrink-0 fill-current text-line-strong" aria-hidden />
                                        {exercise}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}

                              {milestone.completionCriteria.length > 0 && (
                                <>
                                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                                    You are done when
                                  </p>
                                  <ul className="mt-2 space-y-1.5">
                                    {milestone.completionCriteria.map((criterion) => (
                                      <li key={criterion} className="flex gap-2 text-[12px] leading-relaxed text-graphite">
                                        <Check size={12} className="mt-0.5 shrink-0 text-moss" aria-hidden />
                                        {criterion}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              )}
                            </div>

                            <aside className="space-y-4">
                              <div className="rounded-md border border-line bg-paper-2 p-3.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                                  Resources
                                </p>
                                {milestone.resources.length > 0 ? (
                                  <ul className="mt-2 space-y-2">
                                    {milestone.resources.map((resource) => (
                                      <li key={resource.title} className="text-[11.5px] leading-relaxed text-graphite">
                                        {resource.url ? (
                                          <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-start gap-1 font-medium text-ink underline decoration-line-strong underline-offset-2"
                                          >
                                            {resource.title}
                                            <ExternalLink size={10} className="mt-0.5 shrink-0" aria-hidden />
                                          </a>
                                        ) : (
                                          <span className="font-medium text-ink">{resource.title}</span>
                                        )}
                                        {resource.provider && (
                                          <span className="block text-[10.5px] text-muted">{resource.provider}</span>
                                        )}
                                        {resource.note && (
                                          <span className="mt-0.5 block text-[10px] text-faint">{resource.note}</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                                    No curated resource recorded. Use the practice work, or ask the mentor
                                    to explain the concept. Human Bridge does not invent links.
                                  </p>
                                )}
                              </div>

                              {milestone.dependsOn.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                                    Comes after
                                  </p>
                                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                                    {milestone.dependsOn.join(", ")}
                                  </p>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
                                {milestone.skillSlugs.map((slug) => (
                                  <Link
                                    key={slug}
                                    href={`/skills/${slug}`}
                                    className="rounded-[3px] border border-line px-1.5 py-1 text-[10px] text-graphite transition-colors hover:border-line-strong"
                                  >
                                    {slug.replace(/-/g, " ")}
                                  </Link>
                                ))}
                              </div>

                              <div className="flex flex-col gap-1.5">
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

      <section className="mt-12 flex flex-col gap-5 rounded-lg border border-line bg-paper-2 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Info size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
          <div>
            <p className="text-[13px] font-medium text-ink">A plan is not a promise.</p>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
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
        <div className="space-y-3 text-[12.5px] leading-relaxed text-graphite">
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
