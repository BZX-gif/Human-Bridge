import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { ArrowRight, Clock, FlaskConical, Layers, ShieldCheck } from "lucide-react";
import { getDb, isDatabaseConfigured } from "@/db";
import { assessmentBlueprints, assessmentSections } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { listUserAttempts } from "@/lib/services/assessment-service";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prove your skills — Human Bridge",
  description:
    "Work simulations that measure what you can actually do. Real tasks, rubric-based evaluation, and a defense round on your own work.",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  in_progress: { label: "In progress", className: "bg-blue-50 text-blue-700" },
  submitted: { label: "Submitted", className: "bg-amber-50 text-amber-700" },
  evaluating: { label: "Evaluating", className: "bg-amber-50 text-amber-700" },
  defense: { label: "Defense round", className: "bg-violet-50 text-violet-700" },
  passed: { label: "Passed", className: "bg-green-50 text-green-700" },
  failed: { label: "Not yet ready", className: "bg-slate-100 text-slate-600" },
  completed: { label: "Completed", className: "bg-green-50 text-green-700" },
  expired: { label: "Expired", className: "bg-slate-100 text-slate-500" },
};

export default async function AssessmentsPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="min-h-screen bg-[#f8fafc] pt-16">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Database not configured"
            message="Set DATABASE_URL (see .env.example) and run npm run db:seed to load the assessment blueprints."
          />
        </div>
      </main>
    );
  }

  const db = await getDb();
  const blueprints = await db
    .select()
    .from(assessmentBlueprints)
    .where(eq(assessmentBlueprints.status, "published"))
    .orderBy(desc(assessmentBlueprints.version));

  const sectionRows = await db.select().from(assessmentSections);
  const user = await getCurrentUser();
  const attempts = user ? await listUserAttempts(user.id) : [];

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#1a56ff]">
            Work simulations
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900">
            Don&apos;t claim your skills. Prove them.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            These are not quizzes. You do the actual work a role demands, submit it, and then
            defend your reasoning against questions generated from what you produced. Every score
            is calculated on our servers against a published rubric.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Your attempts */}
        {attempts.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Your attempts</h2>
            <div className="space-y-3">
              {attempts.map(({ attempt, blueprint }) => {
                const status = STATUS_LABELS[attempt.status] ?? STATUS_LABELS.in_progress;
                const href =
                  attempt.status === "in_progress"
                    ? `/assessments/${blueprint.slug}/workspace`
                    : attempt.status === "defense" || attempt.status === "submitted" || attempt.status === "evaluating"
                      ? `/assessments/attempt/${attempt.id}/defense`
                      : `/assessments/attempt/${attempt.id}/result`;
                return (
                  <Link
                    key={attempt.id}
                    href={href}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {blueprint.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Attempt {attempt.attemptNumber} · v{attempt.blueprintVersion} ·{" "}
                        {new Date(attempt.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {attempt.readinessScore !== null && (
                        <span className="text-sm font-bold tabular-nums text-slate-900">
                          {attempt.readinessScore}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                      <ArrowRight size={15} className="text-slate-400" aria-hidden />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <h2 className="mb-4 text-lg font-bold text-slate-900">Available assessments</h2>
        {blueprints.length === 0 ? (
          <EmptyState
            title="No assessments published yet"
            message="Run npm run db:seed to load the Data Analyst work simulation."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {blueprints.map((blueprint) => {
              const sections = sectionRows
                .filter((s) => s.blueprintId === blueprint.id)
                .sort((a, b) => a.order - b.order);
              return (
                <article
                  key={blueprint.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef3ff] px-2.5 py-1 text-[11px] font-semibold text-[#1a56ff]">
                      <FlaskConical size={11} aria-hidden />
                      {blueprint.targetRole}
                    </span>
                    <span className="text-[11px] text-slate-400">v{blueprint.version}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{blueprint.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                    {blueprint.summary}
                  </p>

                  <dl className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} aria-hidden />
                      <dt className="sr-only">Duration</dt>
                      <dd>{blueprint.durationMinutes} minutes</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers size={13} aria-hidden />
                      <dt className="sr-only">Sections</dt>
                      <dd>{sections.length} sections</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={13} aria-hidden />
                      <dt className="sr-only">Evidence</dt>
                      <dd>Rubric + defense</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {sections.map((s) => (
                      <span
                        key={s.id}
                        className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
                      >
                        {s.title} · {s.weight}%
                      </span>
                    ))}
                  </div>

                  <div className="mt-5">
                    <ButtonLink href={`/assessments/${blueprint.slug}`} className="w-full">
                      View briefing
                      <ArrowRight size={15} aria-hidden />
                    </ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
