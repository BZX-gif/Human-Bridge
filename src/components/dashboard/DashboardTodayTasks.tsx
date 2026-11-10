"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Plus } from "lucide-react";
import type { PlannerTaskView } from "@/lib/services/planner-service";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export function DashboardTodayTasks({ tasks }: { tasks: PlannerTaskView[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(task: PlannerTaskView) {
    if (busyId !== null) return;
    setBusyId(task.id);
    setError(null);
    try {
      await apiFetch(`/api/planner/tasks/${task.id}`, {
        method: "PATCH",
        json: { status: task.status === "done" ? "todo" : "done" },
      });
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not update the task.");
    } finally {
      setBusyId(null);
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-line-strong px-4 py-5">
        <p className="text-[12px] leading-relaxed text-muted">
          Nothing scheduled today. Pick one action small enough to finish.
        </p>
        <Link
          href="/planner"
          className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-ink"
        >
          <Plus size={12} aria-hidden />
          Add a task
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-line">
        {tasks.slice(0, 5).map((task) => {
          const done = task.status === "done";
          const busy = busyId === task.id;
          return (
            <li key={task.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => void toggle(task)}
                disabled={busyId !== null}
                aria-label={done ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  done ? "border-ink bg-ink text-paper" : "border-line-strong text-transparent hover:border-ink",
                )}
              >
                {busy ? (
                  <Loader2 size={10} className="animate-spin text-muted" aria-hidden />
                ) : (
                  <Check size={11} strokeWidth={2.6} aria-hidden />
                )}
              </button>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[12.5px] leading-snug", done ? "text-muted line-through decoration-line-strong" : "text-ink")}>
                  {task.title}
                </span>
                <span className="mt-0.5 block truncate text-[10.5px] text-muted">
                  {task.estimatedMinutes}m
                  {task.milestoneTitle ? ` · ${task.milestoneTitle}` : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {error && <p role="alert" className="mt-2 text-[11px] text-rust">{error}</p>}
      <Link
        href="/planner"
        className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-ink"
      >
        Open planner
        <ArrowRight size={12} aria-hidden />
      </Link>
    </div>
  );
}
