CREATE TYPE "public"."application_status" AS ENUM('applied', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."assessment_attempt_status" AS ENUM('not_started', 'in_progress', 'submitted', 'evaluating', 'defense', 'completed', 'passed', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."blueprint_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."confidence_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."demand_level" AS ENUM('very_high', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."evaluation_status" AS ENUM('pending', 'completed', 'unavailable', 'failed');--> statement-breakpoint
CREATE TYPE "public"."evaluator_type" AS ENUM('deterministic', 'ai', 'human', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."evidence_source" AS ENUM('SELF_REPORTED', 'ASSESSED', 'PROJECT_VERIFIED', 'EMPLOYER_VERIFIED');--> statement-breakpoint
CREATE TYPE "public"."integrity_status" AS ENUM('normal', 'review', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."assessment_item_type" AS ENUM('mcq', 'multi_select', 'short_answer', 'numeric', 'sql', 'long_form', 'file_upload');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'active', 'paused', 'closed');--> statement-breakpoint
CREATE TYPE "public"."assessment_section_kind" AS ENUM('knowledge', 'investigation', 'practical', 'reasoning', 'defense');--> statement-breakpoint
CREATE TYPE "public"."skill_importance" AS ENUM('essential', 'important', 'helpful');--> statement-breakpoint
CREATE TYPE "public"."skill_level" AS ENUM('not_evaluated', 'beginner', 'intermediate', 'advanced', 'expert');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('candidate', 'employer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('self_reported', 'assessed', 'project_verified', 'employer_verified');--> statement-breakpoint
CREATE TYPE "public"."work_type" AS ENUM('remote', 'hybrid', 'onsite');--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"match_score" integer,
	"match_explanation" jsonb,
	"status" "application_status" DEFAULT 'applied' NOT NULL,
	"cover_note" text,
	"employer_notes" text,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"blueprint_id" integer NOT NULL,
	"blueprint_version" integer NOT NULL,
	"job_id" integer,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"status" "assessment_attempt_status" DEFAULT 'in_progress' NOT NULL,
	"current_section_key" varchar(100),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"overall_score" integer,
	"readiness_score" integer,
	"passed" boolean,
	"result_summary" jsonb,
	"integrity_status" "integrity_status" DEFAULT 'normal' NOT NULL,
	"integrity_signals" jsonb,
	"evaluator_type" "evaluator_type",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_blueprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(150) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"title" varchar(200) NOT NULL,
	"summary" text,
	"target_role" varchar(150),
	"career_id" integer,
	"job_id" integer,
	"created_by_user_id" integer,
	"duration_minutes" integer DEFAULT 120 NOT NULL,
	"passing_policy" jsonb NOT NULL,
	"tools_allowed" jsonb,
	"ai_policy" text,
	"require_human_review" boolean DEFAULT false NOT NULL,
	"status" "blueprint_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_defense_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question" text NOT NULL,
	"rationale" text,
	"source_excerpt" text,
	"target_skill_slug" varchar(150),
	"expected_points" jsonb,
	"generated_by" "evaluator_type" DEFAULT 'deterministic' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_defense_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"attempt_id" integer NOT NULL,
	"answer" text NOT NULL,
	"score" integer,
	"evaluation" jsonb,
	"evaluator_type" "evaluator_type",
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"section_id" integer,
	"evaluator_type" "evaluator_type" NOT NULL,
	"provider" varchar(60),
	"model" varchar(100),
	"status" "evaluation_status" DEFAULT 'pending' NOT NULL,
	"score" integer,
	"confidence" "confidence_level",
	"rubric_scores" jsonb,
	"skill_scores" jsonb,
	"evidence" jsonb,
	"gaps" jsonb,
	"feedback" text,
	"unavailable_reason" text,
	"raw" jsonb,
	"human_review_required" boolean DEFAULT false NOT NULL,
	"reviewed_by_user_id" integer,
	"reviewed_at" timestamp,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"key" varchar(100) NOT NULL,
	"type" "assessment_item_type" NOT NULL,
	"prompt" text NOT NULL,
	"helper_text" text,
	"payload" jsonb,
	"answer_key" jsonb,
	"skill_slugs" jsonb NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"difficulty" varchar(20) DEFAULT 'intermediate' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"response" jsonb,
	"auto_score" integer,
	"max_score" integer,
	"is_correct" boolean,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"revisions" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_rubric_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"evaluation_id" integer NOT NULL,
	"rubric_id" integer,
	"criterion_key" varchar(100) NOT NULL,
	"label" varchar(200),
	"score" integer NOT NULL,
	"weight" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_rubrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"blueprint_id" integer NOT NULL,
	"key" varchar(100) NOT NULL,
	"title" varchar(200) NOT NULL,
	"criteria" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"blueprint_id" integer NOT NULL,
	"key" varchar(100) NOT NULL,
	"kind" "assessment_section_kind" NOT NULL,
	"title" varchar(200) NOT NULL,
	"instructions" text,
	"weight" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"time_limit_minutes" integer,
	"rubric_id" integer,
	"config" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"section_id" integer NOT NULL,
	"content" jsonb,
	"files" jsonb,
	"ai_usage" jsonb,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"career_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"importance" "skill_importance" DEFAULT 'important' NOT NULL,
	"required_level" "skill_level" DEFAULT 'intermediate' NOT NULL,
	"required_score" integer DEFAULT 60 NOT NULL,
	"category_label" varchar(100),
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "careers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"tagline" varchar(255),
	"description" text,
	"what_this_role_does" text,
	"demand_level" "demand_level" DEFAULT 'high',
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" varchar(10) DEFAULT 'INR',
	"salary_unit" varchar(20) DEFAULT 'LPA',
	"experience_level" varchar(100),
	"growth_rate" varchar(50),
	"icon" varchar(50),
	"color" varchar(20),
	"career_pathway" jsonb,
	"typical_requirements" jsonb,
	"typical_tasks" jsonb,
	"is_demo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "careers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" text,
	"industry" varchar(100),
	"size" varchar(50),
	"location" varchar(200),
	"website" varchar(255),
	"logo_initials" varchar(5),
	"logo_color" varchar(20),
	"verified" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "domain_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(80) NOT NULL,
	"user_id" integer,
	"attempt_id" integer,
	"job_id" integer,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employment_outcomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer,
	"user_id" integer NOT NULL,
	"job_id" integer,
	"hired_at" timestamp,
	"performance_rating" integer,
	"employer_feedback" text,
	"skill_feedback" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"importance" "skill_importance" DEFAULT 'important' NOT NULL,
	"required_level" "skill_level" DEFAULT 'intermediate' NOT NULL,
	"required_score" integer DEFAULT 60 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"company_id" integer NOT NULL,
	"career_id" integer,
	"created_by_user_id" integer,
	"description" text,
	"responsibilities" jsonb,
	"location" varchar(200),
	"work_type" "work_type" DEFAULT 'hybrid' NOT NULL,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" varchar(10) DEFAULT 'INR',
	"salary_unit" varchar(20) DEFAULT 'LPA',
	"experience_min" integer DEFAULT 0,
	"experience_max" integer,
	"require_human_review" boolean DEFAULT false NOT NULL,
	"status" "job_status" DEFAULT 'active' NOT NULL,
	"is_demo" boolean DEFAULT true NOT NULL,
	"posted_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "learning_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(300) NOT NULL,
	"skill_id" integer,
	"career_id" integer,
	"type" varchar(50),
	"provider" varchar(100),
	"url" varchar(500),
	"duration" varchar(50),
	"level" "skill_level" DEFAULT 'beginner' NOT NULL,
	"free" boolean DEFAULT true NOT NULL,
	"description" text,
	"is_demo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" text,
	"career_id" integer,
	"skill_slugs" jsonb,
	"difficulty" varchar(50),
	"estimated_hours" integer,
	"instructions" text,
	"deliverables" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skill_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "skill_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"source" "evidence_source" NOT NULL,
	"label" varchar(200) NOT NULL,
	"detail" text,
	"score" integer,
	"weight" integer DEFAULT 100 NOT NULL,
	"attempt_id" integer,
	"project_id" integer,
	"job_id" integer,
	"verified_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_passports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"public_id" varchar(40) NOT NULL,
	"career_id" integer,
	"readiness" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"visibility" jsonb,
	"employer_visible" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skill_passports_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "skill_passports_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "skill_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"level" "skill_level" DEFAULT 'not_evaluated' NOT NULL,
	"confidence" "confidence_level" DEFAULT 'low' NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"verification_status" "verification_status" DEFAULT 'self_reported' NOT NULL,
	"breakdown" jsonb,
	"last_verified_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"description" text,
	"category_id" integer,
	"why_employers_want" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skills_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"project_id" integer,
	"title" varchar(200),
	"description" text,
	"skill_slugs" jsonb,
	"project_url" varchar(500),
	"verified" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'candidate' NOT NULL,
	"company_id" integer,
	"avatar_initials" varchar(5),
	"avatar_color" varchar(20),
	"goal" varchar(100),
	"education_background" text,
	"experience_summary" text,
	"experience_years" integer DEFAULT 0,
	"target_career_id" integer,
	"location" varchar(200),
	"work_preference" "work_type",
	"onboarding_complete" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_blueprint_id_assessment_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."assessment_blueprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_defense_questions" ADD CONSTRAINT "assessment_defense_questions_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_defense_responses" ADD CONSTRAINT "assessment_defense_responses_question_id_assessment_defense_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_defense_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_defense_responses" ADD CONSTRAINT "assessment_defense_responses_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_evaluations" ADD CONSTRAINT "assessment_evaluations_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_evaluations" ADD CONSTRAINT "assessment_evaluations_section_id_assessment_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."assessment_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_evaluations" ADD CONSTRAINT "assessment_evaluations_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_section_id_assessment_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."assessment_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_item_id_assessment_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."assessment_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_rubric_scores" ADD CONSTRAINT "assessment_rubric_scores_evaluation_id_assessment_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."assessment_evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_rubric_scores" ADD CONSTRAINT "assessment_rubric_scores_rubric_id_assessment_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."assessment_rubrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_rubrics" ADD CONSTRAINT "assessment_rubrics_blueprint_id_assessment_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."assessment_blueprints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_sections" ADD CONSTRAINT "assessment_sections_blueprint_id_assessment_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."assessment_blueprints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_sections" ADD CONSTRAINT "assessment_sections_rubric_id_assessment_rubrics_id_fk" FOREIGN KEY ("rubric_id") REFERENCES "public"."assessment_rubrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_section_id_assessment_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."assessment_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_skills" ADD CONSTRAINT "career_skills_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_skills" ADD CONSTRAINT "career_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_events" ADD CONSTRAINT "domain_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_outcomes" ADD CONSTRAINT "employment_outcomes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_outcomes" ADD CONSTRAINT "employment_outcomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_outcomes" ADD CONSTRAINT "employment_outcomes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD CONSTRAINT "skill_evidence_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_passports" ADD CONSTRAINT "skill_passports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_passports" ADD CONSTRAINT "skill_passports_career_id_careers_id_fk" FOREIGN KEY ("career_id") REFERENCES "public"."careers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_scores" ADD CONSTRAINT "skill_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_scores" ADD CONSTRAINT "skill_scores_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."skill_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_projects" ADD CONSTRAINT "user_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_target_career_id_careers_id_fk" FOREIGN KEY ("target_career_id") REFERENCES "public"."careers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "application_user_job_unique" ON "applications" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_user_blueprint_number_unique" ON "assessment_attempts" USING btree ("user_id","blueprint_id","attempt_number");--> statement-breakpoint
CREATE INDEX "attempt_user_idx" ON "assessment_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_slug_version_unique" ON "assessment_blueprints" USING btree ("slug","version");--> statement-breakpoint
CREATE UNIQUE INDEX "defense_response_question_unique" ON "assessment_defense_responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "evaluation_attempt_idx" ON "assessment_evaluations" USING btree ("attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "item_section_key_unique" ON "assessment_items" USING btree ("section_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "response_attempt_item_unique" ON "assessment_responses" USING btree ("attempt_id","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rubric_blueprint_key_unique" ON "assessment_rubrics" USING btree ("blueprint_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "section_blueprint_key_unique" ON "assessment_sections" USING btree ("blueprint_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "submission_attempt_section_unique" ON "assessment_submissions" USING btree ("attempt_id","section_id");--> statement-breakpoint
CREATE UNIQUE INDEX "career_skills_unique" ON "career_skills" USING btree ("career_id","skill_id");--> statement-breakpoint
CREATE INDEX "domain_events_type_idx" ON "domain_events" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "job_skills_unique" ON "job_skills" USING btree ("job_id","skill_id");--> statement-breakpoint
CREATE INDEX "jobs_company_idx" ON "jobs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "jobs_career_idx" ON "jobs" USING btree ("career_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "evidence_user_skill_idx" ON "skill_evidence" USING btree ("user_id","skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_scores_user_skill_unique" ON "skill_scores" USING btree ("user_id","skill_id");