import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
import { Panel, SectionHeader } from "@/components/ui/AppPage";
import { EmptyState } from "@/components/ui/States";
import { cn, formatSlug } from "@/lib/utils";
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
      <main id="main-content" className="app-page app-page-narrow">
        <EmptyState
          title="This attempt has not been evaluated yet"
          message="Finish and submit the assessment to see your result."
          action={<ButtonLink href="/assessments">Back to assessments</ButtonLink>}
        />
      </main>
    );
  }

  const strongest = result.skillScores.slice(0, 3);
  const weakest = [...result.skillScores].reverse().slice(0, 3);
  const readyState = attempt.status === "passed";
  const feedback = evaluations.filter((e) => e.feedback);

  return (
    <main id="main-content" className="app-page app-page-narrow">
      <Link href="/assessments" className="hb-link animate-rise text-sm">
        <ChevronLeft size={15} strokeWidth={2.2} aria-hidden />
        All assessments
      </Link>

      {/* Headline */}
      <section className="hb-tile hb-tile-white animate-rise mt-4 p-6 sm:p-10">
        <p className="eyebrow">Assessment complete</p>
        <h1 className="display-md mt-2.5 text-ink">{blueprint.title}</h1>
        <p className="tabular mt-2.5 text-md text-muted">
          Attempt {attempt.attemptNumber} · version {attempt.blueprintVersion} ·{" "}
          {attempt.completedAt
            ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
                new Date(attempt.completedAt),
              )
            : "in review"}
        </p>

        <div className="mt-8 flex flex-wrap items-end gap-x-12 gap-y-6 border-t border-line pt-8">
          <div>
            <p className="text-sm font-medium text-muted">Human Bridge Readiness</p>
            <p
              className={cn(
                "tabular mt-2 text-7xl font-semibold leading-none tracking-[-0.04em]",
                readyState ? "text-moss" : "text-ink",
              )}
            >
              {result.readinessScore}
              <span className="ml-1.5 text-2xl font-medium tracking-[-0.02em] text-muted">/ 100</span>
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted">Overall score</p>
            <p className="tabular mt-2 text-4xl font-semibold leading-none tracking-[-0.03em] text-graphite">
              {result.overallScore}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {readyState ? (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-moss-soft px-4 text-sm font-medium text-moss">
                <CheckCircle2 size={15} aria-hidden />
                Meets the bar for this role
              </span>
            ) : (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ochre-soft px-4 text-sm font-medium text-ochre">
                <XCircle size={15} aria-hidden />
                Not yet ready for this role
              </span>
            )}
            <IntegrityBadge status={attempt.integrityStatus} />
          </div>
        </div>
      </section>

      <div className="mt-4 space-y-4 sm:mt-5 lg:space-y-5">
        {/* AI availability — stated honestly */}
        {!aiAvailable && (
          <div className="flex items-start gap-3.5 rounded-lg bg-ochre-soft p-5 sm:p-6">
            <Bot size={20} className="mt-0.5 shrink-0 text-ochre" aria-hidden />
            <div className="text-md text-ochre">
              <p className="text-base font-semibold">AI evaluation unavailable</p>
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
        <Panel>
          <SectionHeader title="Why this result" />
          <ul className="mt-4 space-y-3">
            {result.failReasons.map((reason) => (
              <li key={reason} className="flex gap-3 text-base leading-relaxed text-graphite">
                <XCircle size={19} className="mt-[3px] shrink-0 text-rust" aria-hidden />
                {reason}
              </li>
            ))}
            {result.passReasons.map((reason) => (
              <li key={reason} className="flex gap-3 text-base leading-relaxed text-graphite">
                <CheckCircle2 size={19} className="mt-[3px] shrink-0 text-moss" aria-hidden />
                {reason}
              </li>
            ))}
          </ul>
        </Panel>

        {/* Section breakdown */}
        <Panel>
          <SectionHeader title="Section breakdown" />
          <div className="mt-5 space-y-5">
            {result.sectionScores.map((section) => (
              <div key={section.sectionKey}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="text-base font-medium text-ink">{section.title}</span>
                  <span className="tabular shrink-0 text-md text-graphite">
                    {section.evaluated ? `${section.score} / 100` : "Not evaluated"}
                    <span className="ml-2.5 text-sm text-muted">{section.weight}% weight</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-paper-3">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      section.score >= 75 ? "bg-moss" : section.score >= 55 ? "bg-ochre" : "bg-rust",
                    )}
                    style={{ width: `${section.evaluated ? section.score : 0}%` }}
                  />
                </div>
                {section.notes && <p className="mt-2 text-sm leading-relaxed text-ochre">{section.notes}</p>}
              </div>
            ))}
          </div>
        </Panel>

        {/* Per-skill scores */}
        <Panel>
          <SectionHeader
            title="Skill scores"
            description="Not one number. Each skill is scored separately from the evidence that measured it."
          />
          <ul className="@container mt-4 divide-y divide-line">
            {result.skillScores.map((skill) => (
              <li
                key={skill.skillSlug}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3.5 @[720px]:grid @[720px]:grid-cols-[minmax(0,1fr)_3rem_6.5rem_9.5rem_13.5rem] @[720px]:gap-x-4"
              >
                <span className="min-w-[140px] flex-1 text-base font-medium text-ink">
                  {formatSlug(skill.skillSlug)}
                </span>
                <span className="tabular w-10 text-right text-lg font-semibold text-ink @[720px]:w-auto">{skill.score}</span>
                <span className="flex">
                  <LevelBadge level={SKILL_LEVEL_LABELS[skill.level]} />
                </span>
                <span className="flex">
                  <ConfidenceBadge confidence={skill.confidence} />
                </span>
                <span className="w-full text-xs text-muted @[720px]:w-auto">
                  Evidence: {skill.evidenceKinds.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Strengths / improvements */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
          <Panel>
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-[-0.02em] text-ink">
              <TrendingUp size={20} className="text-moss" aria-hidden />
              Your strongest skills
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {strongest.map((s) => (
                <li key={s.skillSlug} className="flex items-baseline justify-between gap-3 py-2.5 text-base">
                  <span className="text-graphite">{formatSlug(s.skillSlug)}</span>
                  <span className="tabular font-semibold text-ink">{s.score}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-[-0.02em] text-ink">
              <TrendingDown size={20} className="text-ochre" aria-hidden />
              Skills to improve
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {weakest.map((s) => (
                <li key={s.skillSlug} className="flex items-baseline justify-between gap-3 py-2.5 text-base">
                  <span className="text-graphite">{formatSlug(s.skillSlug)}</span>
                  <span className="tabular font-semibold text-ink">{s.score}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Evaluator feedback */}
        {feedback.length > 0 && (
          <Panel>
            <SectionHeader title="Evaluator feedback" />
            <div className="mt-4 space-y-3">
              {feedback.map((evaluation) => (
                <div key={evaluation.id} className="rounded-md bg-paper-2 p-5">
                  <p className="mb-2 text-xs font-semibold text-muted">
                    {evaluation.evaluatorType === "ai"
                      ? "AI evaluation"
                      : evaluation.evaluatorType === "human"
                        ? "Human review"
                        : "Deterministic evaluation"}
                    {evaluation.confidence && ` · ${evaluation.confidence} confidence`}
                  </p>
                  <p className="text-md leading-relaxed text-graphite">{evaluation.feedback}</p>
                  {Array.isArray(evaluation.gaps) && evaluation.gaps.length > 0 && (
                    <ul className="mt-3.5 space-y-1.5">
                      {(evaluation.gaps as string[]).slice(0, 6).map((gap) => (
                        <li key={gap} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-ochre" aria-hidden />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Evidence collected */}
        <Panel>
          <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-[-0.02em] text-ink">
            <BadgeCheck size={20} className="text-link" aria-hidden />
            Evidence collected
          </h2>
          <ul className="mt-4 space-y-2.5">
            {result.evidenceCollected.map((evidence) => (
              <li key={evidence} className="flex gap-3 text-base leading-relaxed text-graphite">
                <CheckCircle2 size={18} className="mt-[3px] shrink-0 text-moss" aria-hidden />
                {evidence}
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-md bg-paper-2 px-4 py-3 text-sm leading-relaxed text-muted">
            This evidence is now recorded on your Skill Passport with the verification status{" "}
            <strong className="font-semibold text-ink">ASSESSED</strong>.
          </p>
        </Panel>

        {/* Next steps */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 pt-2">
          <ButtonLink href="/passport" size="lg">
            View your Skill Passport
            <ArrowRight size={17} aria-hidden />
          </ButtonLink>
          <ButtonLink href="/jobs" variant="secondary" size="lg">
            See matching jobs
          </ButtonLink>
          {weakest[0] && (
            <Link href="/dashboard" className="hb-link ml-2 text-md">
              Improve {formatSlug(weakest[0].skillSlug)}
              <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
