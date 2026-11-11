import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Clock,
  Scale,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { getBlueprint } from "@/lib/services/assessment-service";
import { getCurrentUser } from "@/lib/auth/session";
import { getScenario } from "@/lib/seed/seed";
import { isDatabaseConfigured } from "@/db";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { StartAssessmentButton } from "@/components/assessment/StartAssessmentButton";
import { formatSlug } from "@/lib/utils";
import { InlineText } from "@/components/ui/InlineText";

export const dynamic = "force-dynamic";

/**
 * Pre-assessment briefing. Candidates are told exactly what they will do, how
 * long it takes, what is measured, what tools are allowed and how scoring works
 * before they start. No surprises.
 */
export default async function AssessmentBriefingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <main id="main-content" className="app-page app-page-narrow">
        <div>
          <EmptyState
            title="Database not configured"
            message="Set DATABASE_URL and run npm run db:seed to load assessments."
          />
        </div>
      </main>
    );
  }

  // Blueprint and session are independent — fetch together.
  const [blueprint, user] = await Promise.all([
    getBlueprint(slug).catch(() => null),
    getCurrentUser(),
  ]);
  if (!blueprint) notFound();

  const scenario = getScenario(slug);
  const skills = Array.from(
    new Set(blueprint.sections.flatMap((s) => s.items.flatMap((i) => i.skillSlugs))),
  );
  const policy = blueprint.passingPolicy;

  return (
    <main id="main-content" className="app-page app-page-narrow">
      <Link href="/assessments" className="hb-link animate-rise text-sm">
        <ChevronLeft size={15} strokeWidth={2.2} aria-hidden />
        All assessments
      </Link>

      <section className="hb-tile hb-tile-white animate-rise mt-4 p-6 sm:p-10">
        <p className="eyebrow">
          {blueprint.targetRole} · Work simulation · v{blueprint.version}
        </p>
        <h1 className="display-lg mt-3 text-ink">{blueprint.title}</h1>
        <p className="lede mt-4 max-w-2xl">{blueprint.summary}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Clock size={15} aria-hidden />
            {blueprint.durationMinutes} minutes
          </span>
          <span className="flex items-center gap-1.5">
            <Scale size={15} aria-hidden />
            {blueprint.sections.length} sections
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} aria-hidden />
            {skills.length} skills measured
          </span>
        </div>
        <div className="mt-8 flex flex-wrap gap-2.5">
          {user ? (
            <StartAssessmentButton slug={blueprint.slug} />
          ) : (
            <>
              <ButtonLink href={`/login?next=/assessments/${blueprint.slug}`} size="lg">
                Sign in to start
              </ButtonLink>
              <ButtonLink href="/signup" variant="secondary" size="lg">
                Create a free account
              </ButtonLink>
            </>
          )}
        </div>
      </section>

      <div className="mt-4 space-y-4 sm:mt-5 lg:space-y-5">
        {/* The brief */}
        {scenario && (
          <section className="hb-card p-6 sm:p-8">
            <h2 className="mb-4 flex items-center gap-2.5 text-xl font-semibold tracking-[-0.02em] text-ink">
              <ClipboardList size={20} strokeWidth={1.8} className="text-link" aria-hidden />
              What you&apos;ll do
            </h2>
            <div className="space-y-3.5 text-base leading-relaxed text-graphite">
              {scenario.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className={
                    para.startsWith(">") ? "rounded-md bg-paper-2 px-5 py-4 text-ink" : ""
                  }
                >
                  <InlineText>{para.replace(/^>\s?/, "").replace(/\*\*/g, "")}</InlineText>
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Sections */}
        <section className="hb-card p-6 sm:p-8">
          <h2 className="mb-4 flex items-center gap-2.5 text-xl font-semibold tracking-[-0.02em] text-ink">
            <Scale size={20} strokeWidth={1.8} className="text-link" aria-hidden />
            How it&apos;s structured
          </h2>
          <ol className="space-y-3">
            {blueprint.sections.map((section, i) => (
              <li key={section.key} className="flex gap-4 rounded-md bg-paper-2 p-5">
                <span className="tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-link">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-ink">{section.title}</h3>
                    <span className="tabular text-sm font-medium text-muted">{section.weight}% of your result</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    <InlineText>{section.instructions}</InlineText>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
          {/* Skills measured */}
          <section className="hb-card p-6 sm:p-8">
            <h2 className="mb-4 flex items-center gap-2.5 text-xl font-semibold tracking-[-0.02em] text-ink">
              <ShieldCheck size={20} strokeWidth={1.8} className="text-link" aria-hidden />
              Skills measured
            </h2>
            <ul className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full bg-paper-2 px-3 py-1 text-sm text-graphite"
                >
                  {formatSlug(skill)}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Each skill is scored separately and lands on your Skill Passport with the evidence
              behind it — not as a single overall percentage.
            </p>
          </section>

          {/* Tools */}
          <section className="hb-card p-6 sm:p-8">
            <h2 className="mb-4 flex items-center gap-2.5 text-xl font-semibold tracking-[-0.02em] text-ink">
              <Wrench size={20} strokeWidth={1.8} className="text-link" aria-hidden />
              Tools allowed
            </h2>
            <ul className="space-y-2.5">
              {blueprint.toolsAllowed.map((tool) => (
                <li key={tool} className="flex items-start gap-2.5 text-md text-graphite">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-moss" aria-hidden />
                  {tool}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-1.5 border-t border-line pt-4 text-sm text-muted">
              <Clock size={15} aria-hidden />
              {blueprint.durationMinutes} minutes total
            </div>
          </section>
        </div>

        {/* AI policy */}
        {blueprint.aiPolicy && (
          <section className="rounded-lg bg-accent-soft p-6 sm:p-8">
            <h2 className="mb-2 flex items-center gap-2.5 text-xl font-semibold tracking-[-0.02em] text-ink">
              <Bot size={20} strokeWidth={1.8} className="text-link" aria-hidden />
              Using AI
            </h2>
            <p className="text-base leading-relaxed text-graphite">{blueprint.aiPolicy}</p>
          </section>
        )}

        {/* Scoring */}
        <section className="hb-card p-6 sm:p-8">
          <h2 className="mb-4 text-xl font-semibold tracking-[-0.02em] text-ink">How scoring works</h2>
          <ul className="space-y-3.5 text-md leading-relaxed text-graphite">
            <li className="flex gap-3">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <span>
              Multiple-choice and numeric answers are graded automatically on the server. Your
              browser never calculates or submits a score.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <span>
              Written and practical work is graded against a published rubric, criterion by
              criterion.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <span>
              You need at least <strong className="font-semibold text-ink">{policy.minOverall}</strong> overall AND at least{" "}
              <strong className="font-semibold text-ink">{policy.minPractical}</strong> on the practical work. A strong knowledge
              score cannot compensate for weak practical work.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <span>
              Every essential skill for this role must reach{" "}
              <strong className="font-semibold text-ink">{policy.essentialSkillFloor}</strong>. A single weak essential skill is shown
              plainly rather than averaged away.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
              <span>
              The defense round must reach <strong className="font-semibold text-ink">{policy.minDefense}</strong>. Work you cannot
              explain does not count as proof.
              </span>
            </li>
          </ul>
        </section>

        {/* Integrity */}
        <section className="hb-card p-6 sm:p-8">
          <h2 className="mb-3 text-xl font-semibold tracking-[-0.02em] text-ink">What we expect</h2>
          <p className="text-md leading-relaxed text-graphite">
            Submit your own work. We record coarse signals — time taken, revision counts, pasted
            volume and tab focus — to spot anomalies. We do not use your webcam, read your screen or
            monitor your keystrokes. No single signal is ever treated as proof of anything; unusual
            patterns simply route an attempt to human review.
          </p>
        </section>
      </div>
    </main>
  );
}
