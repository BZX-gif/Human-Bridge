import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getBlueprint, getOwnedAttempt } from "@/lib/services/assessment-service";
import { getAttemptEvaluations } from "@/lib/services/evaluation-service";
import { isAiConfigured } from "@/lib/ai";
import { SKILL_LEVEL_LABELS } from "@/lib/assessment/skill-level";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import {
  ConfidenceBadge,
  IntegrityBadge,
  LevelBadge,
} from "@/components/assessment/EvidenceBadges";
import type { AttemptResult } from "@/lib/assessment/types";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId: raw } = await params;
  const attemptId = Number(raw);
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/assessments/attempt/${raw}/result`);
  if (!Number.isInteger(attemptId)) redirect("/assessments");

  // Authorisation: getOwnedAttempt throws NOT_FOUND for another user's attempt.
  const attempt = await getOwnedAttempt(attemptId, user.id);
  const blueprint = await getBlueprint(String(attempt.blueprintId));
  const evaluations = await getAttemptEvaluations(attemptId);
  const result = attempt.resultSummary as AttemptResult | null;
  const aiAvailable = isAiConfigured();

  if (!result) {
    return (
      <main className="min-h-screen bg-[#f8fafc] pt-16">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <EmptyState
            title="This attempt has not been evaluated yet"
            message="Finish and submit the assessment to see your result."
            action={<ButtonLink href="/assessments">Back to assessments</ButtonLink>}
          />
        </div>
      </main>
    );
  }

  const strongest = result.skillScores.slice(0, 3);
  const weakest = [...result.skillScores].reverse().slice(0, 3);
  const readyState = attempt.status === "passed";

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      {/* Headline */}
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#1a56ff]">
            Assessment complete
          </p>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{blueprint.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Attempt {attempt.attemptNumber} · version {attempt.blueprintVersion} ·{" "}
            {attempt.completedAt
              ? new Date(attempt.completedAt).toLocaleDateString()
              : "in review"}
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Human Bridge Readiness
              </p>
              <p className="mt-1 text-5xl font-black tabular-nums text-slate-900">
                {result.readinessScore}
                <span className="text-2xl font-bold text-slate-300"> / 100</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Overall score
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-700">
                {result.overallScore}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {readyState ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <CheckCircle2 size={13} aria-hidden />
                  Meets the bar for this role
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  <XCircle size={13} aria-hidden />
                  Not yet ready for this role
                </span>
              )}
              <IntegrityBadge status={attempt.integrityStatus} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {/* AI availability — stated honestly */}
        {!aiAvailable && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Bot size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">AI evaluation unavailable</p>
              <p className="mt-1 leading-relaxed">
                No AI provider is configured, so your written and practical work was scored using
                conservative deterministic checks only. These scores are capped and marked
                low-confidence. Your full submission has been saved and can be re-evaluated or
                reviewed by a human. Nothing has been fabricated.
              </p>
            </div>
          </div>
        )}

        {/* Why this result */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
            Why this result
          </h2>
          <ul className="space-y-2.5">
            {result.failReasons.map((reason) => (
              <li key={reason} className="flex gap-2.5 text-sm text-slate-700">
                <XCircle size={15} className="mt-0.5 shrink-0 text-red-500" aria-hidden />
                {reason}
              </li>
            ))}
            {result.passReasons.map((reason) => (
              <li key={reason} className="flex gap-2.5 text-sm text-slate-700">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-500" aria-hidden />
                {reason}
              </li>
            ))}
          </ul>
        </section>

        {/* Section breakdown */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
            Section breakdown
          </h2>
          <div className="space-y-3">
            {result.sectionScores.map((section) => (
              <div key={section.sectionKey}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-800">{section.title}</span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {section.evaluated ? `${section.score} / 100` : "Not evaluated"}
                    <span className="ml-2 text-xs text-slate-400">{section.weight}% weight</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      section.score >= 75
                        ? "bg-green-500"
                        : section.score >= 55
                          ? "bg-amber-500"
                          : "bg-red-400"
                    }`}
                    style={{ width: `${section.evaluated ? section.score : 0}%` }}
                  />
                </div>
                {section.notes && (
                  <p className="mt-1 text-xs text-amber-700">{section.notes}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Per-skill scores */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-900">
            Skill scores
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Not one number. Each skill is scored separately from the evidence that measured it.
          </p>
          <ul className="divide-y divide-slate-100">
            {result.skillScores.map((skill) => (
              <li key={skill.skillSlug} className="flex flex-wrap items-center gap-3 py-3">
                <span className="min-w-[140px] flex-1 text-sm font-medium capitalize text-slate-800">
                  {skill.skillSlug.replace(/-/g, " ")}
                </span>
                <span className="w-10 text-right text-sm font-bold tabular-nums text-slate-900">
                  {skill.score}
                </span>
                <LevelBadge level={SKILL_LEVEL_LABELS[skill.level]} />
                <ConfidenceBadge confidence={skill.confidence} />
                <span className="text-[11px] text-slate-400">
                  Evidence: {skill.evidenceKinds.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Strengths / improvements */}
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <TrendingUp size={15} className="text-green-500" aria-hidden />
              Your strongest skills
            </h2>
            <ul className="space-y-2">
              {strongest.map((s) => (
                <li key={s.skillSlug} className="flex justify-between text-sm">
                  <span className="capitalize text-slate-700">
                    {s.skillSlug.replace(/-/g, " ")}
                  </span>
                  <span className="font-bold tabular-nums text-slate-900">{s.score}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <TrendingDown size={15} className="text-amber-500" aria-hidden />
              Skills to improve
            </h2>
            <ul className="space-y-2">
              {weakest.map((s) => (
                <li key={s.skillSlug} className="flex justify-between text-sm">
                  <span className="capitalize text-slate-700">
                    {s.skillSlug.replace(/-/g, " ")}
                  </span>
                  <span className="font-bold tabular-nums text-slate-900">{s.score}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Evaluator feedback */}
        {evaluations.filter((e) => e.feedback).length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
              Evaluator feedback
            </h2>
            <div className="space-y-4">
              {evaluations
                .filter((e) => e.feedback)
                .map((evaluation) => (
                  <div key={evaluation.id} className="rounded-xl bg-slate-50 p-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {evaluation.evaluatorType === "ai"
                        ? "AI evaluation"
                        : evaluation.evaluatorType === "human"
                          ? "Human review"
                          : "Deterministic evaluation"}
                      {evaluation.confidence && ` · ${evaluation.confidence} confidence`}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-700">{evaluation.feedback}</p>
                    {Array.isArray(evaluation.gaps) && evaluation.gaps.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {(evaluation.gaps as string[]).slice(0, 6).map((gap) => (
                          <li key={gap} className="flex gap-2 text-xs text-slate-600">
                            <AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-500" aria-hidden />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Evidence collected */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
            <BadgeCheck size={15} className="text-[#1a56ff]" aria-hidden />
            Evidence collected
          </h2>
          <ul className="space-y-2">
            {result.evidenceCollected.map((evidence) => (
              <li key={evidence} className="flex gap-2 text-sm text-slate-700">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-500" aria-hidden />
                {evidence}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            This evidence is now recorded on your Skill Passport with the verification status{" "}
            <strong>ASSESSED</strong>.
          </p>
        </section>

        {/* Next steps */}
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/passport">
            View your Skill Passport
            <ArrowRight size={15} aria-hidden />
          </ButtonLink>
          <ButtonLink href="/jobs" variant="secondary">
            See matching jobs
          </ButtonLink>
          {weakest[0] && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Improve {weakest[0].skillSlug.replace(/-/g, " ")}
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
