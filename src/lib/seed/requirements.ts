import type { SkillLevel } from "@/lib/assessment/types";

/**
 * Structured skill requirements.
 *
 * The legacy demo data only recorded importance ("essential"/"important"). Real
 * matching needs a required LEVEL and SCORE per skill, so those are defined here
 * and merged into career_skills / job_skills during seeding.
 */
export interface LevelRequirement {
  requiredLevel: SkillLevel;
  requiredScore: number;
}

const LEVEL_DEFAULTS: Record<"essential" | "important" | "helpful", LevelRequirement> = {
  essential: { requiredLevel: "intermediate", requiredScore: 65 },
  important: { requiredLevel: "intermediate", requiredScore: 55 },
  helpful: { requiredLevel: "beginner", requiredScore: 35 },
};

/** Career-specific overrides, keyed `${careerSlug}:${skillSlug}`. */
const CAREER_OVERRIDES: Record<string, LevelRequirement> = {
  "data-analyst:sql": { requiredLevel: "advanced", requiredScore: 75 },
  "data-analyst:excel": { requiredLevel: "intermediate", requiredScore: 65 },
  "data-analyst:data-analysis": { requiredLevel: "advanced", requiredScore: 75 },
  "data-analyst:statistics": { requiredLevel: "intermediate", requiredScore: 55 },
  "data-analyst:power-bi": { requiredLevel: "intermediate", requiredScore: 55 },
  "data-analyst:tableau": { requiredLevel: "beginner", requiredScore: 35 },
  "data-analyst:python": { requiredLevel: "beginner", requiredScore: 35 },
  "data-analyst:communication": { requiredLevel: "intermediate", requiredScore: 60 },
  "data-analyst:problem-solving": { requiredLevel: "intermediate", requiredScore: 60 },
  "data-analyst:critical-thinking": { requiredLevel: "intermediate", requiredScore: 60 },
};

export function resolveCareerRequirement(
  careerSlug: string,
  skillSlug: string,
  importance: "essential" | "important" | "helpful",
): LevelRequirement {
  return CAREER_OVERRIDES[`${careerSlug}:${skillSlug}`] ?? LEVEL_DEFAULTS[importance];
}

/** Job-specific overrides, keyed `${jobTitleSlug}:${skillSlug}`. */
const JOB_OVERRIDES: Record<string, LevelRequirement> = {
  "junior-data-analyst:sql": { requiredLevel: "intermediate", requiredScore: 60 },
  "junior-data-analyst:excel": { requiredLevel: "intermediate", requiredScore: 60 },
  "junior-data-analyst:power-bi": { requiredLevel: "beginner", requiredScore: 40 },
  "junior-data-analyst:data-analysis": { requiredLevel: "intermediate", requiredScore: 60 },
  "senior-data-analyst:sql": { requiredLevel: "advanced", requiredScore: 82 },
  "senior-data-analyst:power-bi": { requiredLevel: "advanced", requiredScore: 75 },
  "senior-data-analyst:statistics": { requiredLevel: "intermediate", requiredScore: 65 },
  "senior-data-analyst:python": { requiredLevel: "intermediate", requiredScore: 60 },
};

export function resolveJobRequirement(
  jobSlug: string,
  skillSlug: string,
  importance: "essential" | "important" | "helpful",
): LevelRequirement {
  return JOB_OVERRIDES[`${jobSlug}:${skillSlug}`] ?? LEVEL_DEFAULTS[importance];
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);
}
