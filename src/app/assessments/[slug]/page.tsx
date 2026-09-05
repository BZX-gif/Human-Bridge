import { notFound } from "next/navigation";
import {
  Bot,
  CheckCircle2,
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
      <main className="min-h-screen bg-[#f8fafc] pt-16">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Database not configured"
            message="Set DATABASE_URL and run npm run db:seed to load assessments."
          />
        </div>
      </main>
    );
  }

  let blueprint;
  try {
    blueprint = await getBlueprint(slug);
  } catch {
    notFound();
  }

  const user = await getCurrentUser();
  const scenario = getScenario(slug);
  const skills = Array.from(
    new Set(blueprint.sections.flatMap((s) => s.items.flatMap((i) => i.skillSlugs))),
  );
  const policy = blueprint.passingPolicy;

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#1a56ff]">
            {blueprint.targetRole} · Work simulation · v{blueprint.version}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {blueprint.title}
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">{blueprint.summary}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {user ? (
              <StartAssessmentButton slug={blueprint.slug} />
            ) : (
              <>
                <ButtonLink href={`/login?next=/assessments/${blueprint.slug}`}>
                  Sign in to start
                </ButtonLink>
                <ButtonLink href="/signup" variant="secondary">
                  Create a free account
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
        {/* The brief */}
        {scenario && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <ClipboardList size={15} className="text-[#1a56ff]" aria-hidden />
              What you&apos;ll do
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-slate-600">
              {scenario.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className={
                    para.startsWith(">") ? "border-l-2 border-[#1a56ff] pl-4 italic text-slate-700" : ""
                  }
                >
                  {para.replace(/^>\s?/, "").replace(/\*\*/g, "")}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Sections */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
            <Scale size={15} className="text-[#1a56ff]" aria-hidden />
            How it&apos;s structured
          </h2>
          <ol className="space-y-3">
            {blueprint.sections.map((section, i) => (
              <li key={section.key} className="flex gap-4 rounded-xl bg-slate-50 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3>
                    <span className="text-xs font-semibold text-[#1a56ff]">
                      {section.weight}% of your result
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {section.instructions}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Skills measured */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <ShieldCheck size={15} className="text-[#1a56ff]" aria-hidden />
              Skills measured
            </h2>
            <ul className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs capitalize text-slate-700"
                >
                  {skill.replace(/-/g, " ")}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Each skill is scored separately and lands on your Skill Passport with the evidence
              behind it — not as a single overall percentage.
            </p>
          </section>

          {/* Tools */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <Wrench size={15} className="text-[#1a56ff]" aria-hidden />
              Tools allowed
            </h2>
            <ul className="space-y-2">
              {blueprint.toolsAllowed.map((tool) => (
                <li key={tool} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-500" aria-hidden />
                  {tool}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={13} aria-hidden />
              {blueprint.durationMinutes} minutes total
            </div>
          </section>
        </div>

        {/* AI policy */}
        {blueprint.aiPolicy && (
          <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <Bot size={15} className="text-[#1a56ff]" aria-hidden />
              Using AI
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">{blueprint.aiPolicy}</p>
          </section>
        )}

        {/* Scoring */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
            How scoring works
          </h2>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="text-slate-300">—</span>
              Multiple-choice and numeric answers are graded automatically on the server. Your
              browser never calculates or submits a score.
            </li>
            <li className="flex gap-2">
              <span className="text-slate-300">—</span>
              Written and practical work is graded against a published rubric, criterion by
              criterion.
            </li>
            <li className="flex gap-2">
              <span className="text-slate-300">—</span>
              You need at least <strong>{policy.minOverall}</strong> overall AND at least{" "}
              <strong>{policy.minPractical}</strong> on the practical work. A strong knowledge
              score cannot compensate for weak practical work.
            </li>
            <li className="flex gap-2">
              <span className="text-slate-300">—</span>
              Every essential skill for this role must reach{" "}
              <strong>{policy.essentialSkillFloor}</strong>. A single weak essential skill is shown
              plainly rather than averaged away.
            </li>
            <li className="flex gap-2">
              <span className="text-slate-300">—</span>
              The defense round must reach <strong>{policy.minDefense}</strong>. Work you cannot
              explain does not count as proof.
            </li>
          </ul>
        </section>

        {/* Integrity */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-900">
            What we expect
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
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
