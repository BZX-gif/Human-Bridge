CREATE TYPE "public"."assessment_type" AS ENUM('mcq', 'short_answer', 'coding', 'data_analysis', 'case_study', 'simulation', 'practical_task', 'ai_evaluation', 'oral_verification');--> statement-breakpoint
CREATE TYPE "public"."capability_dimension" AS ENUM('knowledge', 'practical_capability', 'real_world_task', 'reasoning', 'communication', 'verification');--> statement-breakpoint
CREATE TYPE "public"."scoring_method" AS ENUM('weighted_rubric', 'deterministic', 'ai_assisted', 'human_review', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."skill_difficulty" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."skill_status" AS ENUM('active', 'disabled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."skill_type" AS ENUM('domain', 'tool', 'human', 'ai_fluency');--> statement-breakpoint
CREATE TYPE "public"."track_status" AS ENUM('active', 'inactive', 'archived');--> statement-breakpoint
CREATE TABLE "assessment_blueprint_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"blueprint_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"weight" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"description" text,
	"category" varchar(100),
	"difficulty_levels" jsonb DEFAULT '["beginner","intermediate","advanced"]'::jsonb NOT NULL,
	"status" "track_status" DEFAULT 'active' NOT NULL,
	"ordering" integer DEFAULT 0 NOT NULL,
	"icon" varchar(50),
	"color" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "career_tracks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "score_dimensions" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"key" varchar(100) NOT NULL,
	"label" varchar(200) NOT NULL,
	"score" integer NOT NULL,
	"weight" integer DEFAULT 100 NOT NULL,
	"source" varchar(60) DEFAULT 'assessment' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_capabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"skill_id" integer NOT NULL,
	"dimension" "capability_dimension" NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"definition" jsonb,
	"ordering" integer DEFAULT 0 NOT NULL,
	"status" "skill_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"skill_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"description" text,
	"ordering" integer DEFAULT 0 NOT NULL,
	"status" "skill_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"track_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"importance" "skill_importance" DEFAULT 'important' NOT NULL,
	"required_level" "skill_level" DEFAULT 'intermediate' NOT NULL,
	"category_label" varchar(100),
	"ordering" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_blueprints" ADD COLUMN "skill_id" integer;--> statement-breakpoint
ALTER TABLE "assessment_blueprints" ADD COLUMN "assessment_type" "assessment_type" DEFAULT 'practical_task' NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_blueprints" ADD COLUMN "difficulty" "skill_difficulty" DEFAULT 'intermediate' NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_blueprints" ADD COLUMN "scoring_method" "scoring_method" DEFAULT 'weighted_rubric' NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_blueprints" ADD COLUMN "anti_cheat_config" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "careers" ADD COLUMN "track_id" integer;--> statement-breakpoint
ALTER TABLE "skill_scores" ADD COLUMN "assessment_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "skill_scores" ADD COLUMN "last_assessed_at" timestamp;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "skill_type" "skill_type" DEFAULT 'domain' NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "difficulty" "skill_difficulty" DEFAULT 'beginner' NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "importance" "skill_importance" DEFAULT 'important' NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "market_relevance" "demand_level" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "status" "skill_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_blueprint_skills" ADD CONSTRAINT "assessment_blueprint_skills_blueprint_id_assessment_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."assessment_blueprints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_blueprint_skills" ADD CONSTRAINT "assessment_blueprint_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_dimensions" ADD CONSTRAINT "score_dimensions_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_capabilities" ADD CONSTRAINT "skill_capabilities_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_skills" ADD CONSTRAINT "sub_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_skills" ADD CONSTRAINT "track_skills_track_id_career_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."career_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_skills" ADD CONSTRAINT "track_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_skill_unique" ON "assessment_blueprint_skills" USING btree ("blueprint_id","skill_id");--> statement-breakpoint
CREATE INDEX "blueprint_skill_skill_idx" ON "assessment_blueprint_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "career_tracks_category_idx" ON "career_tracks" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "score_dimensions_attempt_key_unique" ON "score_dimensions" USING btree ("attempt_id","key");--> statement-breakpoint
CREATE INDEX "score_dimensions_attempt_idx" ON "score_dimensions" USING btree ("attempt_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_capability_skill_dimension_unique" ON "skill_capabilities" USING btree ("skill_id","dimension");--> statement-breakpoint
CREATE INDEX "skill_capability_skill_idx" ON "skill_capabilities" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sub_skills_skill_slug_unique" ON "sub_skills" USING btree ("skill_id","slug");--> statement-breakpoint
CREATE INDEX "sub_skills_skill_idx" ON "sub_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "track_skills_unique" ON "track_skills" USING btree ("track_id","skill_id");--> statement-breakpoint
CREATE INDEX "track_skills_skill_idx" ON "track_skills" USING btree ("skill_id");--> statement-breakpoint
ALTER TABLE "assessment_blueprints" ADD CONSTRAINT "assessment_blueprints_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "careers" ADD CONSTRAINT "careers_track_id_career_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."career_tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blueprint_skill_idx" ON "assessment_blueprints" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "careers_track_idx" ON "careers" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "skill_scores_user_idx" ON "skill_scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "skill_scores_skill_idx" ON "skill_scores" USING btree ("skill_id");