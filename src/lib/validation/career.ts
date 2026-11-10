import { z } from "zod";

const isoDate = z
  .string()
  .max(40)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date.");

const optionalDate = isoDate.nullable().optional();

export const roadmapCreateSchema = z.object({
  careerId: z.number().int().positive(),
  weeklyHours: z.number().int().min(1).max(40).optional(),
  startingLevel: z.enum(["beginner", "some_experience", "intermediate"]).optional(),
  regenerate: z.boolean().optional(),
});

export const milestoneUpdateSchema = z.object({
  status: z.enum(["not_started", "in_progress", "completed", "skipped"]),
});

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(240),
  notes: z.string().max(4000).nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  scheduledFor: optionalDate,
  dueDate: optionalDate,
  estimatedMinutes: z.number().int().min(5).max(480).optional(),
  recurrence: z.enum(["none", "daily", "weekly"]).optional(),
  milestoneId: z.number().int().positive().nullable().optional(),
  goalId: z.number().int().positive().nullable().optional(),
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  notes: z.string().max(4000).nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  scheduledFor: optionalDate,
  dueDate: optionalDate,
  estimatedMinutes: z.number().int().min(5).max(480).optional(),
  recurrence: z.enum(["none", "daily", "weekly"]).optional(),
  milestoneId: z.number().int().positive().nullable().optional(),
  goalId: z.number().int().positive().nullable().optional(),
});

export const goalCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(4000).nullable().optional(),
  category: z.enum(["career", "learning", "personal", "finance", "health", "other"]).optional(),
  targetDate: optionalDate,
});

export const goalUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(4000).nullable().optional(),
  category: z.enum(["career", "learning", "personal", "finance", "health", "other"]).optional(),
  status: z.enum(["active", "completed", "archived"]).optional(),
  targetDate: optionalDate,
});

export const generateTasksSchema = z.object({
  milestoneId: z.number().int().positive(),
  startDate: isoDate.optional(),
  weeklyHours: z.number().int().min(1).max(40).optional(),
});

export const projectCreateSchema = z
  .object({
    projectId: z.number().int().positive().optional(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(6000).nullable().optional(),
    skillSlugs: z.array(z.string().max(150)).max(12).optional(),
    projectUrl: z.string().url().max(500).nullable().optional(),
    repositoryUrl: z.string().url().max(500).nullable().optional(),
    status: z.enum(["planned", "in_progress", "completed"]).optional(),
  })
  .refine((value) => Boolean(value.projectId || value.title), {
    message: "Provide a project from the catalogue or a title.",
    path: ["title"],
  });

export const projectUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(6000).nullable().optional(),
  skillSlugs: z.array(z.string().max(150)).max(12).optional(),
  projectUrl: z.string().url().max(500).nullable().optional(),
  repositoryUrl: z.string().url().max(500).nullable().optional(),
  reflection: z.string().max(6000).nullable().optional(),
  status: z.enum(["planned", "in_progress", "completed"]).optional(),
  isPublic: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  headline: z.string().max(200).nullable().optional(),
  about: z.string().max(4000).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  links: z
    .array(z.object({ label: z.string().min(1).max(60), url: z.string().url().max(500) }))
    .max(6)
    .optional(),
  weeklyHours: z.number().int().min(1).max(40).optional(),
  currentLevel: z.enum(["beginner", "some_experience", "intermediate"]).optional(),
});

export const mentorMessageSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .max(20)
    .optional(),
});
