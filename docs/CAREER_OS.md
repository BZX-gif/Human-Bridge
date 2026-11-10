# Career OS architecture

## Data model

Migration `src/db/migrations/0002_career_os.sql` adds:

- `career_roadmaps`, `roadmap_stages`, `roadmap_milestones`
- `planner_goals`, `planner_tasks`
- `user_projects` (renamed/extended portfolio evidence)
- professional profile fields on `users` (headline, about, location, links, weekly hours, level)

All status and category values are Postgres enums declared before tables. The roadmap stores
milestones with objective, rationale, skills, resources, exercises, project links, estimated hours,
completion criteria, dependencies, status and ordering.

## Generation flow

1. `ensureRoadmapForUser` loads the career's ordered skill requirements and verified scores only.
2. `buildRoadmap` groups skills into five stages, adds an honest orientation milestone, project and
   professional-readiness milestones, estimates hours and writes dependency links.
3. The roadmap is persisted once; status updates are per-milestone.
4. `generateTasksFromMilestone` turns exercises/resources into 20–45 minute actions and schedules
   them within `dailyMinutesForWeeklyHours` (capped at 90 minutes/day). Duplicate open tasks are
   skipped, making the action idempotent.

## Services

- `career-service` — summaries, detail, gap computation.
- `roadmap-service` — create, repair, read, milestone status, rebuild.
- `planner-service` — tasks, goals, month view, rescheduling, generation.
- `portfolio-service` — professional profile, projects, catalogue, public filtering.
- `passport-service` — evidence-derived scores and privacy.

## API

All mutation routes validate with Zod, require a session and scope every query by `userId`:

`/api/roadmap`, `/api/roadmap/milestones/:id`, `/api/planner/tasks`, `/api/planner/goals`,
`/api/planner/generate`, `/api/planner/reschedule`, `/api/projects`, `/api/projects/:id`,
`/api/profile`, `/api/mentor`.

## Public exposure

`getPublicPortfolio` and `getPublicPassport` check `isPublic` and apply the candidate's visibility
flags server-side. Public pages are `noindex`, omit activity history and email, and return 404 when
privacy is disabled. Journey milestones are hidden when the journey flag is off.

## Design system

`src/app/globals.css` defines the HYB tokens: ink/graphite neutrals, paper surfaces, moss/ochre/rust/
steel accents, 3–12px radii, Inter/Instrument Serif, and motion utilities with a global
`prefers-reduced-motion` override. App pages use `.app-page`; marketing pages use `.hb-container`.
