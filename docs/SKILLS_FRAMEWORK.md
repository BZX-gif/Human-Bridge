# Human Bridge — Skills & Assessments Framework

> **Product principle:** Human Bridge measures **what a person can actually DO**, not
> what courses they completed. Every score, level and verification status on the
> platform must trace back to evidence — assessment results, practical work,
> verified projects, or explicitly-labelled self-reports (which never produce a
> verified level).

This document describes the foundation built for that goal: the skills taxonomy,
its database relationships, the assessment/scoring architecture, the AI Fluency
layer, the employer-search foundation, and the operational guides for extending
the system.

---

## 1. Skills architecture

The taxonomy is a **three-layer model**, all stored in the database (never
hardcoded in UI components):

```
Career Track (career_tracks)      e.g. Data Analytics
        │  track_skills (many-to-many, per-track importance/level/order)
        ▼
Skill (skills)                    e.g. SQL  — canonical, unique slug
        │  sub_skills              e.g. Joins, Window Functions
        │  skill_capabilities      6 dimensions of real capability
        │  assessment_blueprint_skills
        ▼
Assessment blueprint (assessment_blueprints)  e.g. Data Analyst Revenue Investigation
```

### Career tracks
12 tracks are seeded: Software Engineering, Data Analytics, AI / ML, Cloud /
DevOps, Cybersecurity, UI/UX Design, Digital Marketing, Sales / Business
Development, Product Management, Finance / Business Analysis, Project
Management, Customer Success / Support.

Each track has: `name`, unique `slug`, `description`, `category` (taxonomy
grouping), `difficulty_levels`, `status`, `ordering`, `icon`, `color`,
timestamps. Existing roles (`careers`) link to a track via `careers.track_id`,
so a role catalogue page can surface its track and a track page can list roles.

### Skills
Each skill has: `name`, unique `slug`, `description`, `category_id`,
`skill_type` (`domain` | `tool` | `human` | `ai_fluency`), `difficulty`
(entry-level metadata), `importance`, `market_relevance`, `status`
(`active`/`disabled`/`archived`), timestamps.

Skills are **canonical** — one row per capability. They are attached to many
tracks through `track_skills` (with per-track `importance`, `required_level`,
`ordering`), which is precisely what lets AI Fluency capabilities be
cross-functional.

### Sub-skills
`sub_skills` decompose a skill into measurable parts (SQL → joins, window
functions, …). Unique constraint: `(skill_id, slug)`.

### Capability model (real-world capability)
Every important skill can be described across six dimensions in
`skill_capabilities`:

| dimension            | meaning                                                        |
|----------------------|----------------------------------------------------------------|
| `knowledge`          | concepts and theory                                             |
| `practical_capability` | doing the work on real data/systems                          |
| `real_world_task`    | an end-to-end task definition (`definition` json can carry the task prompt, deliverables, criteria) |
| `reasoning`          | explaining and defending conclusions                           |
| `communication`      | conveying findings to humans                                    |
| `verification`       | checking correctness, uncertainty and AI output                |

Seeded examples: SQL, Data Analysis, Python, ML Fundamentals, Generative AI,
UI Design, SEO, Customer Communication.

---

## 2. Database relationships

```
career_tracks 1─N careers             (careers.track_id)
career_tracks N─N skills              (track_skills: importance, required_level, ordering)
skills        1─N sub_skills          (unique skill_id + slug)
skills        1─N skill_capabilities  (unique skill_id + dimension)
skills        1─N assessment_blueprint_skills N─1 assessment_blueprints
users         1─N skill_scores       (unique user_id + skill_id)
users         1─N skill_evidence     (source, score, weight, attempt/project/job refs)
users         1─N assessment_attempts → responses → evaluations → rubric scores
assessment_attempts 1─N score_dimensions   (key, label, score, weight, source)
```

Key invariants:

- Unique slugs/IDs everywhere; relationships instead of repeated names
  (`track_skills`, `assessment_blueprint_skills` — skill names are never stored
  on assessments in new code; legacy `assessment_items.skill_slugs` remains for
  backward compatibility and is still read by the skill detail view).
- `skill_evidence` is the **single ledger** from which `skill_scores` is
  recomputed — self-reported evidence never contributes to the numeric score.
- Attempts are version-bound to a blueprint version; re-evaluation is
  idempotent (evidence is deleted/re-inserted per attempt).

---

## 3. Assessment architecture

The engine already exists and is data-driven; the framework added taxonomy
metadata to it.

- `assessment_blueprints` = an assessment definition. New fields:
  `skill_id` (primary skill), `assessment_type`, `difficulty`, `scoring_method`,
  `anti_cheat_config` (json flags below).
- `assessment_sections` (weighted, typed: `knowledge`, `investigation`,
  `practical`, `reasoning`, `defense`), `assessment_items` (typed,
  `answer_key` is **never** sent to the browser), `assessment_rubrics`.
- Attempt lifecycle: `start → in_progress → submitted → evaluating → defense →
  passed/failed`, with expiry, integrity signals, one attempt number per
  blueprint, and an optional defense round generated from the candidate's own
  submission.
- `assessment_blueprint_skills` normalises assessment → skill links.

### Assessment types
Supported in the model: `mcq`, `short_answer`, `coding`, `data_analysis`,
`case_study`, `simulation`, `practical_task`, `ai_evaluation`,
`oral_verification`. The item engine already executes `mcq`, `multi_select`,
`short_answer`, `numeric`, `sql` (structural check), `long_form` (rubric) and
`file_upload` items, and the blueprint can declare its shape. New types are
added by defining items/rubrics in a blueprint seed or admin tooling — the
engine does not need rewriting.

### Anti-cheating / AI-resistant design
Stored per blueprint in `anti_cheat_config`:

```
randomizedQuestions, randomizedDataset, randomizedScenario,
uniqueTaskParameters, timeLimit, practicalTasks, changingScenario,
followUpQuestions, reasoningProcessEvidence, hiddenTestCases,
aiOutputVerificationTasks, liveVerification
```

The **existing** engine already implements several of these (time limits,
practical tasks, follow-up questions/defense, reasoning/process evidence, AI
output verification items). The remaining flags are metadata for content
generators/authoring tools. AI detection is **not** used as the primary
defence; the model measures whether the candidate can verify, correct and
explain work — including AI-assisted work.

---

## 4. Scoring architecture

Scoring is multi-dimensional and weighted — all weights live in the database
or in data-driven rubric definitions, never in UI components.

- **Rubrics** (`assessment_rubrics.criteria`) carry per-criterion weights and
  skill mappings.
- **Sections** carry section weights; `knowledge` items weight less than
  `practical` in skill aggregation (engine constants in
  `lib/assessment/scoring.ts`).
- **score_dimensions** persists per-attempt weighted dimensions
  (one row per section: `section.<key>`, and per rubric criterion:
  `<sectionKey>.<criterionKey>`, with `score`, `weight`, `source`). This is what
  allows a profile to show e.g. *Technical Knowledge 78 · Practical Execution 91
  · Communication 76* instead of a single number.
- **Skill level** is never derived from a percentage alone
  (`lib/assessment/skill-level.ts`):
  - beginner: any evaluated evidence
  - intermediate: score ≥ 55
  - advanced: score ≥ 78 **and** practical evidence
  - expert: score ≥ 90 **and** practical **and** defense evidence
- **Confidence** reflects evidence breadth (practical+defense+count), not the
  score height.
- **Readiness** penalises unproven essential skills; passing requires every
  gate in the data-driven `passingPolicy` (overall, practical, defense,
  essential-skill floors, integrity flag).

---

## 5. AI Fluency layer

AI Fluency is **not a career track**. It is a cross-functional capability:

- 12 AI capabilities are seeded as skills with `skill_type = 'ai_fluency'`
  (Prompt Design, AI-Assisted Research, AI Output Verification, Fact Checking,
  Structured AI Workflows, AI Automation, Generative AI, RAG, AI Agents,
  Responsible AI, AI Evaluation, Knowing When Not To Trust AI).
- Each is linked to **multiple tracks** via `track_skills` (e.g. Data Analyst =
  SQL + Statistics + Power BI + AI Output Verification; Marketing = SEO +
  Analytics + AI Content Workflows + AI Verification).
- `getAiFluencyProfile(userId)` aggregates a candidate's AI-fluency evidence
  into a summary (`averageScore`, `strongestLevel`, `verificationStatus`,
  per-capability breakdown) — exposed at `GET /api/candidate/skills` and usable
  on the verified profile.
- The capability model includes an AI-specific real-world task: *"AI generated
  this analysis. Identify the errors, verify the claims, correct it, and
  explain your reasoning."* This is seeded against Generative AI.

---

## 6. Future employer matching

`searchCandidatesBySkillEvidence` in `lib/services/taxonomy-service.ts` is the
foundation. It is deterministic, relationship-based and evidence-gated:

- filters by `trackSlug`, `skills[{slug, minScore, minLevel}]`, `minScore`,
  `verifiedOnly`, `location`, `experienceMin`, `limit`;
- matches only against `skill_scores` (which are evidence-derived), so a
  self-reported claim never satisfies an employer search;
- returns `qualified` candidates with per-skill match detail and explanation
  paths.

It is intentionally **not yet wired to an employer UI** — employer marketplace
complete with paid search, saved searches and candidate contact is future work.
No employer-verification claims are made anywhere in the UI unless a row
actually exists (evidence source `EMPLOYER_VERIFIED`).

---

## 7. How to add a new skill

Please also do the DB step if the skill needs evidence/assessments (the schema
already covers it; only seeding changes if you want it pre-populated).

**Short term (runtime, no deploy):** as an admin, `POST /api/admin/skills`
with `{ name, slug, description, skillType, difficulty, importance,
marketRelevance }`, then `POST /api/admin/tracks/[id]/skills`
`{ skillId, importance, requiredLevel }` to attach it to tracks.

**In the catalogue seed:**
1. Add the skill to `src/lib/seed/taxonomy.ts` (`TAXONOMY_SKILLS`) — unique
   lowercase-hyphen `slug`, meaningful `description`, `skillType` (`ai_fluency`
   for cross-functional AI capabilities), `difficulty`, `importance`,
   `marketRelevance`, and a `whyEmployersWant` where useful.
2. Add it to the relevant `TAXONOMY_TRACKS[].skills` lists with
   `trackSkill(slug, importance, requiredLevel)`.
3. (Optional) add sub-skills to `TAXONOMY_SUB_SKILLS` and capability definitions
   to `TAXONOMY_CAPABILITIES`.
4. Run `npm run seed` / `npm run db:seed`. The seed is idempotent upserts by
   slug.

Never duplicate an existing slug — reuse the existing skill instead (e.g. SQL is
shared across Data Analytics, Software Engineering and Finance tracks).

---

## 8. How to add a new career track

1. Add a `CareerTrackSeed` to `TAXONOMY_TRACKS` in `src/lib/seed/taxonomy.ts`
   (name, unique slug, description, category, icon/color, ordering, and the
   skill list).
2. If roles (`careers`) should belong to it, add the mapping in
   `TRACK_BY_CAREER_SLUG`, or set `careers.track_id` directly.
3. Run `npm run db:seed`.
4. The UI list (`/skills`), track page (`/skills/[slug]`), and APIs
   (`/api/tracks`) are fully DB-driven — no component changes needed.

Admin path: `POST /api/admin/tracks`, then `POST /api/admin/tracks/[id]/skills`
to link skills.

---

## 9. How to add a new assessment type

The engine dispatches on item types and section kinds already; a new assessment
**type** is mostly metadata + content:

1. Model: the enum `assessment_type` in `src/db/schema.ts` already contains the
   nine supported shapes. If a genuinely new shape is needed, add the value,
   run `npm run db:generate` to produce a migration, commit it.
2. Content: add a blueprint seed (like
   `src/lib/assessment/blueprints/data-analyst.ts`) declaring sections, items,
   rubrics, passing policy, and `antiCheatConfig` flags; register it in
   `BLUEPRINT_SEEDS`.
3. Items: reuse existing item types (`mcq`, `multi_select`, `short_answer`,
   `numeric`, `sql`, `long_form`, `file_upload`). For a new item type, add it to
   `assessment_item_type` + `itemTypeEnum`, extend `lib/assessment/types.ts`
   (`ItemType`, payload/answer key), the auto-grader (`auto-grader.ts`), and the
   workspace input component.
4. Admin path: `POST /api/admin/assessments` creates a draft blueprint with
   skill links; `PATCH /api/admin/assessments/[id]` publishes/archives it.

---

## Versioning note

Schema changes are SQL migrations in `src/db/migrations` (applied by
`npm run db:migrate`; `npm run db:seed` = migrate + seed). The current migration
is `0001_skills_taxonomy`. Never hand-edit an applied migration; add a new one.
