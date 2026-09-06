import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  serial,
  varchar,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ─────────────────────────────────────────────────────────────────
export const skillLevelEnum = pgEnum("skill_level", [
  "not_evaluated",
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);

export const skillImportanceEnum = pgEnum("skill_importance", [
  "essential",
  "important",
  "helpful",
]);

/** Evidence strength ladder. Order matters — later = stronger. */
export const verificationStatusEnum = pgEnum("verification_status", [
  "self_reported",
  "assessed",
  "project_verified",
  "employer_verified",
]);

export const confidenceEnum = pgEnum("confidence_level", ["low", "medium", "high"]);

export const demandLevelEnum = pgEnum("demand_level", [
  "very_high",
  "high",
  "medium",
  "low",
]);

export const workTypeEnum = pgEnum("work_type", ["remote", "hybrid", "onsite"]);

export const jobStatusEnum = pgEnum("job_status", ["draft", "active", "paused", "closed"]);

export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "reviewing",
  "shortlisted",
  "interviewing",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
]);

export const userRoleEnum = pgEnum("user_role", ["candidate", "employer", "admin"]);

// ─── Assessment enums ──────────────────────────────────────────────────────
export const sectionKindEnum = pgEnum("assessment_section_kind", [
  "knowledge",
  "investigation",
  "practical",
  "reasoning",
  "defense",
]);

export const itemTypeEnum = pgEnum("assessment_item_type", [
  "mcq",
  "multi_select",
  "short_answer",
  "numeric",
  "sql",
  "long_form",
  "file_upload",
]);

export const attemptStatusEnum = pgEnum("assessment_attempt_status", [
  "not_started",
  "in_progress",
  "submitted",
  "evaluating",
  "defense",
  "completed",
  "passed",
  "failed",
  "expired",
]);

export const integrityStatusEnum = pgEnum("integrity_status", ["normal", "review", "flagged"]);

export const evaluatorTypeEnum = pgEnum("evaluator_type", [
  "deterministic",
  "ai",
  "human",
  "hybrid",
]);

export const evaluationStatusEnum = pgEnum("evaluation_status", [
  "pending",
  "completed",
  "unavailable",
  "failed",
]);

export const evidenceSourceEnum = pgEnum("evidence_source", [
  "SELF_REPORTED",
  "ASSESSED",
  "PROJECT_VERIFIED",
  "EMPLOYER_VERIFIED",
]);

export const blueprintStatusEnum = pgEnum("blueprint_status", [
  "draft",
  "published",
  "archived",
]);

// ─── Skills taxonomy enums ──────────────────────────────────────────────────
export const trackStatusEnum = pgEnum("track_status", ["active", "inactive", "archived"]);

export const skillStatusEnum = pgEnum("skill_status", ["active", "disabled", "archived"]);

/** High-level classification used across the taxonomy (AI Fluency is cross-functional). */
export const skillTypeEnum = pgEnum("skill_type", [
  "domain",
  "tool",
  "human",
  "ai_fluency",
]);

/** Entry difficulty of a skill as taxonomy metadata (not a measured level). */
export const skillDifficultyEnum = pgEnum("skill_difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);

/** Real-world capability dimensions every important skill is mapped to. */
export const capabilityDimensionEnum = pgEnum("capability_dimension", [
  "knowledge",
  "practical_capability",
  "real_world_task",
  "reasoning",
  "communication",
  "verification",
]);

/** Assessment shapes the engine must be able to host. */
export const assessmentTypeEnum = pgEnum("assessment_type", [
  "mcq",
  "short_answer",
  "coding",
  "data_analysis",
  "case_study",
  "simulation",
  "practical_task",
  "ai_evaluation",
  "oral_verification",
]);

/** How an assessment's scores are produced. Weighted rubrics live in DB, not components. */
export const scoringMethodEnum = pgEnum("scoring_method", [
  "weighted_rubric",
  "deterministic",
  "ai_assisted",
  "human_review",
  "hybrid",
]);

// ─── Skill Categories ──────────────────────────────────────────────────────
export const skillCategories = pgTable("skill_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Skills ────────────────────────────────────────────────────────────────
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  description: text("description"),
  categoryId: integer("category_id").references(() => skillCategories.id),
  whyEmployersWant: text("why_employers_want"),
  /** Taxonomy metadata — classification, entry difficulty and market signal. */
  skillType: skillTypeEnum("skill_type").default("domain").notNull(),
  difficulty: skillDifficultyEnum("difficulty").default("beginner").notNull(),
  importance: skillImportanceEnum("importance").default("important").notNull(),
  marketRelevance: demandLevelEnum("market_relevance").default("medium").notNull(),
  status: skillStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Sub-skills ─────────────────────────────────────────────────────────────
/** A skill can be decomposed into measurable sub-skills (e.g. SQL → JOINs). */
export const subSkills = pgTable(
  "sub_skills",
  {
    id: serial("id").primaryKey(),
    skillId: integer("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull(),
    description: text("description"),
    ordering: integer("ordering").default(0).notNull(),
    status: skillStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("sub_skills_skill_slug_unique").on(t.skillId, t.slug),
    index("sub_skills_skill_idx").on(t.skillId),
  ],
);

// ─── Skill Capabilities (real-world capability model) ──────────────────────
/**
 * Every important skill is described across six dimensions — knowledge,
 * practical capability, real-world task, reasoning, communication and
 * verification. Assessment definitions can hang off these via `definition`.
 */
export const skillCapabilities = pgTable(
  "skill_capabilities",
  {
    id: serial("id").primaryKey(),
    skillId: integer("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    dimension: capabilityDimensionEnum("dimension").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    /** Structured task/assessment definition (prompt, deliverable, criteria). */
    definition: jsonb("definition"),
    ordering: integer("ordering").default(0).notNull(),
    status: skillStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("skill_capability_skill_dimension_unique").on(t.skillId, t.dimension),
    index("skill_capability_skill_idx").on(t.skillId),
  ],
);

// ─── Career Tracks (taxonomy) ───────────────────────────────────────────────
/**
 * Career tracks are the taxonomy's top-level grouping (Software Engineering,
 * Data Analytics, …). Roles in `careers` belong to a track via `careers.trackId`
 * and skills belong to many tracks via `track_skills` — this is what lets the
 * AI Fluency layer be attached to more than one track.
 */
export const careerTracks = pgTable(
  "career_tracks",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull().unique(),
    description: text("description"),
    /** Taxonomy grouping, e.g. "Technology", "Data & AI", "Business". */
    category: varchar("category", { length: 100 }),
    /** Difficulty ladder shown on the track page (beginner → advanced). */
    difficultyLevels: jsonb("difficulty_levels")
      .$type<("beginner" | "intermediate" | "advanced")[]>()
      .default(["beginner", "intermediate", "advanced"])
      .notNull(),
    status: trackStatusEnum("status").default("active").notNull(),
    ordering: integer("ordering").default(0).notNull(),
    icon: varchar("icon", { length: 50 }),
    color: varchar("color", { length: 20 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("career_tracks_category_idx").on(t.category)],
);

// ─── Track Skills (many-to-many) ────────────────────────────────────────────
export const trackSkills = pgTable(
  "track_skills",
  {
    id: serial("id").primaryKey(),
    trackId: integer("track_id")
      .references(() => careerTracks.id, { onDelete: "cascade" })
      .notNull(),
    skillId: integer("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    importance: skillImportanceEnum("importance").default("important").notNull(),
    /** The level at which the skill is considered job-ready for this track. */
    requiredLevel: skillLevelEnum("required_level").default("intermediate").notNull(),
    categoryLabel: varchar("category_label", { length: 100 }),
    ordering: integer("ordering").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("track_skills_unique").on(t.trackId, t.skillId),
    index("track_skills_skill_idx").on(t.skillId),
  ],
);

// ─── Careers ───────────────────────────────────────────────────────────────
export const careers = pgTable("careers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  tagline: varchar("tagline", { length: 255 }),
  description: text("description"),
  whatThisRoleDoes: text("what_this_role_does"),
  demandLevel: demandLevelEnum("demand_level").default("high"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: varchar("salary_currency", { length: 10 }).default("INR"),
  salaryUnit: varchar("salary_unit", { length: 20 }).default("LPA"),
  experienceLevel: varchar("experience_level", { length: 100 }),
  growthRate: varchar("growth_rate", { length: 50 }),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  careerPathway: jsonb("career_pathway"),
  typicalRequirements: jsonb("typical_requirements"),
  typicalTasks: jsonb("typical_tasks"),
  /** The taxonomy track this role belongs to (e.g. data-analyst → data-analytics). */
  trackId: integer("track_id").references(() => careerTracks.id),
  isDemo: boolean("is_demo").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [index("careers_track_idx").on(t.trackId)]);

// ─── Career Skills ─────────────────────────────────────────────────────────
export const careerSkills = pgTable(
  "career_skills",
  {
    id: serial("id").primaryKey(),
    careerId: integer("career_id")
      .references(() => careers.id, { onDelete: "cascade" })
      .notNull(),
    skillId: integer("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    importance: skillImportanceEnum("importance").default("important").notNull(),
    requiredLevel: skillLevelEnum("required_level").default("intermediate").notNull(),
    requiredScore: integer("required_score").default(60).notNull(),
    categoryLabel: varchar("category_label", { length: 100 }),
    order: integer("order").default(0).notNull(),
  },
  (t) => [uniqueIndex("career_skills_unique").on(t.careerId, t.skillId)],
);

// ─── Companies ─────────────────────────────────────────────────────────────
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  industry: varchar("industry", { length: 100 }),
  size: varchar("size", { length: 50 }),
  location: varchar("location", { length: 200 }),
  website: varchar("website", { length: 255 }),
  logoInitials: varchar("logo_initials", { length: 5 }),
  logoColor: varchar("logo_color", { length: 20 }),
  verified: boolean("verified").default(false).notNull(),
  isDemo: boolean("is_demo").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Users ─────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").default("candidate").notNull(),
  companyId: integer("company_id").references(() => companies.id),
  avatarInitials: varchar("avatar_initials", { length: 5 }),
  avatarColor: varchar("avatar_color", { length: 20 }),
  goal: varchar("goal", { length: 100 }),
  educationBackground: text("education_background"),
  experienceSummary: text("experience_summary"),
  experienceYears: integer("experience_years").default(0),
  targetCareerId: integer("target_career_id").references(() => careers.id),
  location: varchar("location", { length: 200 }),
  workPreference: workTypeEnum("work_preference"),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  isDemo: boolean("is_demo").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

// ─── Jobs ──────────────────────────────────────────────────────────────────
export const jobs = pgTable(
  "jobs",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }).notNull(),
    companyId: integer("company_id")
      .references(() => companies.id)
      .notNull(),
    careerId: integer("career_id").references(() => careers.id),
    createdByUserId: integer("created_by_user_id").references(() => users.id),
    description: text("description"),
    responsibilities: jsonb("responsibilities"),
    location: varchar("location", { length: 200 }),
    workType: workTypeEnum("work_type").default("hybrid").notNull(),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: varchar("salary_currency", { length: 10 }).default("INR"),
    salaryUnit: varchar("salary_unit", { length: 20 }).default("LPA"),
    experienceMin: integer("experience_min").default(0),
    experienceMax: integer("experience_max"),
    requireHumanReview: boolean("require_human_review").default(false).notNull(),
    status: jobStatusEnum("status").default("active").notNull(),
    isDemo: boolean("is_demo").default(true).notNull(),
    postedAt: timestamp("posted_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
  },
  (t) => [index("jobs_company_idx").on(t.companyId), index("jobs_career_idx").on(t.careerId)],
);

// ─── Job Skills ────────────────────────────────────────────────────────────
export const jobSkills = pgTable(
  "job_skills",
  {
    id: serial("id").primaryKey(),
    jobId: integer("job_id")
      .references(() => jobs.id, { onDelete: "cascade" })
      .notNull(),
    skillId: integer("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    importance: skillImportanceEnum("importance").default("important").notNull(),
    requiredLevel: skillLevelEnum("required_level").default("intermediate").notNull(),
    requiredScore: integer("required_score").default(60).notNull(),
  },
  (t) => [uniqueIndex("job_skills_unique").on(t.jobId, t.skillId)],
);

// ─── Assessment blueprints ─────────────────────────────────────────────────
export const assessmentBlueprints = pgTable(
  "assessment_blueprints",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 150 }).notNull(),
    version: integer("version").default(1).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    summary: text("summary"),
    targetRole: varchar("target_role", { length: 150 }),
    careerId: integer("career_id").references(() => careers.id),
    /** Primary skill measured by this assessment (an assessment may test more). */
    skillId: integer("skill_id").references(() => skills.id),
    jobId: integer("job_id").references(() => jobs.id),
    createdByUserId: integer("created_by_user_id").references(() => users.id),
    durationMinutes: integer("duration_minutes").default(120).notNull(),
    /** Passing policy is data-driven — see lib/assessment/types PassingPolicy */
    passingPolicy: jsonb("passing_policy").notNull(),
    assessmentType: assessmentTypeEnum("assessment_type").default("practical_task").notNull(),
    difficulty: skillDifficultyEnum("difficulty").default("intermediate").notNull(),
    scoringMethod: scoringMethodEnum("scoring_method").default("weighted_rubric").notNull(),
    /**
     * Anti-cheating / AI-resistant design configuration. Flags are assessment
     * metadata — the engine and item generators read them; nothing here is
     * hardcoded in components.
     */
    antiCheatConfig: jsonb("anti_cheat_config")
      .$type<AntiCheatConfig>()
      .default({})
      .notNull(),
    toolsAllowed: jsonb("tools_allowed"),
    aiPolicy: text("ai_policy"),
    requireHumanReview: boolean("require_human_review").default(false).notNull(),
    status: blueprintStatusEnum("status").default("published").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("blueprint_slug_version_unique").on(t.slug, t.version),
    index("blueprint_skill_idx").on(t.skillId),
  ],
);

/** Flags describing how this assessment resists AI/cheating. Stored in DB. */
export interface AntiCheatConfig {
  randomizedQuestions?: boolean;
  randomizedDataset?: boolean;
  randomizedScenario?: boolean;
  uniqueTaskParameters?: boolean;
  timeLimit?: boolean;
  practicalTasks?: boolean;
  changingScenario?: boolean;
  followUpQuestions?: boolean;
  reasoningProcessEvidence?: boolean;
  hiddenTestCases?: boolean;
  aiOutputVerificationTasks?: boolean;
  liveVerification?: boolean;
}

/** Normalised assessment → skill relationship (skillSlugs on items stay for back-compat). */
export const assessmentBlueprintSkills = pgTable(
  "assessment_blueprint_skills",
  {
    id: serial("id").primaryKey(),
    blueprintId: integer("blueprint_id")
      .references(() => assessmentBlueprints.id, { onDelete: "cascade" })
      .notNull(),
    skillId: integer("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    /** Relative weight of this skill within the assessment. */
    weight: integer("weight").default(100).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("blueprint_skill_unique").on(t.blueprintId, t.skillId),
    index("blueprint_skill_skill_idx").on(t.skillId),
  ],
);

export const assessmentRubrics = pgTable(
  "assessment_rubrics",
  {
    id: serial("id").primaryKey(),
    blueprintId: integer("blueprint_id")
      .references(() => assessmentBlueprints.id, { onDelete: "cascade" })
      .notNull(),
    key: varchar("key", { length: 100 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    /** criteria: [{ key, label, weight, skillSlug, guidance }] */
    criteria: jsonb("criteria").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("rubric_blueprint_key_unique").on(t.blueprintId, t.key)],
);

export const assessmentSections = pgTable(
  "assessment_sections",
  {
    id: serial("id").primaryKey(),
    blueprintId: integer("blueprint_id")
      .references(() => assessmentBlueprints.id, { onDelete: "cascade" })
      .notNull(),
    key: varchar("key", { length: 100 }).notNull(),
    kind: sectionKindEnum("kind").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    instructions: text("instructions"),
    /** Section weight as a percentage of the overall assessment. */
    weight: integer("weight").notNull(),
    order: integer("order").default(0).notNull(),
    timeLimitMinutes: integer("time_limit_minutes"),
    rubricId: integer("rubric_id").references(() => assessmentRubrics.id),
    config: jsonb("config"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("section_blueprint_key_unique").on(t.blueprintId, t.key)],
);

export const assessmentItems = pgTable(
  "assessment_items",
  {
    id: serial("id").primaryKey(),
    sectionId: integer("section_id")
      .references(() => assessmentSections.id, { onDelete: "cascade" })
      .notNull(),
    key: varchar("key", { length: 100 }).notNull(),
    type: itemTypeEnum("type").notNull(),
    prompt: text("prompt").notNull(),
    helperText: text("helper_text"),
    /** Public payload sent to the browser (options, placeholders, dataset refs). */
    payload: jsonb("payload"),
    /** NEVER sent to the browser. Answer keys / expected findings. */
    answerKey: jsonb("answer_key"),
    skillSlugs: jsonb("skill_slugs").notNull(),
    points: integer("points").default(1).notNull(),
    difficulty: varchar("difficulty", { length: 20 }).default("intermediate").notNull(),
    order: integer("order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("item_section_key_unique").on(t.sectionId, t.key)],
);

// ─── Attempts ──────────────────────────────────────────────────────────────
export const assessmentAttempts = pgTable(
  "assessment_attempts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    blueprintId: integer("blueprint_id")
      .references(() => assessmentBlueprints.id)
      .notNull(),
    /** The exact blueprint version used — results stay bound to it forever. */
    blueprintVersion: integer("blueprint_version").notNull(),
    jobId: integer("job_id").references(() => jobs.id),
    attemptNumber: integer("attempt_number").default(1).notNull(),
    status: attemptStatusEnum("status").default("in_progress").notNull(),
    currentSectionKey: varchar("current_section_key", { length: 100 }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    submittedAt: timestamp("submitted_at"),
    completedAt: timestamp("completed_at"),
    expiresAt: timestamp("expires_at"),
    timeSpentSeconds: integer("time_spent_seconds").default(0).notNull(),
    overallScore: integer("overall_score"),
    readinessScore: integer("readiness_score"),
    passed: boolean("passed"),
    resultSummary: jsonb("result_summary"),
    integrityStatus: integrityStatusEnum("integrity_status").default("normal").notNull(),
    integritySignals: jsonb("integrity_signals"),
    evaluatorType: evaluatorTypeEnum("evaluator_type"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("attempt_user_blueprint_number_unique").on(
      t.userId,
      t.blueprintId,
      t.attemptNumber,
    ),
    index("attempt_user_idx").on(t.userId),
  ],
);

export const assessmentResponses = pgTable(
  "assessment_responses",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id")
      .references(() => assessmentAttempts.id, { onDelete: "cascade" })
      .notNull(),
    itemId: integer("item_id")
      .references(() => assessmentItems.id, { onDelete: "cascade" })
      .notNull(),
    response: jsonb("response"),
    autoScore: integer("auto_score"),
    maxScore: integer("max_score"),
    isCorrect: boolean("is_correct"),
    timeSpentSeconds: integer("time_spent_seconds").default(0).notNull(),
    revisions: integer("revisions").default(0).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("response_attempt_item_unique").on(t.attemptId, t.itemId)],
);

export const assessmentSubmissions = pgTable(
  "assessment_submissions",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id")
      .references(() => assessmentAttempts.id, { onDelete: "cascade" })
      .notNull(),
    sectionId: integer("section_id")
      .references(() => assessmentSections.id, { onDelete: "cascade" })
      .notNull(),
    content: jsonb("content"),
    files: jsonb("files"),
    aiUsage: jsonb("ai_usage"),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("submission_attempt_section_unique").on(t.attemptId, t.sectionId)],
);

export const assessmentEvaluations = pgTable(
  "assessment_evaluations",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id")
      .references(() => assessmentAttempts.id, { onDelete: "cascade" })
      .notNull(),
    sectionId: integer("section_id").references(() => assessmentSections.id, {
      onDelete: "cascade",
    }),
    evaluatorType: evaluatorTypeEnum("evaluator_type").notNull(),
    provider: varchar("provider", { length: 60 }),
    model: varchar("model", { length: 100 }),
    status: evaluationStatusEnum("status").default("pending").notNull(),
    score: integer("score"),
    confidence: confidenceEnum("confidence"),
    rubricScores: jsonb("rubric_scores"),
    skillScores: jsonb("skill_scores"),
    evidence: jsonb("evidence"),
    gaps: jsonb("gaps"),
    feedback: text("feedback"),
    unavailableReason: text("unavailable_reason"),
    raw: jsonb("raw"),
    humanReviewRequired: boolean("human_review_required").default(false).notNull(),
    reviewedByUserId: integer("reviewed_by_user_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("evaluation_attempt_idx").on(t.attemptId)],
);

export const assessmentRubricScores = pgTable("assessment_rubric_scores", {
  id: serial("id").primaryKey(),
  evaluationId: integer("evaluation_id")
    .references(() => assessmentEvaluations.id, { onDelete: "cascade" })
    .notNull(),
  rubricId: integer("rubric_id").references(() => assessmentRubrics.id),
  criterionKey: varchar("criterion_key", { length: 100 }).notNull(),
  label: varchar("label", { length: 200 }),
  score: integer("score").notNull(),
  weight: integer("weight").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assessmentDefenseQuestions = pgTable("assessment_defense_questions", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id")
    .references(() => assessmentAttempts.id, { onDelete: "cascade" })
    .notNull(),
  question: text("question").notNull(),
  rationale: text("rationale"),
  sourceExcerpt: text("source_excerpt"),
  targetSkillSlug: varchar("target_skill_slug", { length: 150 }),
  expectedPoints: jsonb("expected_points"),
  generatedBy: evaluatorTypeEnum("generated_by").default("deterministic").notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const assessmentDefenseResponses = pgTable(
  "assessment_defense_responses",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id")
      .references(() => assessmentDefenseQuestions.id, { onDelete: "cascade" })
      .notNull(),
    attemptId: integer("attempt_id")
      .references(() => assessmentAttempts.id, { onDelete: "cascade" })
      .notNull(),
    answer: text("answer").notNull(),
    score: integer("score"),
    evaluation: jsonb("evaluation"),
    evaluatorType: evaluatorTypeEnum("evaluator_type"),
    timeSpentSeconds: integer("time_spent_seconds").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("defense_response_question_unique").on(t.questionId)],
);

// ─── Evidence + skill scores ───────────────────────────────────────────────
export const skillEvidence = pgTable(
  "skill_evidence",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    skillId: integer("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    source: evidenceSourceEnum("source").notNull(),
    label: varchar("label", { length: 200 }).notNull(),
    detail: text("detail"),
    score: integer("score"),
    weight: integer("weight").default(100).notNull(),
    attemptId: integer("attempt_id").references(() => assessmentAttempts.id, {
      onDelete: "cascade",
    }),
    projectId: integer("project_id"),
    jobId: integer("job_id").references(() => jobs.id),
    verifiedByUserId: integer("verified_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("evidence_user_skill_idx").on(t.userId, t.skillId)],
);

export const skillScores = pgTable(
  "skill_scores",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    skillId: integer("skill_id")
      .references(() => skills.id, { onDelete: "cascade" })
      .notNull(),
    score: integer("score").default(0).notNull(),
    level: skillLevelEnum("level").default("not_evaluated").notNull(),
    confidence: confidenceEnum("confidence").default("low").notNull(),
    evidenceCount: integer("evidence_count").default(0).notNull(),
    /** Number of assessed (non-self-reported) evidence pieces on record. */
    assessmentCount: integer("assessment_count").default(0).notNull(),
    verificationStatus: verificationStatusEnum("verification_status")
      .default("self_reported")
      .notNull(),
    breakdown: jsonb("breakdown"),
    lastVerifiedAt: timestamp("last_verified_at"),
    lastAssessedAt: timestamp("last_assessed_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("skill_scores_user_skill_unique").on(t.userId, t.skillId),
    index("skill_scores_user_idx").on(t.userId),
    index("skill_scores_skill_idx").on(t.skillId),
  ],
);

// ─── Multi-dimensional score dimensions ────────────────────────────────────
/**
 * Scoring is never one number. An attempt can be broken into dimensions
 * (technical knowledge, practical execution, problem solving, data accuracy,
 * business reasoning, AI verification, communication) with their own weights.
 * Weights live here — not in components.
 */
export const scoreDimensions = pgTable(
  "score_dimensions",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id")
      .references(() => assessmentAttempts.id, { onDelete: "cascade" })
      .notNull(),
    key: varchar("key", { length: 100 }).notNull(),
    label: varchar("label", { length: 200 }).notNull(),
    score: integer("score").notNull(),
    weight: integer("weight").default(100).notNull(),
    /** Where the dimension came from: section, rubric or skill. */
    source: varchar("source", { length: 60 }).default("assessment").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("score_dimensions_attempt_key_unique").on(t.attemptId, t.key),
    index("score_dimensions_attempt_idx").on(t.attemptId),
  ],
);

// ─── Projects ──────────────────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  careerId: integer("career_id").references(() => careers.id),
  skillSlugs: jsonb("skill_slugs"),
  difficulty: varchar("difficulty", { length: 50 }),
  estimatedHours: integer("estimated_hours"),
  instructions: text("instructions"),
  deliverables: jsonb("deliverables"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProjects = pgTable("user_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: integer("project_id").references(() => projects.id),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  skillSlugs: jsonb("skill_slugs"),
  projectUrl: varchar("project_url", { length: 500 }),
  verified: boolean("verified").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Learning ──────────────────────────────────────────────────────────────
export const learningResources = pgTable("learning_resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  skillId: integer("skill_id").references(() => skills.id),
  careerId: integer("career_id").references(() => careers.id),
  type: varchar("type", { length: 50 }),
  provider: varchar("provider", { length: 100 }),
  url: varchar("url", { length: 500 }),
  duration: varchar("duration", { length: 50 }),
  level: skillLevelEnum("level").default("beginner").notNull(),
  free: boolean("free").default(true).notNull(),
  description: text("description"),
  isDemo: boolean("is_demo").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Skill Passport ────────────────────────────────────────────────────────
export const skillPassports = pgTable("skill_passports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  publicId: varchar("public_id", { length: 40 }).notNull().unique(),
  careerId: integer("career_id").references(() => careers.id),
  readiness: integer("readiness").default(0).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  /** visibility: { skills, evidence, assessments, projects, contact } */
  visibility: jsonb("visibility"),
  employerVisible: boolean("employer_visible").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Applications ──────────────────────────────────────────────────────────
export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    jobId: integer("job_id")
      .references(() => jobs.id, { onDelete: "cascade" })
      .notNull(),
    matchScore: integer("match_score"),
    matchExplanation: jsonb("match_explanation"),
    status: applicationStatusEnum("status").default("applied").notNull(),
    coverNote: text("cover_note"),
    employerNotes: text("employer_notes"),
    appliedAt: timestamp("applied_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("application_user_job_unique").on(t.userId, t.jobId)],
);

/** Employment outcome feedback loop (assessment validity over time). */
export const employmentOutcomes = pgTable("employment_outcomes", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => applications.id, {
    onDelete: "cascade",
  }),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  jobId: integer("job_id").references(() => jobs.id),
  hiredAt: timestamp("hired_at"),
  performanceRating: integer("performance_rating"),
  employerFeedback: text("employer_feedback"),
  skillFeedback: jsonb("skill_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Domain events ─────────────────────────────────────────────────────────
export const domainEvents = pgTable(
  "domain_events",
  {
    id: serial("id").primaryKey(),
    type: varchar("type", { length: 80 }).notNull(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    attemptId: integer("attempt_id").references(() => assessmentAttempts.id, {
      onDelete: "cascade",
    }),
    jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("domain_events_type_idx").on(t.type)],
);
