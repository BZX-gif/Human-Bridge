import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, Target, TrendingUp } from "lucide-react";
import { getCareerBySlug, getCareerGapForUser } from "@/lib/services/career-service";
import { getCurrentUser } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui/Button";
import { SelectCareerButton } from "@/components/careers/SelectCareerButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { career } = await getCareerBySlug(slug);
    return {
      title: `${career.name} — Human Bridge`,
      description: career.description ?? undefined,
    };
  } catch {
    return { title: "Career not found — Human Bridge" };
  }
}

const IMPORTANCE_STYLES: Record<string, { label: string; badge: string; bar: string }> = {
  essential: {
    label: "Essential",
    badge: "border border-blue-100 bg-[#e8edff] text-[#1a56ff]",
    bar: "bg-[#1a56ff]",
  },
  important: {
    label: "Important",
    badge: "border border-violet-100 bg-violet-50 text-violet-700",
    bar: "bg-violet-500",
  },
  helpful: {
    label: "Helpful",
    badge: "border border-slate-200 bg-slate-50 text-slate-600",
    bar: "bg-slate-400",
  },
};

export default async function CareerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data;
  try {
    data = await getCareerBySlug(slug);
  } catch {
    notFound();
  }

  const { career, requiredSkills, blueprint } = data;
  const user = await getCurrentUser();
  const gaps = user ? await getCareerGapForUser(career.id, user.id) : [];
  const gapBySlug = new Map(gaps.map((g) => [g.slug, g]));
  const tasks = Array.isArray(career.typicalTasks) ? (career.typicalTasks as string[]) : [];
  const pathway = Array.isArray(career.careerPathway)
    ? (career.careerPathway as { title: string; description?: string }[])
    : [];

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Link href="/careers" className="text-xs font-semibold text-[#1a56ff] hover:underline">
            ← All careers
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">{career.name}</h1>
          {career.tagline && <p className="mt-2 text-lg text-slate-600">{career.tagline}</p>}
          {career.description && (
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">{career.description}</p>
          )}

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {career.salaryMin !== null && career.salaryMax !== null && (
              <div>
                <dt className="text-xs text-slate-500">Indicative range</dt>
                <dd className="font-semibold text-slate-900">
                  {career.salaryMin}–{career.salaryMax} {career.salaryUnit ?? "LPA"}
                </dd>
              </div>
            )}
            {career.demandLevel && (
              <div>
                <dt className="text-xs text-slate-500">Market demand</dt>
                <dd className="font-semibold capitalize text-slate-900">
                  {career.demandLevel.replace(/_/g, " ")}
                </dd>
              </div>
            )}
            {career.experienceLevel && (
              <div>
                <dt className="text-xs text-slate-500">Entry point</dt>
                <dd className="font-semibold text-slate-900">{career.experienceLevel}</dd>
              </div>
            )}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            {blueprint && (
              <ButtonLink href={`/assessments/${blueprint.slug}`}>
                Prove these skills
                <ArrowRight size={15} aria-hidden />
              </ButtonLink>
            )}
            {user && <SelectCareerButton careerId={career.id} careerName={career.name} />}
            {!user && (
              <ButtonLink href="/signup" variant="secondary">
                Sign up to track your gap
              </ButtonLink>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {career.whatThisRoleDoes && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <Briefcase size={15} className="text-[#1a56ff]" aria-hidden />
              What this role actually does
            </h2>
            <p className="leading-relaxed text-slate-700">{career.whatThisRoleDoes}</p>
            {tasks.length > 0 && (
              <ul className="mt-4 space-y-2">
                {tasks.map((task) => (
                  <li key={task} className="flex gap-2.5 text-sm text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a56ff]" aria-hidden />
                    {task}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Skills */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
            <Target size={15} className="text-[#1a56ff]" aria-hidden />
            Skills this role requires
          </h2>
          <p className="mb-5 text-xs text-slate-500">
            {user
              ? "Your current evidence is shown against each requirement."
              : "Sign in to see your own score against each requirement."}
          </p>
          <ul className="space-y-4">
            {requiredSkills.map((skill) => {
              const style = IMPORTANCE_STYLES[skill.importance] ?? IMPORTANCE_STYLES.helpful;
              const gap = gapBySlug.get(skill.slug);
              return (
                <li key={skill.slug}>
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{skill.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.badge}`}>
                        {style.label}
                      </span>
                    </span>
                    <span className="text-xs tabular-nums text-slate-500">
                      {gap ? `${gap.currentScore} / ` : ""}
                      {skill.requiredScore} required · {skill.requiredLevel}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${style.bar}`}
                      style={{
                        width: `${
                          gap
                            ? Math.min(100, (gap.currentScore / Math.max(1, skill.requiredScore)) * 100)
                            : 100
                        }%`,
                        opacity: gap ? 1 : 0.25,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {pathway.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <TrendingUp size={15} className="text-[#1a56ff]" aria-hidden />
              Typical progression
            </h2>
            <ol className="space-y-3">
              {pathway.map((stage, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-xs font-bold text-[#1a56ff]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{stage.title}</p>
                    {stage.description && (
                      <p className="text-xs text-slate-600">{stage.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <p className="text-xs leading-relaxed text-slate-500">
          Salary and demand figures are indicative market context, not offers or guarantees. Human
          Bridge does not promise a job outcome.
        </p>
      </div>
    </main>
  );
}
