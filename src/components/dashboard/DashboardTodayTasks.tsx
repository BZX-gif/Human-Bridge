"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Loader2, Plus } from "lucide-react";
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
      <div className="rounded-md bg-paper-2 px-5 py-5">
        <p className="text-sm leading-relaxed text-muted">
          Nothing scheduled today. Pick one action small enough to finish.
        </p>
        <Link href="/planner" className="hb-link mt-2.5 text-sm">
          <Plus size={14} aria-hidden />
          Add a task
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(pending && "opacity-70 transition-opacity duration-300")}>
      <ul className="divide-y divide-line">
        {tasks.slice(0, 5).map((task) => {
          const done = task.status === "done";
          const busy = busyId === task.id;
          return (
            <li key={task.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => void toggle(task)}
                disabled={busyId !== null}
                aria-label={done ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
                className={cn(
                  "mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-[background-color,border-color,transform] duration-200 ease-apple active:scale-90",
                  done
                    ? "border-accent bg-accent text-white"
                    : "border-field text-transparent hover:border-accent hover:bg-accent-soft",
                )}
              >
                {busy ? (
                  <Loader2 size={11} className="animate-spin text-muted" aria-hidden />
                ) : (
                  <Check size={12} strokeWidth={3} aria-hidden />
                )}
              </button>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-md leading-snug",
                    done ? "text-muted line-through decoration-line-strong" : "text-ink",
                  )}
                >
                  {task.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">
                  {task.estimatedMinutes}m
                  {task.milestoneTitle ? ` · ${task.milestoneTitle}` : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="mt-3 text-xs text-rust">
          {error}
        </p>
      )}
      <Link href="/planner" className="hb-link mt-4 text-sm">
        Open planner
        <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
      </Link>
    </div>
  );
}
