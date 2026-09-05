import { z } from "zod";

export const emailSchema = z.string().email().max(255).toLowerCase().trim();
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(200);

export const signupSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["candidate", "employer"]).default("candidate"),
  companyName: z.string().min(1).max(200).trim().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

export const onboardingSchema = z.object({
  goal: z.string().max(100).optional(),
  educationBackground: z.string().max(2000).optional(),
  experienceSummary: z.string().max(4000).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  targetCareerSlug: z.string().max(150).optional(),
  location: z.string().max(200).optional(),
  workPreference: z.enum(["remote", "hybrid", "onsite"]).optional(),
  /** Self-reported skills. Recorded as SELF_REPORTED evidence only. */
  selfReportedSkills: z
    .array(z.object({ slug: z.string().max(150), claimedLevel: z.string().max(50) }))
    .max(40)
    .optional(),
});

export const applySchema = z.object({
  jobId: z.number().int().positive(),
  coverNote: z.string().max(4000).optional(),
});

export const passportPrivacySchema = z.object({
  isPublic: z.boolean().optional(),
  employerVisible: z.boolean().optional(),
  visibility: z
    .object({
      skills: z.boolean().optional(),
      evidence: z.boolean().optional(),
      assessments: z.boolean().optional(),
      projects: z.boolean().optional(),
      contact: z.boolean().optional(),
    })
    .optional(),
});

const skillRequirementSchema = z.object({
  slug: z.string().min(1).max(150),
  importance: z.enum(["essential", "important", "helpful"]),
  requiredLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  requiredScore: z.number().int().min(0).max(100),
});

export const createJobSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(20_000).optional(),
  responsibilities: z.array(z.string().max(500)).max(30).optional(),
  location: z.string().max(200).optional(),
  workType: z.enum(["remote", "hybrid", "onsite"]).default("hybrid"),
  salaryMin: z.number().int().min(0).max(100_000_000).optional(),
  salaryMax: z.number().int().min(0).max(100_000_000).optional(),
  experienceMin: z.number().int().min(0).max(60).optional(),
  experienceMax: z.number().int().min(0).max(60).optional(),
  careerId: z.number().int().positive().optional(),
  requireHumanReview: z.boolean().optional(),
  status: z.enum(["draft", "active"]).default("active"),
  skills: z.array(skillRequirementSchema).min(1).max(30),
});

export const extractSkillsSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().min(20).max(20_000),
});

export const applicationStatusSchema = z.object({
  applicationId: z.number().int().positive(),
  status: z.enum(["reviewing", "shortlisted", "interviewing", "offered", "hired", "rejected"]),
  notes: z.string().max(4000).optional(),
});

export const copilotSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(30),
});

export const resumeAnalyzeSchema = z.object({
  text: z.string().min(50).max(60_000),
  targetCareerSlug: z.string().max(150).optional(),
});
