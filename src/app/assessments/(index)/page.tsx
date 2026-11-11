import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { ChevronRight, Clock, FlaskConical, Layers, ShieldCheck } from "lucide-react";
import { getDb, isDatabaseConfigured } from "@/db";
import { assessmentBlueprints, assessmentSections } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { listUserAttempts } from "@/lib/services/assessment-service";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, SectionHeader } from "@/components/ui/AppPage";
import { EmptyState } from "@/components/ui/States";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assessments",
  description:
    "Work simulations that measure what you can actually do. Real tasks, rubric-based evaluation, and a defense round on your own work.",
};

const STATUS_LABELS: Record<string, { label: string; variant: "outline" | "yellow" | "green" | "default" }> = {
  in_progress: { label: "In progress", variant: "outline" },
  submitted: { label: "Submitted", variant: "yellow" },
  evaluating: { label: "Evaluating", variant: "yellow" },
  defense: { label: "Defense round", variant: "yellow" },
  passed: { label: "Passed", variant: "green" },
  failed: { label: "Not yet ready", variant: "default" },
  completed: { label: "Completed", variant: "green" },
  expired: { label: "Expired", variant: "default" },
};

export default async function AssessmentsPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main id="main-content" className="app-page">
        <EmptyState
          title="Assessments unavailable"
          message="The database is not configured, so assessment briefings cannot be loaded."
        />
      </main>
    );
  }

  const db = await getDb();
  // Blueprints, sections and session are independent — one wave.
  const [blueprints, sectionRows, user] = await Promise.all([
    db
      .select()
      .from(assessmentBlueprints)
      .where(eq(assessmentBlueprints.status, "published"))
      .orderBy(desc(assessmentBlueprints.version)),
    db.select().from(assessmentSections),
    getCurrentUser(),
  ]);
  const attempts = user ? await listUserAttempts(user.id) : [];

  return (
    <main id="main-content" className="app-page">
      <PageHeader
        eyebrow="Work simulations"
        title="Do not claim your skills. Demonstrate them."
        description="These are not quizzes. You do the work a role demands, submit it, then defend your reasoning against questions drawn from what you produced. Scores are calculated against a published rubric."
        actions={
          <ButtonLink href="/skills" variant="secondary" size="md">
            Skill catalogue
          </ButtonLink>
        }
      />

      {attempts.length > 0 && (
        <section className="app-section">
          <SectionHeader
            title="Your attempts"
            action={<span className="tabular text-sm text-muted">{attempts.length} total</span>}
          />
          <ul className="hb-card mt-4 divide-y divide-line overflow-clip">
            {attempts.map(({ attempt, blueprint }) => {
              const status = STATUS_LABELS[attempt.status] ?? STATUS_LABELS.in_progress;
              const href =
                attempt.status === "in_progress"
                  ? `/assessments/${blueprint.slug}/workspace`
                  : attempt.status === "defense" ||
                      attempt.status === "submitted" ||
                      attempt.status === "evaluating"
                    ? `/assessments/attempt/${attempt.id}/defense`
                    : `/assessments/attempt/${attempt.id}/result`;
              return (
                <li key={attempt.id}>
                  <Link
                    href={href}
                    className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-200 hover:bg-paper-2 sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-md font-medium text-ink">{blueprint.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Attempt {attempt.attemptNumber} · v{attempt.blueprintVersion} ·{" "}
                        {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
                          new Date(attempt.startedAt),
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {attempt.readinessScore !== null && (
                        <span className="tabular text-base font-semibold text-ink">{attempt.readinessScore}</span>
                      )}
                      <Badge size="sm" variant={status.variant}>{status.label}</Badge>
                      <ChevronRight
                        size={16}
                        className="text-line-strong transition-[transform,color] duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:text-link"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="app-section">
        <SectionHeader
          title="Available assessments"
          description="Each one measures a specific set of skills and takes one focused sitting."
          action={<span className="tabular text-sm text-muted">{blueprints.length} published</span>}
        />

        {blueprints.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No assessments published yet"
              message="The assessment catalogue is empty. Use your roadmap and projects in the meantime."
            />
          </div>
        ) : (
          <div className="stagger mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
            {blueprints.map((blueprint) => {
              const sections = sectionRows
                .filter((section) => section.blueprintId === blueprint.id)
                .sort((a, b) => a.order - b.order);
              return (
                <article key={blueprint.id} className="hb-tile hb-tile-white flex flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-link">
                      <FlaskConical size={13} aria-hidden />
                      {blueprint.targetRole}
                    </span>
                    <span className="tabular text-xs text-muted">v{blueprint.version}</span>
                  </div>
                  <h3 className="display-sm mt-5 text-ink">{blueprint.title}</h3>
                  <p className="mt-2.5 flex-1 text-md leading-relaxed text-muted">{blueprint.summary}</p>

                  <dl className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-graphite">
                    <div className="flex items-center gap-1.5">
                      <Clock size={15} className="text-muted" aria-hidden />
                      <dt className="sr-only">Duration</dt>
                      <dd>{blueprint.durationMinutes} minutes</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers size={15} className="text-muted" aria-hidden />
                      <dt className="sr-only">Sections</dt>
                      <dd>{sections.length} sections</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-muted" aria-hidden />
                      <dt className="sr-only">Evidence</dt>
                      <dd>Rubric + defense</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {sections.map((section) => (
                      <span key={section.id} className="rounded-full bg-paper-2 px-2.5 py-1 text-xs text-graphite">
                        {section.title} · {section.weight}%
                      </span>
                    ))}
                  </div>

                  <div className="mt-7">
                    <ButtonLink href={`/assessments/${blueprint.slug}`} size="lg">
                      View briefing
                    </ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-6 px-1 text-xs leading-relaxed text-muted">
        A passing assessment creates evidence, not a certificate of employment. Scores are
        comparative measures against a rubric and nothing more.
      </p>
    </main>
  );
}
