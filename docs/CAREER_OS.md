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

`src/app/globals.css` is the single source for tokens and shared classes.

- **Type.** One family: Inter Variable with its optical-size axis, self-hosted from `src/app/fonts`
  (no third-party font request). Headings use the `display-*` classes; figures use `stat-value` and
  `tabular`.
- **Colour.** Cool neutrals (`ink`, `graphite`, `muted`, `line`, `paper`…`paper-4`, `night`), one
  interactive accent (`accent`, `link`), and three status hues with soft backgrounds (`moss`,
  `ochre`, `rust`). Text and control colours are chosen to meet WCAG AA on the surfaces they sit on.
  To make text quieter, pick a quieter token (`text-muted`); do not dim it with `opacity-*`, which
  takes small text on a tinted surface below 4.5:1. On `paper-3` use `text-muted`, not `text-faint`.
- **Shape and depth.** Radii run from 4px to 44px (`--radius-xs`…`--radius-4xl`); cards are
  `hb-card`, large feature surfaces are `hb-tile`. Elevation comes from soft layered shadows, not
  borders.
- **Layout.** Signed-in pages use `.app-page` (1200px, or `.app-page-narrow` for a reading column)
  inside the sidebar shell from `components/layout/Navigation.tsx`. Public pages use
  `.hb-container`. Page furniture lives in `components/ui/AppPage.tsx` (`PageHeader`,
  `SectionHeader`, `Panel`, `Stat`).
- **Motion.** Opacity, transform and filter only, on shared easing tokens. Scroll-linked effects use
  CSS scroll timelines behind `@supports`, with `components/motion/ScrollMotion.tsx` as the
  fallback. Everything settles to a still state under `prefers-reduced-motion`. One-shot entrances
  (`animate-rise`, `animate-fade`, `.stagger`, `hb-swap-in`…) fill `backwards` only, so an element
  returns to its own styles once it has played. A `forwards` fill would leave it a stacking
  context, a containing block for fixed children and a backdrop root for good.
- **Frosted bars.** `hb-glass-bar` blurs what is behind it only up to the nearest backdrop root, so
  it must not sit inside an element with a lasting `opacity`, `filter` or mask; the page text would
  show through it unblurred. Where `backdrop-filter` is unsupported the bars are opaque.
- **Loading.** `components/ui/PageSkeleton.tsx` has one variant per page frame. An index page keeps
  its `page.tsx` and `loading.tsx` in an `(index)` route group, so the list skeleton is not painted
  ahead of the detail routes nested beside it.
- **Labels.** Where a screen holds a slug or enum but not a stored name, format it with
  `formatSlug` from `lib/utils` (`power-bi` becomes `Power BI`). Assessment content marks column
  and table names with backticks; render it through `components/ui/InlineText.tsx`.
- **Not found.** The route gate in `src/app/layout.tsx` never calls `notFound()` itself: thrown from
  the root layout it has no boundary to land in and the response is an empty document. The gate
  returns a verdict and the `layout.tsx` of the segment concerned raises the 404 with
  `answerRouteVerdict()` (`lib/auth/route-verdict.ts`). A gate rule that can answer "not found"
  needs such a layout, and no `loading.tsx` may sit above it, or the response starts as a 200.
  `tests/route-gate-layouts.test.ts` checks both.
