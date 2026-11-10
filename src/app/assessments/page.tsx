import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, Clock, FlaskConical, Layers, ShieldCheck } from "lucide-react";
import { getDb, isDatabaseConfigured } from "@/db";
import { assessmentBlueprints, assessmentSections } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { listUserAttempts } from "@/lib/services/assessment-service";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
      <header className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Work simulations</p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3rem)] leading-[1.02] tracking-[-0.02em]">
            Do not claim your skills. Demonstrate them.
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
            These are not quizzes. You do the work a role demands, submit it, then defend your
            reasoning against questions drawn from what you produced. Scores are calculated against
            a published rubric.
          </p>
        </div>
        <ButtonLink href="/skills" variant="secondary" size="md">
          Skill catalogue
          <ArrowRight size={14} aria-hidden />
        </ButtonLink>
      </header>

      {attempts.length > 0 && (
        <section className="app-section">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-ink">Your attempts</h2>
            <span className="text-[10px] uppercase tracking-[0.12em] text-faint">{attempts.length} total</span>
          </div>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
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
                    className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-paper-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-ink">{blueprint.title}</p>
                      <p className="mt-0.5 text-[10.5px] text-muted">
                        Attempt {attempt.attemptNumber} · v{attempt.blueprintVersion} ·{" "}
                        {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
                          new Date(attempt.startedAt),
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      {attempt.readinessScore !== null && (
                        <span className="text-[13px] font-medium tabular text-ink">
                          {attempt.readinessScore}
                        </span>
                      )}
                      <Badge size="sm" variant={status.variant}>{status.label}</Badge>
                      <ArrowRight size={13} className="text-faint" aria-hidden />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="app-section">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Available assessments</h2>
            <p className="mt-1 text-[11.5px] text-muted">
              Each one measures a specific set of skills and takes one focused sitting.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.12em] text-faint">{blueprints.length} published</span>
        </div>

        {blueprints.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No assessments published yet"
              message="The assessment catalogue is empty. Use your roadmap and projects in the meantime."
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {blueprints.map((blueprint) => {
              const sections = sectionRows
                .filter((section) => section.blueprintId === blueprint.id)
                .sort((a, b) => a.order - b.order);
              return (
                <article
                  key={blueprint.id}
                  className="flex flex-col rounded-lg border border-line bg-paper p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-paper-2 px-2 py-1 text-[10px] font-medium text-graphite">
                      <FlaskConical size={10} aria-hidden />
                      {blueprint.targetRole}
                    </span>
                    <span className="text-[9.5px] text-faint">v{blueprint.version}</span>
                  </div>
                  <h3 className="mt-3 font-display text-[23px] leading-tight text-ink">{blueprint.title}</h3>
                  <p className="mt-1.5 flex-1 text-[11.5px] leading-relaxed text-muted">{blueprint.summary}</p>

                  <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[10.5px] text-muted">
                    <div className="flex items-center gap-1.5">
                      <Clock size={11} aria-hidden />
                      <dt className="sr-only">Duration</dt>
                      <dd>{blueprint.durationMinutes} minutes</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers size={11} aria-hidden />
                      <dt className="sr-only">Sections</dt>
                      <dd>{sections.length} sections</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={11} aria-hidden />
                      <dt className="sr-only">Evidence</dt>
                      <dd>Rubric + defense</dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {sections.map((section) => (
                      <span key={section.id} className="rounded-[3px] bg-paper-3 px-1.5 py-0.5 text-[9.5px] text-graphite">
                        {section.title} · {section.weight}%
                      </span>
                    ))}
                  </div>

                  <ButtonLink href={`/assessments/${blueprint.slug}`} variant="secondary" size="sm" className="mt-4 w-full">
                    View briefing
                    <ArrowRight size={12} aria-hidden />
                  </ButtonLink>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-6 text-[10px] leading-relaxed text-faint">
        A passing assessment creates evidence, not a certificate of employment. Scores are
        comparative measures against a rubric and nothing more.
      </p>
    </main>
  );
}
