"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Flag,
  Loader2,
  Plus,
  Repeat,
  RotateCcw,
  Target,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import type {
  PlannerData,
  PlannerGoalView,
  PlannerTaskView,
  TaskPriority,
} from "@/lib/services/planner-service";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/utils";

type View = "today" | "week" | "month" | "goals";

const PRIORITY_STYLES: Record<TaskPriority, { label: string; dot: string; text: string }> = {
  high: { label: "High", dot: "bg-rust", text: "text-rust" },
  medium: { label: "Medium", dot: "bg-ochre", text: "text-ochre" },
  low: { label: "Low", dot: "bg-line-strong", text: "text-muted" },
};

const GOAL_CATEGORIES = [
  { value: "career", label: "Career" },
  { value: "learning", label: "Learning" },
  { value: "personal", label: "Personal" },
  { value: "finance", label: "Finance" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
];

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}
function startOfWeek(date: Date) {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(copy, diff);
}
function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}
function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function formatDay(date: Date, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat("en-GB", opts).format(date);
}
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface TaskFormState {
  id: number | null;
  title: string;
  notes: string;
  priority: TaskPriority;
  scheduledFor: string;
  dueDate: string;
  estimatedMinutes: number;
  recurrence: string;
  milestoneId: string;
  goalId: string;
}

function blankTaskForm(date: Date): TaskFormState {
  const base = startOfDay(date);
  base.setHours(9, 0, 0, 0);
  return {
    id: null,
    title: "",
    notes: "",
    priority: "medium",
    scheduledFor: toLocalInput(base),
    dueDate: "",
    estimatedMinutes: 30,
    recurrence: "none",
    milestoneId: "",
    goalId: "",
  };
}

export function PlannerWorkspace({
  initialData,
  weeklyHours,
}: {
  initialData: PlannerData;
  weeklyHours: number;
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [data, setData] = useState(initialData);
  const [view, setView] = useState<View>("today");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthCursor, setMonthCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [taskForm, setTaskForm] = useState<TaskFormState | null>(null);
  const [goalForm, setGoalForm] = useState<{ title: string; description: string; category: string; targetDate: string } | null>(null);
  const [confirmTask, setConfirmTask] = useState<PlannerTaskView | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    try {
      const next = await apiFetch<PlannerData>("/api/planner/tasks");
      setData(next);
    } catch {
      // Mutations already succeeded; a stale read is preferable to an error flash.
    }
  }

  async function run(key: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleTask(task: PlannerTaskView) {
    await run(`task-${task.id}`, async () => {
      await apiFetch(`/api/planner/tasks/${task.id}`, {
        method: "PATCH",
        json: { status: task.status === "done" ? "todo" : "done" },
      });
      await refresh();
    });
  }

  async function saveTask(form: TaskFormState) {
    await run("save-task", async () => {
      const payload = {
        title: form.title.trim(),
        notes: form.notes.trim() || null,
        priority: form.priority,
        scheduledFor: form.scheduledFor || null,
        dueDate: form.dueDate || null,
        estimatedMinutes: form.estimatedMinutes,
        recurrence: form.recurrence,
        milestoneId: form.milestoneId ? Number(form.milestoneId) : null,
        goalId: form.goalId ? Number(form.goalId) : null,
      };
      if (form.id) {
        await apiFetch(`/api/planner/tasks/${form.id}`, { method: "PATCH", json: payload });
      } else {
        await apiFetch("/api/planner/tasks", { method: "POST", json: payload });
      }
      setTaskForm(null);
      setNotice(form.id ? "Task updated." : "Task added to your plan.");
      await refresh();
    });
  }

  async function deleteTask(task: PlannerTaskView) {
    await run("delete-task", async () => {
      await apiFetch(`/api/planner/tasks/${task.id}`, { method: "DELETE" });
      setConfirmTask(null);
      setNotice("Task deleted.");
      await refresh();
    });
  }

  async function reschedule() {
    await run("reschedule", async () => {
      const result = await apiFetch<{ moved: number }>("/api/planner/reschedule", { method: "POST" });
      setNotice(
        result.moved > 0
          ? `${result.moved} overdue task${result.moved === 1 ? "" : "s"} moved to today.`
          : "Nothing was overdue.",
      );
      await refresh();
    });
  }

  async function saveGoal() {
    if (!goalForm) return;
    await run("save-goal", async () => {
      await apiFetch("/api/planner/goals", {
        method: "POST",
        json: {
          title: goalForm.title.trim(),
          description: goalForm.description.trim() || null,
          category: goalForm.category,
          targetDate: goalForm.targetDate || null,
        },
      });
      setGoalForm(null);
      setNotice("Goal created.");
      await refresh();
    });
  }

  async function completeGoal(goal: PlannerGoalView) {
    await run(`goal-${goal.id}`, async () => {
      await apiFetch(`/api/planner/goals/${goal.id}`, {
        method: "PATCH",
        json: { status: goal.status === "completed" ? "active" : "completed" },
      });
      await refresh();
    });
  }

  const openTasks = data.tasks.filter((task) => task.status !== "done");
  const overdue = openTasks.filter(
    (task) => task.scheduledFor && startOfDay(new Date(task.scheduledFor)) < today,
  );
  const todayTasks = openTasks.filter(
    (task) => task.scheduledFor && sameDay(new Date(task.scheduledFor), today),
  );
  const upcoming = openTasks
    .filter((task) => !task.scheduledFor || startOfDay(new Date(task.scheduledFor)) > today)
    .sort((a, b) => {
      if (!a.scheduledFor) return 1;
      if (!b.scheduledFor) return -1;
      return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
    });

  const weekStart = addDays(startOfWeek(today), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const monthGridStart = startOfWeek(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, index) => addDays(monthGridStart, index));

  return (
    <div className="app-page">
      <header className="animate-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Planner</p>
          <h1 className="display-md mt-2.5 text-ink">What today actually requires.</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            {formatDay(new Date(), { weekday: "long", day: "numeric", month: "long" })} ·{" "}
            {weeklyHours}h/week committed. A realistic plan beats an ambitious one you abandon.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {data.stats.overdue > 0 && (
            <Button variant="secondary" size="md" onClick={() => void reschedule()} disabled={busy !== null}>
              {busy === "reschedule" ? (
                <Loader2 size={14} className="animate-spin" aria-hidden />
              ) : (
                <RotateCcw size={14} aria-hidden />
              )}
              Move {data.stats.overdue} overdue to today
            </Button>
          )}
          <Button size="md" onClick={() => setTaskForm(blankTaskForm(today))}>
            <Plus size={15} aria-hidden />
            New task
          </Button>
        </div>
      </header>

      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={cn(
            "animate-rise mt-5 flex items-start justify-between gap-3 rounded-md px-4 py-3 text-sm",
            error ? "bg-rust-soft text-rust" : "bg-moss-soft text-moss",
          )}
        >
          <p>{error ?? notice}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setNotice(null);
            }}
            className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-200 hover:bg-black/[0.07]"
            aria-label="Dismiss"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      )}

      <section className="stagger mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Metric label="Due today" value={data.stats.todayTotal} hint={`${data.stats.todayDone} completed`} />
        <Metric label="Overdue" value={data.stats.overdue} hint={data.stats.overdue > 0 ? "Reschedule, don't ignore" : "Nothing behind"} accent={data.stats.overdue > 0 ? "rust" : undefined} />
        <Metric label="Completed this week" value={data.stats.weekDone} hint={`${data.stats.minutesThisWeek} focused minutes`} accent="moss" />
        <Metric label="Current streak" value={`${data.stats.streak}d`} hint={`${data.stats.activeDays} active days this week`} />
      </section>

      <div className="hb-scroll-x mt-7 flex items-center justify-between gap-3">
        <div role="tablist" aria-label="Planner views" className="hb-segment shrink-0">
          {(
            [
              ["today", "Today"],
              ["week", "Week"],
              ["month", "Month"],
              ["goals", "Goals"],
            ] as [View, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={view === value}
              onClick={() => setView(value)}
              className={cn(
                "h-8 px-4 text-sm font-medium",
                view === value ? "bg-paper text-ink shadow-sm" : "text-graphite hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Link
          href="/journey"
          className="hb-link hidden shrink-0 text-sm sm:flex"
        >
          <Target size={14} aria-hidden />
          Plan from your roadmap
        </Link>
      </div>

      <div key={view} className="hb-swap-in mt-6">
        {view === "today" && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-7">
              {overdue.length > 0 && (
                <TaskGroup
                  title="Overdue"
                  tone="rust"
                  tasks={overdue}
                  today={today}
                  busy={busy}
                  onToggle={toggleTask}
                  onEdit={(task) => setTaskForm(taskToForm(task))}
                  onDelete={setConfirmTask}
                />
              )}
              <TaskGroup
                title="Today"
                tone="ink"
                tasks={todayTasks}
                today={today}
                busy={busy}
                onToggle={toggleTask}
                onEdit={(task) => setTaskForm(taskToForm(task))}
                onDelete={setConfirmTask}
                emptyMessage="Nothing scheduled for today. Either rest deliberately, or choose one small action."
                addLabel="Add a task for today"
                onAdd={() => setTaskForm(blankTaskForm(today))}
              />
              {upcoming.length > 0 && (
                <TaskGroup
                  title="Coming up"
                  tasks={upcoming.slice(0, 12)}
                  today={today}
                  busy={busy}
                  onToggle={toggleTask}
                  onEdit={(task) => setTaskForm(taskToForm(task))}
                  onDelete={setConfirmTask}
                />
              )}
            </div>

            <aside className="space-y-4">
              <div className="hb-card p-6">
                <p className="text-sm font-semibold text-ink">This week</p>
                <p className="stat-value mt-3">
                  {data.stats.weekDone} <span className="text-md font-normal tracking-normal text-muted">done</span>
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-3">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out-expo"
                    style={{
                      width: `${Math.min(100, (data.stats.weekDone / Math.max(1, data.stats.weekTotal)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-2.5 text-xs text-muted">
                  {data.stats.weekTotal} task{data.stats.weekTotal === 1 ? "" : "s"} in the week window
                </p>
              </div>

              <div className="hb-card p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Active goals</p>
                  <button
                    type="button"
                    onClick={() =>
                      setGoalForm({ title: "", description: "", category: "personal", targetDate: "" })
                    }
                    className="hb-link text-sm"
                  >
                    Add
                  </button>
                </div>
                {data.goals.filter((goal) => goal.status === "active").length === 0 ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    No personal goals yet. Career is not the only thing worth planning.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {data.goals
                      .filter((goal) => goal.status === "active")
                      .slice(0, 4)
                      .map((goal) => (
                        <li key={goal.id}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-ink">{goal.title}</p>
                            <span className="shrink-0 text-2xs capitalize text-muted">{goal.category}</span>
                          </div>
                          <p className="mt-0.5 text-2xs text-muted">
                            {goal.doneCount}/{goal.taskCount} linked tasks done
                          </p>
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              <div className="rounded-lg bg-paper-3/70 p-5">
                <p className="text-xs leading-relaxed text-muted">
                  Human Bridge will never invent a workload. When you generate tasks from a
                  milestone, it stays within your stated availability.
                </p>
              </div>
            </aside>
          </div>
        )}

        {view === "week" && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <p className="text-xl font-semibold tracking-[-0.02em] text-ink">
                {formatDay(weekDays[0], { day: "numeric", month: "short" })} –{" "}
                {formatDay(weekDays[6], { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                {weekOffset !== 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>
                    This week
                  </Button>
                )}
                <CalendarNavButton label="Previous week" onClick={() => setWeekOffset((offset) => offset - 1)}>
                  <ChevronLeft size={17} aria-hidden />
                </CalendarNavButton>
                <CalendarNavButton label="Next week" onClick={() => setWeekOffset((offset) => offset + 1)}>
                  <ChevronRight size={17} aria-hidden />
                </CalendarNavButton>
              </div>
            </div>
            <div className="hb-scroll-x pb-2">
              <div className="grid min-w-[760px] grid-cols-7 gap-px overflow-hidden rounded-lg bg-line shadow-xs ring-1 ring-line">
                {weekDays.map((day) => {
                  const dayTasks = data.tasks.filter(
                    (task) => task.scheduledFor && sameDay(new Date(task.scheduledFor), day),
                  );
                  const isToday = sameDay(day, today);
                  return (
                    <div key={dayKey(day)} className={cn("min-h-[280px] p-3", isToday ? "bg-[#f5faff]" : "bg-paper")}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={cn("text-xs font-medium", isToday ? "text-link" : "text-muted")}>
                            {formatDay(day, { weekday: "short" })}
                          </p>
                          <p
                            className={cn(
                              "tabular mt-1 flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold",
                              isToday ? "bg-accent text-white" : "-ml-2 text-ink",
                            )}
                          >
                            {day.getDate()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTaskForm(blankTaskForm(day))}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-paper-3 hover:text-ink"
                          aria-label={`Add task on ${formatDay(day)}`}
                        >
                          <Plus size={14} aria-hidden />
                        </button>
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {dayTasks.map((task) => (
                          <li key={task.id}>
                            <button
                              type="button"
                              onClick={() => void toggleTask(task)}
                              className={cn(
                                "w-full rounded-sm px-2.5 py-2 text-left text-2xs leading-snug transition-colors duration-200",
                                task.status === "done"
                                  ? "bg-paper-2 text-muted line-through"
                                  : "bg-paper-2 text-ink hover:bg-paper-3",
                              )}
                            >
                              <span className={cn("mb-1.5 block h-1 w-4 rounded-full", PRIORITY_STYLES[task.priority].dot)} />
                              {task.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-2.5 text-xs text-muted md:hidden">Swipe horizontally on smaller screens.</p>
          </div>
        )}

        {view === "month" && (
          <div>
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <p className="text-xl font-semibold tracking-[-0.02em] text-ink">
                {new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(monthCursor)}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
                  Today
                </Button>
                <CalendarNavButton
                  label="Previous month"
                  onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
                >
                  <ChevronLeft size={17} aria-hidden />
                </CalendarNavButton>
                <CalendarNavButton
                  label="Next month"
                  onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
                >
                  <ChevronRight size={17} aria-hidden />
                </CalendarNavButton>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg bg-paper shadow-xs ring-1 ring-line">
              <div className="grid grid-cols-7 border-b border-line">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="px-1.5 py-2.5 text-center text-xs font-medium text-muted">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-line">
                {monthDays.map((day) => {
                  const dayTasks = data.tasks.filter(
                    (task) => task.scheduledFor && sameDay(new Date(task.scheduledFor), day),
                  );
                  const inMonth = day.getMonth() === monthCursor.getMonth();
                  const isToday = sameDay(day, today);
                  return (
                    <button
                      type="button"
                      key={dayKey(day)}
                      onClick={() => setTaskForm(blankTaskForm(day))}
                      className={cn(
                        "flex min-h-[64px] flex-col items-stretch justify-start bg-paper p-1.5 text-left transition-colors duration-200 hover:bg-paper-2 sm:min-h-[96px] sm:p-2",
                        !inMonth && "bg-paper-2",
                      )}
                      aria-label={`Add or view tasks on ${formatDay(day)}`}
                    >
                      <span
                        className={cn(
                          "tabular inline-flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-full text-xs",
                          isToday ? "bg-accent font-semibold text-white" : inMonth ? "text-ink" : "text-muted",
                        )}
                      >
                        {day.getDate()}
                      </span>
                      <span className="mt-1.5 hidden min-w-0 space-y-1 sm:block">
                        {dayTasks.slice(0, 2).map((task) => (
                          <span
                            key={task.id}
                            className={cn(
                              "block truncate rounded-xs px-1.5 py-0.5 text-2xs leading-tight",
                              task.status === "done" ? "bg-paper-2 text-muted line-through" : "bg-accent-soft text-ink",
                            )}
                          >
                            {task.title}
                          </span>
                        ))}
                        {dayTasks.length > 2 && (
                          <span className="block px-1.5 text-2xs text-muted">+{dayTasks.length - 2} more</span>
                        )}
                      </span>
                      <span className="mt-1.5 flex gap-0.5 pl-1.5 sm:hidden">
                        {dayTasks.slice(0, 3).map((task) => (
                          <span
                            key={task.id}
                            className={cn("h-1 w-1 rounded-full", task.status === "done" ? "bg-line-strong" : PRIORITY_STYLES[task.priority].dot)}
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {view === "goals" && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              {data.goals.length === 0 ? (
                <EmptyState
                  title="No goals yet"
                  message="Career goals live in your journey. Personal goals — reading, finance, fitness, learning — can live here."
                  action={
                    <Button size="sm" onClick={() => setGoalForm({ title: "", description: "", category: "personal", targetDate: "" })}>
                      <Plus size={13} aria-hidden />
                      Create a goal
                    </Button>
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {data.goals.map((goal) => (
                    <li key={goal.id} className="hb-card p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-md font-medium text-ink">{goal.title}</p>
                            <Badge size="sm" variant={goal.category === "career" ? "dark" : "outline"} className="capitalize">
                              {goal.category}
                            </Badge>
                            {goal.status === "completed" && <Badge size="sm" variant="green">Complete</Badge>}
                          </div>
                          {goal.description && (
                            <p className="mt-1.5 text-sm leading-relaxed text-muted">{goal.description}</p>
                          )}
                          <p className="mt-2 text-xs text-muted">
                            {goal.doneCount}/{goal.taskCount} linked tasks done
                            {goal.targetDate && ` · target ${formatDay(new Date(goal.targetDate), { day: "numeric", month: "short", year: "numeric" })}`}
                          </p>
                        </div>
                        <Button
                          variant={goal.status === "completed" ? "ghost" : "secondary"}
                          size="sm"
                          onClick={() => void completeGoal(goal)}
                          disabled={busy !== null}
                        >
                          <Check size={12} aria-hidden />
                          {goal.status === "completed" ? "Reopen" : "Complete"}
                        </Button>
                      </div>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-paper-3">
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out-expo"
                          style={{ width: `${goal.taskCount === 0 ? 0 : (goal.doneCount / goal.taskCount) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <aside className="hb-card self-start p-6">
              <p className="text-xl font-semibold leading-tight tracking-[-0.02em] text-ink">Plan the whole life, not just the job.</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Personal goals are supported here, but the planner&apos;s intelligence stays focused on
                your career roadmap. Tasks can link to either.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setGoalForm({ title: "", description: "", category: "personal", targetDate: "" })}
              >
                <Plus size={13} aria-hidden />
                New goal
              </Button>
            </aside>
          </div>
        )}
      </div>

      {/* Task modal */}
      <Modal
        open={taskForm !== null}
        onOpenChange={(open) => !open && setTaskForm(null)}
        title={taskForm?.id ? "Edit task" : "New task"}
        description="Link it to a milestone so the work stays connected to your goal."
        footer={
          <>
            <Button variant="ghost" onClick={() => setTaskForm(null)}>Cancel</Button>
            <Button
              onClick={() => taskForm && void saveTask(taskForm)}
              disabled={!taskForm?.title.trim() || busy !== null}
            >
              {busy === "save-task" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
              {taskForm?.id ? "Save changes" : "Add to plan"}
            </Button>
          </>
        }
      >
        {taskForm && (
          <div className="space-y-4">
            <div>
              <label htmlFor="task-title" className="hb-label">Task</label>
              <input
                id="task-title"
                value={taskForm.title}
                onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                className="hb-input"
                placeholder="e.g. Solve five array exercises"
                autoFocus
                maxLength={240}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="task-when" className="hb-label">Scheduled for</label>
                <input
                  id="task-when"
                  type="datetime-local"
                  value={taskForm.scheduledFor}
                  onChange={(event) => setTaskForm({ ...taskForm, scheduledFor: event.target.value })}
                  className="hb-input"
                />
              </div>
              <div>
                <label htmlFor="task-due" className="hb-label">Due date (optional)</label>
                <input
                  id="task-due"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
                  className="hb-input"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="task-priority" className="hb-label">Priority</label>
                <select
                  id="task-priority"
                  value={taskForm.priority}
                  onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as TaskPriority })}
                  className="hb-input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="task-minutes" className="hb-label">Minutes</label>
                <input
                  id="task-minutes"
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={taskForm.estimatedMinutes}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, estimatedMinutes: Number(event.target.value) || 30 })
                  }
                  className="hb-input"
                />
              </div>
              <div>
                <label htmlFor="task-repeat" className="hb-label">Repeat</label>
                <select
                  id="task-repeat"
                  value={taskForm.recurrence}
                  onChange={(event) => setTaskForm({ ...taskForm, recurrence: event.target.value })}
                  className="hb-input"
                >
                  <option value="none">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="task-milestone" className="hb-label">Milestone</label>
                <select
                  id="task-milestone"
                  value={taskForm.milestoneId}
                  onChange={(event) => setTaskForm({ ...taskForm, milestoneId: event.target.value })}
                  className="hb-input"
                >
                  <option value="">Not linked</option>
                  {data.milestones.map((milestone) => (
                    <option key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-goal" className="hb-label">Goal</label>
                <select
                  id="task-goal"
                  value={taskForm.goalId}
                  onChange={(event) => setTaskForm({ ...taskForm, goalId: event.target.value })}
                  className="hb-input"
                >
                  <option value="">Not linked</option>
                  {data.goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>{goal.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="task-notes" className="hb-label">Notes (optional)</label>
              <textarea
                id="task-notes"
                value={taskForm.notes}
                onChange={(event) => setTaskForm({ ...taskForm, notes: event.target.value })}
                className="hb-input"
                rows={3}
                placeholder="What exactly will you produce?"
                maxLength={4000}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Goal modal */}
      <Modal
        open={goalForm !== null}
        onOpenChange={(open) => !open && setGoalForm(null)}
        title="New goal"
        description="Keep it specific enough that you will know when it is done."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setGoalForm(null)}>Cancel</Button>
            <Button onClick={() => void saveGoal()} disabled={!goalForm?.title.trim() || busy !== null}>
              {busy === "save-goal" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
              Create goal
            </Button>
          </>
        }
      >
        {goalForm && (
          <div className="space-y-4">
            <div>
              <label htmlFor="goal-title" className="hb-label">Goal</label>
              <input
                id="goal-title"
                value={goalForm.title}
                onChange={(event) => setGoalForm({ ...goalForm, title: event.target.value })}
                className="hb-input"
                placeholder="e.g. Read four books on product strategy"
                maxLength={200}
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="goal-category" className="hb-label">Category</label>
              <select
                id="goal-category"
                value={goalForm.category}
                onChange={(event) => setGoalForm({ ...goalForm, category: event.target.value })}
                className="hb-input"
              >
                {GOAL_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="goal-target" className="hb-label">Target date (optional)</label>
              <input
                id="goal-target"
                type="date"
                value={goalForm.targetDate}
                onChange={(event) => setGoalForm({ ...goalForm, targetDate: event.target.value })}
                className="hb-input"
              />
            </div>
            <div>
              <label htmlFor="goal-description" className="hb-label">Why this matters (optional)</label>
              <textarea
                id="goal-description"
                value={goalForm.description}
                onChange={(event) => setGoalForm({ ...goalForm, description: event.target.value })}
                className="hb-input"
                rows={3}
                maxLength={4000}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={confirmTask !== null}
        onOpenChange={(open) => !open && setConfirmTask(null)}
        title="Delete this task?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmTask(null)}>Keep it</Button>
            <Button variant="danger" onClick={() => confirmTask && void deleteTask(confirmTask)} disabled={busy !== null}>
              Delete task
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-graphite">
          “{confirmTask?.title}” will be removed from your plan. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function taskToForm(task: PlannerTaskView): TaskFormState {
  const scheduled = task.scheduledFor ? new Date(task.scheduledFor) : new Date();
  const due = task.dueDate ? new Date(task.dueDate) : null;
  return {
    id: task.id,
    title: task.title,
    notes: task.notes ?? "",
    priority: task.priority,
    scheduledFor: task.scheduledFor ? toLocalInput(scheduled) : "",
    dueDate: due ? dayKey(due) : "",
    estimatedMinutes: task.estimatedMinutes,
    recurrence: task.recurrence,
    milestoneId: task.milestoneId ? String(task.milestoneId) : "",
    goalId: task.goalId ? String(task.goalId) : "",
  };
}

function CalendarNavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-paper text-graphite shadow-xs ring-1 ring-line transition-[background-color,color,transform] duration-200 ease-apple hover:bg-paper-3 hover:text-ink active:scale-95"
    >
      {children}
    </button>
  );
}

function Metric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  accent?: "moss" | "rust";
}) {
  return (
    <div className="hb-card p-5 sm:p-6">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={cn(
          "stat-value mt-2",
          accent === "moss" ? "text-moss" : accent === "rust" ? "text-rust" : "text-ink",
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-2xs leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

function TaskGroup({
  title,
  tone,
  tasks,
  today,
  busy,
  onToggle,
  onEdit,
  onDelete,
  emptyMessage,
  addLabel,
  onAdd,
}: {
  title: string;
  tone?: "rust" | "ink";
  tasks: PlannerTaskView[];
  today: Date;
  busy: string | null;
  onToggle: (task: PlannerTaskView) => Promise<void>;
  onEdit: (task: PlannerTaskView) => void;
  onDelete: (task: PlannerTaskView) => void;
  emptyMessage?: string;
  addLabel?: string;
  onAdd?: () => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between px-1">
        <h2
          className={cn(
            "flex items-center gap-2 text-base font-semibold",
            tone === "rust" ? "text-rust" : "text-ink",
          )}
        >
          {title}
          <span className="tabular rounded-full bg-paper-4 px-2 py-0.5 text-2xs font-medium text-graphite">
            {tasks.length}
          </span>
        </h2>
        {onAdd && (
          <button type="button" onClick={onAdd} className="hb-link text-sm">
            <Plus size={14} aria-hidden />
            Add
          </button>
        )}
      </div>

      {tasks.length === 0 && emptyMessage ? (
        <div className="hb-card mt-3 px-5 py-9 text-center">
          <p className="mx-auto max-w-md text-md leading-relaxed text-muted">{emptyMessage}</p>
          {onAdd && addLabel && (
            <Button variant="secondary" size="md" className="mt-5" onClick={onAdd}>
              <Plus size={15} aria-hidden />
              {addLabel}
            </Button>
          )}
        </div>
      ) : (
        <ul className="hb-card mt-3 divide-y divide-line px-5">
          {tasks.map((task) => {
            const done = task.status === "done";
            const isBusy = busy === `task-${task.id}`;
            const overdue =
              !done && task.scheduledFor && startOfDay(new Date(task.scheduledFor)) < today;
            return (
              <li key={task.id} className="group flex items-start gap-3.5 py-4">
                <button
                  type="button"
                  onClick={() => void onToggle(task)}
                  disabled={isBusy}
                  aria-label={done ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
                  className={cn(
                    "mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-[background-color,border-color,transform] duration-200 ease-apple active:scale-90",
                    done
                      ? "border-accent bg-accent text-white"
                      : "border-field bg-paper text-transparent hover:border-accent hover:bg-accent-soft",
                  )}
                >
                  {isBusy ? (
                    <Loader2 size={11} className="animate-spin text-muted" aria-hidden />
                  ) : (
                    <Check size={12} strokeWidth={3} aria-hidden />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-md leading-snug",
                      done ? "text-muted line-through decoration-line-strong" : "text-ink",
                    )}
                  >
                    {task.title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_STYLES[task.priority].dot)} aria-hidden />
                      <span className={PRIORITY_STYLES[task.priority].text}>{PRIORITY_STYLES[task.priority].label}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} aria-hidden /> {task.estimatedMinutes}m
                    </span>
                    {task.scheduledFor && (
                      <span className="flex items-center gap-1">
                        <CalendarDays size={10} aria-hidden />
                        {formatDay(new Date(task.scheduledFor), { day: "numeric", month: "short" })}
                        {overdue && <span className="font-medium text-rust"> · overdue</span>}
                      </span>
                    )}
                    {task.recurrence !== "none" && (
                      <span className="flex items-center gap-1">
                        <Repeat size={10} aria-hidden /> {task.recurrence}
                      </span>
                    )}
                    {task.milestoneTitle && (
                      <Link
                        href="/journey"
                        className="flex max-w-[240px] items-center gap-1 truncate text-link hover:underline hover:underline-offset-2"
                      >
                        <Target size={10} className="shrink-0" aria-hidden />
                        <span className="truncate">{task.milestoneTitle}</span>
                      </Link>
                    )}
                    {task.goalTitle && (
                      <span className="flex items-center gap-1 text-graphite">
                        <Flag size={10} aria-hidden /> {task.goalTitle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEdit(task)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-paper-3 hover:text-ink"
                    aria-label={`Edit ${task.title}`}
                  >
                    <Pencil size={14} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(task)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-rust-soft hover:text-rust"
                    aria-label={`Delete ${task.title}`}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
