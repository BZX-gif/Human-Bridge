import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  serial,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ─────────────────────────────────────────────────────────────────
export const skillLevelEnum = pgEnum("skill_level", [
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

export const verificationStatusEnum = pgEnum("verification_status", [
  "self_reported",
  "assessed",
  "project_verified",
  "employer_verified",
]);

export const demandLevelEnum = pgEnum("demand_level", [
  "very_high",
  "high",
  "medium",
  "low",
]);

export const workTypeEnum = pgEnum("work_type", [
  "remote",
  "hybrid",
  "onsite",
]);

export const assessmentTypeEnum = pgEnum("assessment_type", [
  "mcq",
  "scenario",
  "practical",
  "project",
  "written",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "active",
  "paused",
  "closed",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "reviewing",
  "shortlisted",
  "interviewing",
  "offered",
  "rejected",
  "withdrawn",
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
  learningResources: jsonb("learning_resources"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  totalJobs: integer("total_jobs").default(0),
  growthRate: varchar("growth_rate", { length: 50 }),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  careerPathway: jsonb("career_pathway"),
  typicalRequirements: jsonb("typical_requirements"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Career Skills ─────────────────────────────────────────────────────────
export const careerSkills = pgTable("career_skills", {
  id: serial("id").primaryKey(),
  careerId: integer("career_id")
    .references(() => careers.id)
    .notNull(),
  skillId: integer("skill_id")
    .references(() => skills.id)
    .notNull(),
  importance: skillImportanceEnum("importance").default("important"),
  categoryLabel: varchar("category_label", { length: 100 }),
  order: integer("order").default(0),
});

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
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Jobs ──────────────────────────────────────────────────────────────────
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  companyId: integer("company_id")
    .references(() => companies.id)
    .notNull(),
  careerId: integer("career_id").references(() => careers.id),
  description: text("description"),
  responsibilities: jsonb("responsibilities"),
  location: varchar("location", { length: 200 }),
  workType: workTypeEnum("work_type").default("hybrid"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: varchar("salary_currency", { length: 10 }).default("INR"),
  salaryUnit: varchar("salary_unit", { length: 20 }).default("LPA"),
  experienceMin: integer("experience_min").default(0),
  experienceMax: integer("experience_max"),
  status: jobStatusEnum("status").default("active"),
  postedAt: timestamp("posted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// ─── Job Skills ────────────────────────────────────────────────────────────
export const jobSkills = pgTable("job_skills", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .references(() => jobs.id)
    .notNull(),
  skillId: integer("skill_id")
    .references(() => skills.id)
    .notNull(),
  importance: skillImportanceEnum("importance").default("important"),
});

// ─── Users ─────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  avatarInitials: varchar("avatar_initials", { length: 5 }),
  avatarColor: varchar("avatar_color", { length: 20 }),
  goal: varchar("goal", { length: 100 }),
  educationBackground: text("education_background"),
  experienceSummary: text("experience_summary"),
  currentCareerId: integer("current_career_id").references(() => careers.id),
  targetCareerId: integer("target_career_id").references(() => careers.id),
  location: varchar("location", { length: 200 }),
  workPreference: workTypeEnum("work_preference"),
  salaryExpectationMin: integer("salary_expectation_min"),
  salaryExpectationMax: integer("salary_expectation_max"),
  onboardingComplete: boolean("onboarding_complete").default(false),
  publicProfileSlug: varchar("public_profile_slug", { length: 100 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── User Skills ───────────────────────────────────────────────────────────
export const userSkills = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  skillId: integer("skill_id")
    .references(() => skills.id)
    .notNull(),
  proficiency: integer("proficiency").default(0),
  verificationStatus: verificationStatusEnum("verification_status").default(
    "self_reported"
  ),
  lastAssessedAt: timestamp("last_assessed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Assessments ───────────────────────────────────────────────────────────
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  skillId: integer("skill_id").references(() => skills.id),
  careerId: integer("career_id").references(() => careers.id),
  type: assessmentTypeEnum("type").default("mcq"),
  description: text("description"),
  duration: integer("duration"),
  questions: jsonb("questions"),
  passingScore: integer("passing_score").default(70),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Assessment Results ────────────────────────────────────────────────────
export const assessmentResults = pgTable("assessment_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  assessmentId: integer("assessment_id")
    .references(() => assessments.id)
    .notNull(),
  score: integer("score").notNull(),
  answers: jsonb("answers"),
  feedback: text("feedback"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// ─── Projects ──────────────────────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  careerId: integer("career_id").references(() => careers.id),
  skills: jsonb("skills"),
  difficulty: varchar("difficulty", { length: 50 }),
  estimatedHours: integer("estimated_hours"),
  instructions: text("instructions"),
  deliverables: jsonb("deliverables"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── User Projects ─────────────────────────────────────────────────────────
export const userProjects = pgTable("user_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  projectId: integer("project_id").references(() => projects.id),
  title: varchar("title", { length: 200 }),
  description: text("description"),
  skills: jsonb("skills"),
  projectUrl: varchar("project_url", { length: 500 }),
  verified: boolean("verified").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Learning Resources ────────────────────────────────────────────────────
export const learningResources = pgTable("learning_resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  skillId: integer("skill_id").references(() => skills.id),
  careerId: integer("career_id").references(() => careers.id),
  type: varchar("type", { length: 50 }),
  provider: varchar("provider", { length: 100 }),
  url: varchar("url", { length: 500 }),
  duration: varchar("duration", { length: 50 }),
  level: skillLevelEnum("level").default("beginner"),
  free: boolean("free").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Learning Paths ────────────────────────────────────────────────────────
export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  careerId: integer("career_id").references(() => careers.id),
  title: varchar("title", { length: 200 }),
  weeks: jsonb("weeks"),
  currentWeek: integer("current_week").default(1),
  completedWeeks: jsonb("completed_weeks"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  targetDate: timestamp("target_date"),
});

// ─── Skill Passports ───────────────────────────────────────────────────────
export const skillPassports = pgTable("skill_passports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  careerId: integer("career_id").references(() => careers.id),
  careerReadiness: integer("career_readiness").default(0),
  verifiedSkills: jsonb("verified_skills"),
  completedProjects: jsonb("completed_projects"),
  assessmentResults: jsonb("assessment_results"),
  isPublic: boolean("is_public").default(true),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Applications ──────────────────────────────────────────────────────────
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  jobId: integer("job_id")
    .references(() => jobs.id)
    .notNull(),
  matchScore: integer("match_score"),
  status: applicationStatusEnum("status").default("applied"),
  coverNote: text("cover_note"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
