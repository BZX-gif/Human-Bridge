# Human Bridge

A career-building operating system: discover a role, get a staged roadmap, plan the work around
real availability, build projects, and keep evidence you control.

Built with Next.js 16 (App Router), React 19, Tailwind v4, Drizzle ORM, Zod and an embedded Postgres
(PGlite) for local development. No paid services are required.

## Run locally

```bash
npm install
HB_DB_DRIVER=pglite HB_PGLITE_DIR=.pglite npm run db:seed
HB_DB_DRIVER=pglite HB_PGLITE_DIR=.pglite npm run dev
```

Open `http://localhost:3000` and create an account. For production, set `DATABASE_URL` to a Postgres
connection string and run `npm run db:migrate` (or `npm run db:seed` for demo content).

## AI (optional)

The product works without AI. To enable the Gemini mentor and richer assessment feedback, set:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=...
AI_MODEL=gemini-2.0-flash
```

Without a key, the mentor returns a deterministic guided response grounded in the user's roadmap,
gaps, tasks and portfolio. Assessment scoring falls back to conservative rubric checks. No AI result
is fabricated and the UI states which mode is active.

## The five connected parts

1. **Careers** — role requirements, work, entry points, projects and progression (`/careers`).
2. **Roadmap** — deterministic, staged plan from ordered skills and curated projects (`/journey`).
3. **Planner** — milestones broken into sessions sized to stated weekly hours (`/planner`).
4. **Build** — skills, assessments and projects with evidence (`/skills`, `/assessments`, `/projects`).
5. **Prove** — portfolio and skill passport with explicit visibility (`/portfolio`, `/passport`).

## Honesty invariants

- A verified skill requires recorded assessment or employer evidence. Self-reported claims are
  labelled and never count toward a verified level.
- Project completion creates self-attested evidence only; it never marks a skill verified.
- Effort and time ranges are labelled estimates. No employment, salary or interview outcome is
  guaranteed.
- Demo jobs are marked. The product does not invent live vacancies, employer interest or success
  stories.
- Public portfolio sections are opt-in and filtered server-side. Email is never exposed.

## Verification

```bash
npm run typecheck
npm run lint
npm test        # 80 tests
npm run build
```

## Layout

- `src/app/(routes)` — server pages and API routes.
- `src/components` — app shell, design-system primitives, workspace clients.
- `src/lib/services` — career, roadmap, planner, portfolio and passport logic.
- `src/lib/career/roadmap-template.ts` — deterministic roadmap builder.
- `src/lib/ai` — provider abstraction, mentor, prompts and fallbacks.
- `src/db` — Drizzle schema and SQL migrations (`0002_career_os.sql` adds the career OS tables).
