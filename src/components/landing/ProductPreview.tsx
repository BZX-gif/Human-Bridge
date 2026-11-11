"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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

const TOTAL_SESSIONS = WEEK.reduce((sum, day) => sum + day.tasks.length, 0);
const INITIAL_PLANNER_DONE = new Set(["Mon-0", "Tue-0"]);

const label = "text-2xs font-medium text-muted";

export function ProductPreview() {
  const [tab, setTab] = useState<Tab>("roadmap");
  const [openMilestone, setOpenMilestone] = useState(0);
  const [plannerDone, setPlannerDone] = useState<Set<string>>(INITIAL_PLANNER_DONE);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeIndex = TABS.findIndex((item) => item.id === tab);

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    let next = activeIndex;
    if (event.key === "ArrowRight") next = (activeIndex + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (activeIndex - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="overflow-hidden rounded-[22px] bg-paper text-left shadow-2xl ring-1 ring-black/[0.07] sm:rounded-[28px]">
      {/* Window chrome */}
      <div className="flex h-11 items-center gap-3 border-b border-line bg-paper-2 px-4">
        <div className="flex w-12 items-center gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </div>
        <p className="mx-auto min-w-0 truncate rounded-[7px] bg-paper px-3 py-1 text-3xs text-muted ring-1 ring-line">
          humanbridge.app · illustrative preview
        </p>
        <div className="w-12" aria-hidden />
      </div>

      {/* Segmented tabs with a sliding thumb */}
      <div className="flex justify-center px-3 pt-4 sm:pt-5">
        <div
          role="tablist"
          aria-label="Product preview"
          onKeyDown={onTabKeyDown}
          className="relative grid w-full max-w-[440px] grid-cols-4 rounded-full bg-paper-3 p-1"
        >
          <span
            aria-hidden
            className="absolute bottom-1 left-1 top-1 w-[calc((100%-8px)/4)] rounded-full bg-paper shadow-sm transition-transform duration-500 ease-out-expo"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          {TABS.map((item, index) => {
            const Icon = item.icon;
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`preview-tab-${item.id}`}
                aria-selected={selected}
                aria-controls="preview-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(item.id)}
                className={cn(
                  "relative z-10 flex h-8 items-center justify-center gap-1.5 rounded-full text-xs font-medium transition-colors duration-300 ease-apple",
                  selected ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                <Icon size={14} strokeWidth={1.8} className="hidden min-[400px]:block" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id="preview-panel"
        aria-labelledby={`preview-tab-${tab}`}
        className="min-h-[428px] p-5 sm:p-8 lg:min-h-[420px]"
      >
        {tab === "roadmap" && (
          <div key="roadmap" className="hb-swap-in grid gap-6 lg:grid-cols-[minmax(0,1fr)_272px] lg:gap-8">
            <div className="min-w-0">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className={label}>Target career</p>
                  <p className="mt-1 font-display text-2xl text-ink sm:text-3xl">Data Analyst</p>
                </div>
                <div className="text-right">
                  <p className={label}>Roadmap</p>
                  <p className="tabular mt-1 font-display text-2xl text-ink sm:text-3xl">38%</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-3">
                <div className="animate-draw h-full w-[38%] rounded-full bg-accent [animation-delay:200ms]" />
              </div>

              <div className="mt-6 flex items-center" aria-hidden>
                {STAGES.map((stage, index) => (
                  <div key={stage.name} className="flex min-w-0 flex-1 items-center last:flex-none">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-3xs font-semibold",
                        stage.state === "done"
                          ? "bg-moss text-white"
                          : stage.state === "current"
                            ? "bg-accent text-white ring-4 ring-accent/15"
                            : "bg-paper-3 text-muted",
                      )}
                      title={stage.name}
                    >
                      {stage.state === "done" ? <Check size={12} strokeWidth={3} /> : index + 1}
                    </span>
                    {index < STAGES.length - 1 && (
                      <span
                        className={cn(
                          "mx-1.5 h-0.5 flex-1 rounded-full",
                          stage.state === "done" ? "bg-moss/45" : "bg-paper-3",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                Stage 2 of 5 · <span className="font-medium text-ink">Spreadsheets &amp; SQL</span>
              </p>

              <ul className="mt-4 space-y-2">
                {MILESTONES.map((milestone, index) => {
                  const open = openMilestone === index;
                  return (
                    <li
                      key={milestone.title}
                      className={cn(
                        "rounded-[14px] transition-[background-color,box-shadow] duration-300 ease-apple",
                        open ? "bg-paper-2" : "bg-paper ring-1 ring-inset ring-line hover:ring-line-strong",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenMilestone(open ? -1 : index)}
                        className="flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left"
                        aria-expanded={open}
                      >
                        <span
                          className={cn(
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            milestone.status === "current" ? "bg-accent" : "ring-[1.5px] ring-inset ring-line-strong",
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-ink">
                          {milestone.title}
                        </span>
                        <span className="shrink-0 text-2xs text-muted">~{milestone.hours}h</span>
                        <ChevronDown
                          size={15}
                          className={cn(
                            "shrink-0 text-faint transition-transform duration-500 ease-out-expo",
                            open && "rotate-180",
                          )}
                          aria-hidden
                        />
                      </button>
                      <div className="hb-collapse" data-open={open}>
                        <div>
                          <div className="px-4 pb-4 pl-[38px]">
                            <p className="text-xs leading-relaxed text-muted">
                              Write three queries against a sample sales database: filter by region,
                              aggregate monthly revenue, and join two tables. Done when the output
                              matches the expected result set.
                            </p>
                            <p className="mt-2 flex items-center gap-1.5 text-2xs text-faint">
                              <Clock size={12} aria-hidden />
                              Effort estimate, not a deadline
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-col rounded-[18px] bg-paper-2 p-5 lg:self-start">
              <p className="flex items-center gap-1.5 text-2xs font-semibold text-link">
                <Sparkles size={13} aria-hidden />
                Current focus
              </p>
              <p className="mt-2.5 text-md font-semibold leading-snug text-ink">
                Query a database with confidence
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                This unlocks every analysis milestone after it.
              </p>
              <div className="mt-4 rounded-[12px] bg-paper px-3.5 py-3 shadow-xs">
                <p className="text-2xs text-muted">This week</p>
                <p className="mt-0.5 text-sm font-medium text-ink">2 sessions · 90 min</p>
              </div>
              <span className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-accent text-xs font-medium text-white">
                Add to planner
                <ArrowRight size={13} aria-hidden />
              </span>
            </div>
          </div>
        )}

        {tab === "planner" && (
          <div key="planner" className="hb-swap-in">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className={label}>This week</p>
                <p className="mt-1 font-display text-2xl text-ink sm:text-3xl">
                  <span className="tabular">{plannerDone.size}</span> of {TOTAL_SESSIONS} sessions done
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-paper-3 px-2.5 py-1 text-2xs font-medium text-graphite">
                5h available
              </span>
            </div>

            <div className="hb-scroll-x -mx-5 mt-5 px-5 sm:-mx-8 sm:px-8">
              <div className="grid min-w-[620px] grid-cols-7 gap-2">
                {WEEK.map((day) => (
                  <div key={day.day} className="min-w-0">
                    <p className="mb-2 text-center text-2xs font-medium text-muted">{day.day}</p>
                    <div className="min-h-[168px] space-y-1.5 rounded-[14px] bg-paper-2 p-1.5">
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
                              "flex w-full items-start gap-1.5 rounded-[10px] bg-paper px-2 py-2 text-left text-2xs leading-snug shadow-xs transition-[color,box-shadow,transform] duration-300 ease-apple active:scale-[0.97]",
                              done ? "text-faint" : "text-ink hover:shadow-sm",
                            )}
                            aria-pressed={done}
                          >
                            <span
                              className={cn(
                                "mt-px flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ease-apple",
                                done ? "bg-moss text-white" : "ring-[1.5px] ring-inset ring-line-strong",
                              )}
                              aria-hidden
                            >
                              {done && <Check size={9} strokeWidth={3.5} />}
                            </span>
                            <span className={cn("min-w-0", done && "line-through")}>{task}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-[16px] bg-paper-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Today · 45 minute session</p>
                <p className="mt-0.5 text-xs text-muted">
                  SQL filtering and joins — from your current milestone.
                </p>
              </div>
              <span className="inline-flex h-8 shrink-0 items-center justify-center self-start rounded-full bg-accent px-4 text-xs font-medium text-white sm:self-auto">
                Start focus
              </span>
            </div>
            <p className="mt-3 text-2xs leading-relaxed text-faint">
              Preview only. In the product, tasks come from your milestones and are sized to the
              hours you say you have.
            </p>
          </div>
        )}

        {tab === "portfolio" && (
          <div key="portfolio" className="hb-swap-in">
            <div className="flex items-center gap-4">
              <span className="hb-avatar h-14 w-14 text-lg">
                AR
              </span>
              <div className="min-w-0">
                <p className="font-display text-2xl text-ink sm:text-3xl">Aarav Rathore</p>
                <p className="mt-0.5 text-xs text-muted">
                  Aspiring data analyst · SQL, spreadsheets, clear reporting
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-2xs text-muted">
              <span className="flex items-center gap-1.5">
                <Target size={13} aria-hidden /> Data Analyst
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-moss" aria-hidden /> 2 verified skills
              </span>
              <span className="flex items-center gap-1.5">
                <FolderGit2 size={13} aria-hidden /> 1 project
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-paper-2 p-5">
                <p className={label}>Verified skills</p>
                {(
                  [
                    ["Spreadsheets", 72],
                    ["SQL", 58],
                  ] as const
                ).map(([name, score], index) => (
                  <div key={name} className="mt-3.5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-ink">{name}</span>
                      <span className="tabular font-semibold text-moss">{score}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-4">
                      <div
                        className="animate-draw h-full rounded-full bg-moss"
                        style={{ width: `${score}%`, animationDelay: `${180 + index * 120}ms` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="mt-4 text-2xs leading-relaxed text-muted">
                  Verified means an assessment scored it, not that you ticked a box.
                </p>
              </div>

              <div className="rounded-[18px] bg-paper-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className={label}>Project</p>
                  <span className="rounded-full bg-moss-soft px-2 py-0.5 text-3xs font-medium text-moss">
                    Completed
                  </span>
                </div>
                <p className="mt-3 text-md font-semibold leading-snug text-ink">
                  Sales performance dashboard
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  Cleaned 12 months of sales data, built a regional view and wrote a two-page summary
                  of what leadership should do next.
                </p>
                <p className="mt-3 border-l-2 border-line-strong pl-3 text-xs italic leading-relaxed text-graphite">
                  “The first chart was unreadable. I rebuilt it around one question.”
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[16px] bg-paper-2 px-4 py-3">
              <p className="flex items-center gap-2 text-xs text-graphite">
                <CheckCircle2 size={15} className="shrink-0 text-moss" aria-hidden />
                Shareable with a private link you control
              </p>
              <span className="inline-flex items-center gap-0.5 text-xs text-link">
                Portfolio
                <ChevronRight size={13} strokeWidth={2.2} aria-hidden />
              </span>
            </div>
          </div>
        )}

        {tab === "mentor" && (
          <div key="mentor" className="hb-swap-in mx-auto max-w-[720px]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className={label}>Paper</p>
                <p className="mt-1 font-display text-2xl text-ink sm:text-3xl">Grounded in your plan</p>
              </div>
              <span className="shrink-0 rounded-full bg-paper-3 px-2.5 py-1 text-2xs font-medium text-graphite">
                Guided mode
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="animate-rise flex justify-end [animation-delay:160ms]">
                <p className="max-w-[82%] text-wrap rounded-[20px] rounded-br-[6px] bg-accent px-4 py-2.5 text-sm leading-relaxed text-white">
                  I only have four hours this week. What should I drop?
                </p>
              </div>
              <div className="animate-rise flex items-end gap-2.5 [animation-delay:520ms]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-3 text-graphite">
                  <Sparkles size={13} aria-hidden />
                </span>
                <div className="max-w-[86%] rounded-[20px] rounded-bl-[6px] bg-paper-2 px-4 py-3">
                  <p className="text-wrap text-sm leading-relaxed text-ink">
                    Keep the SQL session and the dataset cleaning. Move the dashboard project to next
                    week. Four hours is enough to finish one milestone properly — not three badly.
                  </p>
                  <p className="mt-2 text-2xs text-muted">Guided response · built from your roadmap</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["Where are my biggest gaps?", "Which project next?", "Plan my week"].map((prompt) => (
                <span
                  key={prompt}
                  className="rounded-full px-3 py-1.5 text-2xs font-medium text-graphite ring-1 ring-inset ring-line-strong"
                >
                  {prompt}
                </span>
              ))}
            </div>
            <p className="mt-4 text-2xs leading-relaxed text-faint">
              Illustrative conversation. Paper never invents scores, resources or job offers, and
              works without AI using your recorded plan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
