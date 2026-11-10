"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  FolderGit2,
  Map,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "roadmap" | "planner" | "portfolio" | "mentor";

const TABS: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "planner", label: "Planner", icon: CalendarDays },
  { id: "portfolio", label: "Portfolio", icon: FolderGit2 },
  { id: "mentor", label: "Paper", icon: MessageSquare },
];

const STAGES = [
  { name: "Foundations", state: "done" },
  { name: "Spreadsheets & SQL", state: "current" },
  { name: "Analysis & visualisation", state: "next" },
  { name: "Real projects", state: "next" },
  { name: "Professional readiness", state: "next" },
] as const;

const MILESTONES = [
  { title: "Query a database with confidence", status: "current", hours: 6 },
  { title: "Clean a messy dataset end to end", status: "next", hours: 5 },
  { title: "Write your first analysis narrative", status: "next", hours: 4 },
];

const WEEK = [
  { day: "Mon", tasks: ["SQL: filtering & joins", "30 min practice set"] },
  { day: "Tue", tasks: ["SQL: aggregation"] },
  { day: "Wed", tasks: ["Dataset cleaning", "Reflect in notes"] },
  { day: "Thu", tasks: [] },
  { day: "Fri", tasks: ["Weekly review"] },
  { day: "Sat", tasks: ["Project: sales dashboard"] },
  { day: "Sun", tasks: [] },
];

const INITIAL_PLANNER_DONE = new Set(["Mon-0", "Tue-0"]);

export function ProductPreview() {
  const [tab, setTab] = useState<Tab>("roadmap");
  const [openMilestone, setOpenMilestone] = useState(0);
  const [plannerDone, setPlannerDone] = useState<Set<string>>(INITIAL_PLANNER_DONE);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper shadow-[0_24px_60px_-30px_rgba(11,11,12,0.28)]">
      {/* Window chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-paper-2 px-3 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
          <span className="h-2 w-2 rounded-full bg-line-strong" />
        </div>
        <p className="truncate text-[10px] text-faint">humanbridge.app · illustrative preview</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line px-2 pt-2" role="tablist" aria-label="Product preview">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-t-md border-b-2 px-3 py-2 text-[11px] font-medium transition-colors",
                tab === item.id
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-graphite",
              )}
            >
              <Icon size={12} aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[368px] bg-paper p-3.5 sm:p-4">
        {tab === "roadmap" && (
          <div key="roadmap" className="animate-fade">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-faint">Target career</p>
                <p className="mt-0.5 font-display text-[22px] leading-tight">Data Analyst</p>
              </div>
              <div className="text-right">
                <p className="text-[9.5px] uppercase tracking-[0.12em] text-faint">Roadmap</p>
                <p className="font-display text-[22px] leading-tight tabular">38%</p>
              </div>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-paper-3">
              <div className="h-full w-[38%] rounded-full bg-ink" />
            </div>

            <div className="mt-3.5 grid gap-3 sm:grid-cols-[1fr_150px]">
              <div>
                <div className="flex items-center gap-1 overflow-hidden">
                  {STAGES.map((stage, index) => (
                    <div key={stage.name} className="flex min-w-0 flex-1 items-center gap-1">
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px]",
                          stage.state === "done"
                            ? "bg-moss text-paper"
                            : stage.state === "current"
                              ? "border border-ink bg-ink text-paper"
                              : "border border-line-strong text-faint",
                        )}
                        title={stage.name}
                      >
                        {stage.state === "done" ? <Check size={8} aria-hidden /> : index + 1}
                      </span>
                      {index < STAGES.length - 1 && (
                        <span className={cn("h-px flex-1", stage.state === "done" ? "bg-moss/40" : "bg-line")} />
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-muted">
                  Stage 2 of 5 · <span className="text-graphite">Spreadsheets &amp; SQL</span>
                </p>

                <ul className="mt-2.5 space-y-1.5">
                  {MILESTONES.map((milestone, index) => {
                    const open = openMilestone === index;
                    return (
                      <li key={milestone.title} className={cn("rounded-md border", open ? "border-ink/20 bg-paper-2" : "border-line")}>
                        <button
                          type="button"
                          onClick={() => setOpenMilestone(open ? -1 : index)}
                          className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
                          aria-expanded={open}
                        >
                          {milestone.status === "current" ? (
                            <Circle size={10} className="shrink-0 fill-ink text-ink" aria-hidden />
                          ) : (
                            <Circle size={10} className="shrink-0 text-line-strong" aria-hidden />
                          )}
                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-graphite">
                            {milestone.title}
                          </span>
                          <span className="shrink-0 text-[9.5px] text-faint">~{milestone.hours}h</span>
                          <ChevronDown
                            size={10}
                            className={cn("shrink-0 text-faint transition-transform", open && "rotate-180")}
                            aria-hidden
                          />
                        </button>
                        {open && (
                          <div className="animate-fade border-t border-line px-2.5 py-2">
                            <p className="text-[10px] leading-relaxed text-muted">
                              Write three queries against a sample sales database: filter by region,
                              aggregate monthly revenue, and join two tables. Done when the output
                              matches the expected result set.
                            </p>
                            <p className="mt-1.5 flex items-center gap-1 text-[9.5px] text-faint">
                              <Clock size={9} aria-hidden />
                              Effort estimate, not a deadline
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-md border border-line bg-paper-2 p-2.5">
                <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-faint">
                  <Sparkles size={9} aria-hidden />
                  Current focus
                </p>
                <p className="mt-1.5 text-[11px] font-medium leading-snug text-ink">
                  Query a database with confidence
                </p>
                <p className="mt-1 text-[9.5px] leading-relaxed text-muted">
                  This unlocks every analysis milestone after it.
                </p>
                <div className="mt-2 rounded border border-line bg-paper px-2 py-1.5">
                  <p className="text-[9px] text-faint">This week</p>
                  <p className="mt-0.5 text-[10px] font-medium text-graphite">2 sessions · 90 min</p>
                </div>
                <span className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded bg-ink px-2 py-1.5 text-[9.5px] font-medium text-paper">
                  Add to planner
                  <ArrowRight size={9} aria-hidden />
                </span>
              </div>
            </div>
          </div>
        )}

        {tab === "planner" && (
          <div key="planner" className="animate-fade">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-faint">This week</p>
                <p className="mt-0.5 font-display text-[20px] leading-tight">4 of 7 sessions planned</p>
              </div>
              <span className="rounded-[3px] border border-line px-1.5 py-0.5 text-[9px] text-muted">5h available</span>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1">
              {WEEK.map((day) => (
                <div key={day.day} className="min-w-0">
                  <p className="mb-1 text-center text-[9px] font-medium text-faint">{day.day}</p>
                  <div className="min-h-[150px] space-y-1 rounded border border-line bg-paper-2 p-1">
                    {day.tasks.map((task, index) => {
                      const key = `${day.day}-${index}`;
                      const done = plannerDone.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setPlannerDone((current) => {
                              const next = new Set(current);
                              if (next.has(key)) next.delete(key);
                              else next.add(key);
                              return next;
                            })
                          }
                          className={cn(
                            "w-full rounded border px-1 py-1 text-left text-[8.5px] leading-tight transition-colors",
                            done
                              ? "border-line bg-paper text-faint line-through"
                              : "border-line-strong/60 bg-paper text-graphite hover:border-ink",
                          )}
                          aria-pressed={done}
                        >
                          {task}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 rounded-md border border-line bg-paper-2 p-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-medium text-ink">Today · 45 minute session</p>
                <p className="text-[9.5px] text-muted">SQL filtering and joins — from your current milestone.</p>
              </div>
              <span className="shrink-0 rounded bg-ink px-2 py-1 text-[9px] font-medium text-paper">Start focus</span>
            </div>
            <p className="mt-2 text-[9px] leading-relaxed text-faint">
              Preview only. In the product, tasks come from your milestones and are sized to the hours you say you have.
            </p>
          </div>
        )}

        {tab === "portfolio" && (
          <div key="portfolio" className="animate-fade">
            <div className="flex items-start gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-ink font-display text-[15px] text-paper">
                AR
              </span>
              <div className="min-w-0">
                <p className="font-display text-[20px] leading-tight">Aarav Rathore</p>
                <p className="text-[10px] text-muted">Aspiring data analyst · SQL, spreadsheets, clear reporting</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[9px] text-faint">
                  <span className="flex items-center gap-0.5"><Target size={8} aria-hidden /> Data Analyst</span>
                  <span className="flex items-center gap-0.5"><ShieldCheck size={8} aria-hidden /> 2 verified skills</span>
                  <span className="flex items-center gap-0.5"><FolderGit2 size={8} aria-hidden /> 1 project</span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-line p-2.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-faint">Verified skills</p>
                {[
                  ["Spreadsheets", 72],
                  ["SQL", 58],
                ].map(([name, score]) => (
                  <div key={name as string} className="mt-2">
                    <div className="flex items-baseline justify-between text-[9.5px]">
                      <span className="text-graphite">{name}</span>
                      <span className="tabular text-moss">{score}</span>
                    </div>
                    <div className="mt-0.5 h-0.5 overflow-hidden rounded-full bg-paper-3">
                      <div className="h-full rounded-full bg-moss" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
                <p className="mt-2 text-[8.5px] leading-relaxed text-faint">
                  Verified means an assessment scored it, not that you ticked a box.
                </p>
              </div>

              <div className="rounded-md border border-line p-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-faint">Project</p>
                  <span className="rounded-[2px] bg-moss-soft px-1 py-0.5 text-[8px] text-moss">Completed</span>
                </div>
                <p className="mt-1.5 text-[11.5px] font-medium leading-snug text-ink">Sales performance dashboard</p>
                <p className="mt-1 text-[9px] leading-relaxed text-muted">
                  Cleaned 12 months of sales data, built a regional view and wrote a two-page summary
                  of what leadership should do next.
                </p>
                <p className="mt-1.5 border-l border-line-strong pl-1.5 text-[8.5px] italic leading-relaxed text-faint">
                  “The first chart was unreadable. I rebuilt it around one question.”
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between rounded-md border border-line bg-paper-2 px-2.5 py-2">
              <p className="flex items-center gap-1 text-[9.5px] text-graphite">
                <CheckCircle2 size={10} className="text-moss" aria-hidden />
                Shareable with a private link you control
              </p>
              <span className="text-[9px] font-medium text-ink">Portfolio →</span>
            </div>
          </div>
        )}

        {tab === "mentor" && (
          <div key="mentor" className="animate-fade">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-faint">Paper</p>
                <p className="mt-0.5 font-display text-[20px] leading-tight">Grounded in your plan</p>
              </div>
              <span className="rounded-[3px] border border-line bg-paper-2 px-1.5 py-0.5 text-[9px] text-muted">
                Guided mode
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex justify-end">
                <p className="max-w-[80%] rounded-lg rounded-br-[2px] bg-ink px-2.5 py-2 text-[10.5px] leading-relaxed text-paper">
                  I only have four hours this week. What should I drop?
                </p>
              </div>
              <div className="flex gap-1.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line bg-paper-2 text-graphite">
                  <Sparkles size={9} aria-hidden />
                </span>
                <div className="max-w-[86%] rounded-lg rounded-bl-[2px] border border-line px-2.5 py-2">
                  <p className="text-[10.5px] leading-relaxed text-graphite">
                    Keep the SQL session and the dataset cleaning. Move the dashboard project to next
                    week. Four hours is enough to finish one milestone properly — not three badly.
                  </p>
                  <p className="mt-1.5 border-t border-line pt-1.5 text-[8.5px] uppercase tracking-[0.1em] text-faint">
                    Guided response · built from your roadmap
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Where are my biggest gaps?", "Which project next?", "Plan my week"].map((prompt) => (
                <span key={prompt} className="rounded-full border border-line px-2 py-1 text-[9px] text-muted">
                  {prompt}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[8.5px] leading-relaxed text-faint">
              Illustrative conversation. Paper never invents scores, resources or job offers, and
              works without AI using your recorded plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
