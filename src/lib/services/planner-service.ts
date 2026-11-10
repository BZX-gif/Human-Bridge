import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import { requestMemo } from "@/lib/server-cache";
import { getDb } from "@/db";
import {
  careerRoadmaps,
  plannerGoals,
  plannerTasks,
  roadmapMilestones,
  roadmapStages,
  users,
} from "@/db/schema";
import { ApiError } from "@/lib/api/response";
import { recordEvent } from "@/lib/events";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface PlannerTaskView {
  id: number;
  title: string;
  notes: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  scheduledFor: string | null;
  dueDate: string | null;
  estimatedMinutes: number;
  recurrence: string;
  completedAt: string | null;
  milestoneId: number | null;
  milestoneTitle: string | null;
  goalId: number | null;
  goalTitle: string | null;
  createdAt: string;
}

export interface PlannerGoalView {
  id: number;
  title: string;
  description: string | null;
  category: string;
  targetDate: string | null;
  status: string;
  taskCount: number;
  doneCount: number;
}

export interface PlannerMilestoneOption {
  id: number;
  title: string;
  roadmapTitle: string;
  careerName: string;
  stageTitle: string;
  status: string;
}

export interface PlannerData {
  tasks: PlannerTaskView[];
  goals: PlannerGoalView[];
  milestones: PlannerMilestoneOption[];
  stats: {
    todayTotal: number;
    todayDone: number;
    overdue: number;
    weekDone: number;
    weekTotal: number;
    minutesThisWeek: number;
    activeDays: number;
    streak: number;
  };
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toISO(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function taskView(
  row: typeof plannerTasks.$inferSelect,
  milestoneTitle: string | null,
  goalTitle: string | null,
): PlannerTaskView {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    priority: row.priority,
    status: row.status,
    scheduledFor: toISO(row.scheduledFor),
    dueDate: toISO(row.dueDate),
    estimatedMinutes: row.estimatedMinutes,
    recurrence: row.recurrence,
    completedAt: toISO(row.completedAt),
    milestoneId: row.milestoneId,
    milestoneTitle,
    goalId: row.goalId,
    goalTitle,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Tasks + goals + milestone links for the planner, scoped to one user. */
export async function loadPlannerData(
  userId: number,
  options: { from?: Date; to?: Date } = {},
): Promise<PlannerData> {
  const db = await getDb();
  const now = new Date();
  const from = options.from ?? addDays(startOfDay(now), -14);
  const to = options.to ?? addDays(endOfDay(now), 42);

  const [goalRows, milestoneRowsData, taskRows] = await Promise.all([
    db
      .select()
      .from(plannerGoals)
      .where(eq(plannerGoals.userId, userId))
      .orderBy(asc(plannerGoals.status), desc(plannerGoals.createdAt)),
    db
      .select({
        id: roadmapMilestones.id,
        title: roadmapMilestones.title,
        status: roadmapMilestones.status,
        stageTitle: roadmapStages.title,
        roadmapTitle: careerRoadmaps.title,
        careerName: sql<string>`(select name from careers where careers.id = ${careerRoadmaps.careerId})`,
      })
      .from(roadmapMilestones)
      .innerJoin(roadmapStages, eq(roadmapStages.id, roadmapMilestones.stageId))
      .innerJoin(careerRoadmaps, eq(careerRoadmaps.id, roadmapMilestones.roadmapId))
      .where(and(eq(careerRoadmaps.userId, userId), eq(careerRoadmaps.status, "active")))
      .orderBy(asc(roadmapMilestones.ordering)),
    db
      .select()
      .from(plannerTasks)
      .where(
        and(
          eq(plannerTasks.userId, userId),
          or(
            and(gte(plannerTasks.scheduledFor, from), lte(plannerTasks.scheduledFor, to)),
            isNull(plannerTasks.scheduledFor),
            lt(plannerTasks.scheduledFor, from),
          ),
        ),
      )
      .orderBy(asc(plannerTasks.scheduledFor), asc(plannerTasks.status), asc(plannerTasks.ordering)),
  ]);

  const milestoneMap = new Map(milestoneRowsData.map((m) => [m.id, m.title]));
  const goalMap = new Map(goalRows.map((g) => [g.id, g.title]));

  const tasks = taskRows
    .filter((row) => row.status !== "done" || (row.completedAt && row.completedAt >= from))
    .map((row) =>
      taskView(
        row,
        row.milestoneId ? milestoneMap.get(row.milestoneId) ?? null : null,
        row.goalId ? goalMap.get(row.goalId) ?? null : null,
      ),
    );

  const todayStart = startOfDay(now);
  const weekStart = addDays(todayStart, -6);

  const open = tasks.filter((task) => task.status !== "done");
  const todayTasks = open.filter(
    (task) => task.scheduledFor && new Date(task.scheduledFor) <= endOfDay(now),
  );
  const overdue = open.filter(
    (task) => task.scheduledFor && new Date(task.scheduledFor) < todayStart,
  );
  const doneThisWeek = tasks.filter(
    (task) => task.status === "done" && task.completedAt && new Date(task.completedAt) >= weekStart,
  );

  const activeDates = new Set(
    doneThisWeek.map((task) => (task.completedAt ? startOfDay(new Date(task.completedAt)).toDateString() : "")),
  );

  // Consecutive days ending today (or yesterday) with at least one completed task.
  let streak = 0;
  for (let offset = 0; offset < 60; offset++) {
    const day = addDays(todayStart, -offset);
    if (activeDates.has(day.toDateString())) streak += 1;
    else if (offset === 0) continue;
    else break;
  }

  const goals: PlannerGoalView[] = goalRows.map((goal) => {
    const linked = tasks.filter((task) => task.goalId === goal.id);
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetDate: toISO(goal.targetDate),
      status: goal.status,
      taskCount: linked.length,
      doneCount: linked.filter((task) => task.status === "done").length,
    };
  });

  return {
    tasks,
    goals,
    milestones: milestoneRowsData.map((row) => ({
      id: row.id,
      title: row.title,
      roadmapTitle: row.roadmapTitle,
      careerName: row.careerName,
      stageTitle: row.stageTitle,
      status: row.status,
    })),
    stats: {
      todayTotal: todayTasks.length,
      todayDone: tasks.filter(
        (task) =>
          task.status === "done" &&
          task.completedAt &&
          new Date(task.completedAt) >= todayStart,
      ).length,
      overdue: overdue.length,
      weekDone: doneThisWeek.length,
      weekTotal: tasks.filter(
        (task) => task.scheduledFor && new Date(task.scheduledFor) >= weekStart,
      ).length,
      minutesThisWeek: doneThisWeek.reduce((sum, task) => sum + task.estimatedMinutes, 0),
      activeDays: activeDates.size,
      streak,
    },
  };
}

/** Request-deduped planner read for pages and GET routes. */
export const getPlannerData = requestMemo(loadPlannerData);

export async function createTask(
  userId: number,
  input: {
    title: string;
    notes?: string | null;
    priority?: TaskPriority;
    scheduledFor?: string | null;
    dueDate?: string | null;
    estimatedMinutes?: number;
    recurrence?: string;
    milestoneId?: number | null;
    goalId?: number | null;
  },
): Promise<PlannerTaskView> {
  const db = await getDb();

  if (input.milestoneId) {
    const [owned] = await db
      .select({ id: roadmapMilestones.id })
      .from(roadmapMilestones)
      .innerJoin(careerRoadmaps, eq(careerRoadmaps.id, roadmapMilestones.roadmapId))
      .where(and(eq(roadmapMilestones.id, input.milestoneId), eq(careerRoadmaps.userId, userId)))
      .limit(1);
    if (!owned) throw new ApiError("NOT_FOUND", "Milestone not found.");
  }
  if (input.goalId) {
    const [owned] = await db
      .select({ id: plannerGoals.id })
      .from(plannerGoals)
      .where(and(eq(plannerGoals.id, input.goalId), eq(plannerGoals.userId, userId)))
      .limit(1);
    if (!owned) throw new ApiError("NOT_FOUND", "Goal not found.");
  }

  const [row] = await db
    .insert(plannerTasks)
    .values({
      userId,
      title: input.title,
      notes: input.notes ?? null,
      priority: input.priority ?? "medium",
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      estimatedMinutes: input.estimatedMinutes ?? 30,
      recurrence: input.recurrence ?? "none",
      milestoneId: input.milestoneId ?? null,
      goalId: input.goalId ?? null,
    })
    .returning();

  if (row.milestoneId) {
    await db
      .update(roadmapMilestones)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(
        and(eq(roadmapMilestones.id, row.milestoneId), eq(roadmapMilestones.status, "not_started")),
      );
  }

  await recordEvent({ type: "task.created", userId, payload: { taskId: row.id, title: row.title } });
  return taskView(row, null, null);
}

export async function updateTask(
  userId: number,
  taskId: number,
  patch: {
    title?: string;
    notes?: string | null;
    priority?: TaskPriority;
    status?: TaskStatus;
    scheduledFor?: string | null;
    dueDate?: string | null;
    estimatedMinutes?: number;
    recurrence?: string;
    milestoneId?: number | null;
    goalId?: number | null;
  },
): Promise<PlannerTaskView> {
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(plannerTasks)
    .where(and(eq(plannerTasks.id, taskId), eq(plannerTasks.userId, userId)))
    .limit(1);
  if (!existing) throw new ApiError("NOT_FOUND", "Task not found.");

  const now = new Date();
  const nextStatus = patch.status ?? existing.status;
  const values: Partial<typeof plannerTasks.$inferInsert> = {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.scheduledFor !== undefined
      ? { scheduledFor: patch.scheduledFor ? new Date(patch.scheduledFor) : null }
      : {}),
    ...(patch.dueDate !== undefined
      ? { dueDate: patch.dueDate ? new Date(patch.dueDate) : null }
      : {}),
    ...(patch.estimatedMinutes !== undefined ? { estimatedMinutes: patch.estimatedMinutes } : {}),
    ...(patch.recurrence !== undefined ? { recurrence: patch.recurrence } : {}),
    ...(patch.milestoneId !== undefined ? { milestoneId: patch.milestoneId } : {}),
    ...(patch.goalId !== undefined ? { goalId: patch.goalId } : {}),
    ...(patch.status !== undefined
      ? {
          status: patch.status,
          completedAt: patch.status === "done" ? now : null,
        }
      : {}),
    updatedAt: now,
  };

  const [row] = await db
    .update(plannerTasks)
    .set(values)
    .where(and(eq(plannerTasks.id, taskId), eq(plannerTasks.userId, userId)))
    .returning();

  if (patch.status === "done" && existing.status !== "done") {
    await recordEvent({
      type: "task.completed",
      userId,
      payload: { taskId, title: row.title, minutes: row.estimatedMinutes },
    });

    // Recurring tasks get exactly one next occurrence — no silent backlog.
    if (row.recurrence === "daily" || row.recurrence === "weekly") {
      const base = row.scheduledFor ?? now;
      const next = addDays(base, row.recurrence === "daily" ? 1 : 7);
      await db.insert(plannerTasks).values({
        userId,
        title: row.title,
        notes: row.notes,
        priority: row.priority,
        status: "todo",
        scheduledFor: next,
        dueDate: row.dueDate ? addDays(row.dueDate, row.recurrence === "daily" ? 1 : 7) : null,
        estimatedMinutes: row.estimatedMinutes,
        recurrence: row.recurrence,
        milestoneId: row.milestoneId,
        goalId: row.goalId,
      });
    }

    if (row.goalId) await syncGoalCompletion(userId, row.goalId);
  }

  return taskView(row, null, null);
}

export async function deleteTask(userId: number, taskId: number): Promise<void> {
  const db = await getDb();
  const result = await db
    .delete(plannerTasks)
    .where(and(eq(plannerTasks.id, taskId), eq(plannerTasks.userId, userId)))
    .returning();
  if (result.length === 0) throw new ApiError("NOT_FOUND", "Task not found.");
}

/** Move every overdue, unfinished task to today. Explicit user action only. */
export async function rescheduleOverdueTasks(userId: number): Promise<{ moved: number }> {
  const db = await getDb();
  const now = new Date();
  const today = startOfDay(now);

  const overdue = await db
    .select({ id: plannerTasks.id })
    .from(plannerTasks)
    .where(
      and(
        eq(plannerTasks.userId, userId),
        ne(plannerTasks.status, "done"),
        lt(plannerTasks.scheduledFor, today),
      ),
    );

  if (overdue.length === 0) return { moved: 0 };

  await db
    .update(plannerTasks)
    .set({ scheduledFor: now, updatedAt: now })
    .where(inArray(plannerTasks.id, overdue.map((task) => task.id)));

  return { moved: overdue.length };
}

async function syncGoalCompletion(userId: number, goalId: number): Promise<void> {
  const db = await getDb();
  const tasks = await db
    .select({ status: plannerTasks.status })
    .from(plannerTasks)
    .where(and(eq(plannerTasks.userId, userId), eq(plannerTasks.goalId, goalId)));
  if (tasks.length > 0 && tasks.every((task) => task.status === "done")) {
    await db
      .update(plannerGoals)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(plannerGoals.id, goalId));
  }
}

export async function createGoal(
  userId: number,
  input: {
    title: string;
    description?: string | null;
    category?: string;
    targetDate?: string | null;
  },
): Promise<PlannerGoalView> {
  const db = await getDb();
  const [row] = await db
    .insert(plannerGoals)
    .values({
      userId,
      title: input.title,
      description: input.description ?? null,
      category: (input.category ?? "personal") as "career" | "learning" | "personal" | "finance" | "health" | "other",
      targetDate: input.targetDate ? new Date(input.targetDate) : null,
    })
    .returning();
  await recordEvent({ type: "goal.created", userId, payload: { goalId: row.id, title: row.title } });
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    targetDate: toISO(row.targetDate),
    status: row.status,
    taskCount: 0,
    doneCount: 0,
  };
}

export async function updateGoal(
  userId: number,
  goalId: number,
  patch: {
    title?: string;
    description?: string | null;
    category?: string;
    status?: "active" | "completed" | "archived";
    targetDate?: string | null;
  },
): Promise<PlannerGoalView> {
  const db = await getDb();
  const [row] = await db
    .update(plannerGoals)
    .set({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.category !== undefined
        ? {
            category: patch.category as
              | "career"
              | "learning"
              | "personal"
              | "finance"
              | "health"
              | "other",
          }
        : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.targetDate !== undefined
        ? { targetDate: patch.targetDate ? new Date(patch.targetDate) : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(plannerGoals.id, goalId), eq(plannerGoals.userId, userId)))
    .returning();
  if (!row) throw new ApiError("NOT_FOUND", "Goal not found.");

  const tasks = await db
    .select({ status: plannerTasks.status })
    .from(plannerTasks)
    .where(and(eq(plannerTasks.userId, userId), eq(plannerTasks.goalId, goalId)));

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    targetDate: toISO(row.targetDate),
    status: row.status,
    taskCount: tasks.length,
    doneCount: tasks.filter((task) => task.status === "done").length,
  };
}

export async function deleteGoal(userId: number, goalId: number): Promise<void> {
  const db = await getDb();
  const result = await db
    .delete(plannerGoals)
    .where(and(eq(plannerGoals.id, goalId), eq(plannerGoals.userId, userId)))
    .returning();
  if (result.length === 0) throw new ApiError("NOT_FOUND", "Goal not found.");
}

/**
 * A single day's capacity for generated tasks. Deliberately capped at 90 minutes:
 * a plan that asks for a three-hour evening is a plan that gets abandoned.
 */
export function dailyMinutesForWeeklyHours(weeklyHours: number): number {
  const hours = Math.min(40, Math.max(1, Number.isFinite(weeklyHours) ? weeklyHours : 5));
  return Math.min(90, Math.max(20, Math.round((hours * 60) / 5)));
}

function actionList(milestone: typeof roadmapMilestones.$inferSelect): {
  title: string;
  minutes: number;
}[] {
  const exercises = Array.isArray(milestone.exercises) ? (milestone.exercises as string[]) : [];
  const resources = Array.isArray(milestone.resources)
    ? (milestone.resources as { title: string; url?: string }[])
    : [];
  const actions: { title: string; minutes: number }[] = [
    { title: `Read the objective and plan “${milestone.title}”`, minutes: 20 },
  ];

  const realResource = resources.find((resource) => resource.url);
  if (realResource) {
    actions.push({ title: `Study: ${realResource.title}`, minutes: 45 });
  } else {
    actions.push({ title: `Study the core idea behind ${milestone.title}`, minutes: 45 });
  }

  exercises.slice(0, 3).forEach((exercise, index) => {
    actions.push({
      title: `Practice ${index + 1}: ${truncate(exercise, 150)}`,
      minutes: 45,
    });
  });

  actions.push({ title: `Self-check: completion criteria for “${milestone.title}”`, minutes: 20 });
  actions.push({ title: `Write an evidence note for “${milestone.title}”`, minutes: 20 });
  return actions;
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

/**
 * Convert a milestone into a realistic set of daily actions.
 *
 * The schedule never exceeds the user's stated weekly hours. We cap daily load
 * at 90 minutes, skip weekends only when the user has a light schedule, and stop
 * before producing an arbitrary pile of work.
 */
export async function generateTasksFromMilestone(
  userId: number,
  milestoneId: number,
  options: { startDate?: string; weeklyHours?: number } = {},
): Promise<{ created: number; scheduled: number; existing: number }> {
  const db = await getDb();
  const [row] = await db
    .select({ milestone: roadmapMilestones, roadmap: careerRoadmaps })
    .from(roadmapMilestones)
    .innerJoin(careerRoadmaps, eq(careerRoadmaps.id, roadmapMilestones.roadmapId))
    .where(eq(roadmapMilestones.id, milestoneId))
    .limit(1);

  if (!row || row.roadmap.userId !== userId) {
    throw new ApiError("NOT_FOUND", "Milestone not found.");
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const weeklyHours = Math.min(40, Math.max(1, options.weeklyHours ?? row.roadmap.hoursPerWeek ?? user?.weeklyHours ?? 5));
  const dailyMinutes = dailyMinutesForWeeklyHours(weeklyHours);

  const existing = await db
    .select({ title: plannerTasks.title })
    .from(plannerTasks)
    .where(
      and(
        eq(plannerTasks.userId, userId),
        eq(plannerTasks.milestoneId, milestoneId),
        ne(plannerTasks.status, "done"),
      ),
    );
  const existingTitles = new Set(existing.map((task) => task.title));

  const actions = actionList(row.milestone).filter((action) => !existingTitles.has(action.title));
  if (actions.length === 0) {
    return { created: 0, scheduled: 0, existing: existing.length };
  }

  const start = options.startDate ? startOfDay(new Date(options.startDate)) : startOfDay(new Date());
  // Work on the next day that still has capacity.
  let dayOffset = 0;
  let minutesToday = 0;
  let created = 0;
  const scheduledDates = new Set<string>();

  for (const action of actions) {
    let attempts = 0;
    while (minutesToday + action.minutes > dailyMinutes && attempts < 14) {
      dayOffset += 1;
      minutesToday = 0;
      attempts += 1;
    }
    const scheduledFor = addDays(start, dayOffset);
    scheduledFor.setHours(9 + Math.floor(minutesToday / 60), 0, 0, 0);
    minutesToday += action.minutes;

    await db.insert(plannerTasks).values({
      userId,
      milestoneId,
      title: action.title,
      priority: row.milestone.status === "completed" ? "low" : "medium",
      status: "todo",
      scheduledFor,
      dueDate: endOfDay(scheduledFor),
      estimatedMinutes: action.minutes,
      ordering: created,
    });
    created += 1;
    scheduledDates.add(scheduledFor.toDateString());
  }

  await db
    .update(roadmapMilestones)
    .set({ status: "in_progress", updatedAt: new Date() })
    .where(eq(roadmapMilestones.id, milestoneId));

  await recordEvent({
    type: "task.created",
    userId,
    payload: { milestoneId, count: created, weeklyHours },
  });

  return { created, scheduled: scheduledDates.size, existing: existing.length };
}
