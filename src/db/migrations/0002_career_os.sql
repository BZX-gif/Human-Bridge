-- Career OS: roadmap, planner, learning state and portfolio extensions.
-- Additive and non-destructive: no existing column or row is removed.
CREATE TYPE roadmap_status AS ENUM ('active', 'archived', 'completed');--> statement-breakpoint
CREATE TYPE milestone_status AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');--> statement-breakpoint
CREATE TYPE planner_goal_category AS ENUM ('career', 'learning', 'personal', 'finance', 'health', 'other');--> statement-breakpoint
CREATE TYPE planner_goal_status AS ENUM ('active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE user_project_status AS ENUM ('planned', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE skill_learning_status AS ENUM ('exploring', 'learning', 'practising', 'comfortable');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "headline" varchar(200);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "about" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "links" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "weekly_hours" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "current_level" varchar(30) DEFAULT 'beginner' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_projects" ADD COLUMN IF NOT EXISTS "repository_url" varchar(500);--> statement-breakpoint
ALTER TABLE "user_projects" ADD COLUMN IF NOT EXISTS "reflection" text;--> statement-breakpoint
ALTER TABLE "user_projects" ADD COLUMN IF NOT EXISTS "status" user_project_status DEFAULT 'planned' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_projects" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_projects" ADD COLUMN IF NOT EXISTS "started_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_projects" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "career_roadmaps" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "career_id" integer NOT NULL REFERENCES "careers"("id") ON DELETE cascade,
  "title" varchar(200) NOT NULL,
  "summary" text,
  "starting_level" varchar(30) DEFAULT 'beginner' NOT NULL,
  "hours_per_week" integer DEFAULT 5 NOT NULL,
  "estimated_weeks" integer,
  "status" roadmap_status DEFAULT 'active' NOT NULL,
  "generated_by" varchar(20) DEFAULT 'template' NOT NULL,
  "ai_note" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "career_roadmaps_user_career_unique" ON "career_roadmaps" ("user_id","career_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "career_roadmaps_user_idx" ON "career_roadmaps" ("user_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_stages" (
  "id" serial PRIMARY KEY NOT NULL,
  "roadmap_id" integer NOT NULL REFERENCES "career_roadmaps"("id") ON DELETE cascade,
  "title" varchar(200) NOT NULL,
  "description" text,
  "ordering" integer DEFAULT 0 NOT NULL,
  "estimated_weeks" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roadmap_stages_roadmap_idx" ON "roadmap_stages" ("roadmap_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_milestones" (
  "id" serial PRIMARY KEY NOT NULL,
  "roadmap_id" integer NOT NULL REFERENCES "career_roadmaps"("id") ON DELETE cascade,
  "stage_id" integer NOT NULL REFERENCES "roadmap_stages"("id") ON DELETE cascade,
  "title" varchar(240) NOT NULL,
  "objective" text NOT NULL,
  "why_it_matters" text,
  "skill_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "resources" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "exercises" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "project_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "estimated_hours" integer DEFAULT 10 NOT NULL,
  "completion_criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "depends_on" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" milestone_status DEFAULT 'not_started' NOT NULL,
  "ordering" integer DEFAULT 0 NOT NULL,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roadmap_milestones_roadmap_idx" ON "roadmap_milestones" ("roadmap_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roadmap_milestones_stage_idx" ON "roadmap_milestones" ("stage_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "planner_goals" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "title" varchar(200) NOT NULL,
  "description" text,
  "category" planner_goal_category DEFAULT 'personal' NOT NULL,
  "target_date" timestamp,
  "status" planner_goal_status DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "planner_goals_user_idx" ON "planner_goals" ("user_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "planner_tasks" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "goal_id" integer REFERENCES "planner_goals"("id") ON DELETE set null,
  "milestone_id" integer REFERENCES "roadmap_milestones"("id") ON DELETE set null,
  "title" varchar(240) NOT NULL,
  "notes" text,
  "priority" task_priority DEFAULT 'medium' NOT NULL,
  "status" task_status DEFAULT 'todo' NOT NULL,
  "scheduled_for" timestamp,
  "due_date" timestamp,
  "estimated_minutes" integer DEFAULT 30 NOT NULL,
  "recurrence" varchar(20) DEFAULT 'none' NOT NULL,
  "completed_at" timestamp,
  "ordering" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "planner_tasks_user_idx" ON "planner_tasks" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "planner_tasks_schedule_idx" ON "planner_tasks" ("user_id","scheduled_for");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "planner_tasks_milestone_idx" ON "planner_tasks" ("milestone_id");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_skill_learning" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "skill_id" integer NOT NULL REFERENCES "skills"("id") ON DELETE cascade,
  "status" skill_learning_status DEFAULT 'exploring' NOT NULL,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_skill_learning_unique" ON "user_skill_learning" ("user_id","skill_id");
