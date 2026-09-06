import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(150)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, hyphen-separated.");

export const listSkillsQuerySchema = z.object({
  track: z.string().max(150).optional(),
  skillType: z.enum(["domain", "tool", "human", "ai_fluency"]).optional(),
});

export const createSkillSchema = z.object({
  name: z.string().min(1).max(150).trim(),
  slug: slugSchema,
  description: z.string().max(4000).optional(),
  whyEmployersWant: z.string().max(2000).optional(),
  categorySlug: z.string().max(100).optional(),
  skillType: z.enum(["domain", "tool", "human", "ai_fluency"]).default("domain"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  importance: z.enum(["essential", "important", "helpful"]).default("important"),
  marketRelevance: z.enum(["very_high", "high", "medium", "low"]).default("medium"),
  status: z.enum(["active", "disabled", "archived"]).default("active"),
});

export const updateSkillSchema = createSkillSchema
  .omit({ slug: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required.");

export const createTrackSchema = z.object({
  name: z.string().min(1).max(150).trim(),
  slug: slugSchema,
  description: z.string().max(4000).optional(),
  category: z.string().max(100).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  ordering: z.number().int().min(0).max(1000).optional(),
  difficultyLevels: z.array(z.enum(["beginner", "intermediate", "advanced"])).optional(),
});

export const updateTrackSchema = createTrackSchema
  .omit({ slug: true })
  .partial()
  .extend({ status: z.enum(["active", "inactive", "archived"]).optional() })
  .refine((v) => Object.keys(v).length > 0, "At least one field is required.");

export const linkSkillToTrackSchema = z.object({
  skillId: z.number().int().positive(),
  importance: z.enum(["essential", "important", "helpful"]).optional(),
  requiredLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  categoryLabel: z.string().max(100).optional(),
  ordering: z.number().int().min(0).max(1000).optional(),
});

export const createSubSkillSchema = z.object({
  name: z.string().min(1).max(150).trim(),
  slug: slugSchema,
  description: z.string().max(2000).optional(),
});

export const createCapabilitySchema = z.object({
  dimension: z.enum([
    "knowledge",
    "practical_capability",
    "real_world_task",
    "reasoning",
    "communication",
    "verification",
  ]),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(4000).optional(),
  definition: z.record(z.string(), z.unknown()).optional(),
});

export const createAssessmentSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(4000).optional(),
  skillSlugs: z.array(slugSchema).max(20).optional(),
  careerSlug: z.string().max(150).optional(),
  assessmentType: z
    .enum([
      "mcq",
      "short_answer",
      "coding",
      "data_analysis",
      "case_study",
      "simulation",
      "practical_task",
      "ai_evaluation",
      "oral_verification",
    ])
    .default("practical_task"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  scoringMethod: z
    .enum(["weighted_rubric", "deterministic", "ai_assisted", "human_review", "hybrid"])
    .default("weighted_rubric"),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  passingPolicy: z.record(z.string(), z.unknown()).optional(),
  antiCheatConfig: z.record(z.string(), z.boolean()).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export const updateAssessmentStatusSchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});
