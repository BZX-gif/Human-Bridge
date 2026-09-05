import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertCircle, Briefcase, CheckCircle2, MapPin } from "lucide-react";
import { getJob, toCandidateSkills } from "@/lib/services/job-service";
import { matchCandidateToRequirements } from "@/lib/services/matching-service";
import { getCurrentUser } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui/Button";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import { formatExperience, formatSalary, getWorkTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const { job, company } = await getJob(Number(id));
    return { title: `${job.title} at ${company.name} — Human Bridge` };
  } catch {
    return { title: "Job not found — Human Bridge" };
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId)) notFound();

  let data;
  try {
    data = await getJob(jobId);
  } catch {
    notFound();
  }

  const { job, company, requiredSkills } = data;
  const user = await getCurrentUser();
  const match = user
    ? matchCandidateToRequirements(requiredSkills, await toCandidateSkills(user.id))
    : null;

  const responsibilities = Array.isArray(job.responsibilities)
    ? (job.responsibilities as string[])
    : [];

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Link href="/jobs" className="text-xs font-semibold text-[#1a56ff] hover:underline">
            ← All jobs
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div className="flex gap-4">
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white ${company.logoColor ?? "bg-slate-600"}`}
                aria-hidden
              >
                {company.logoInitials}
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {job.title}
                </h1>
                <p className="mt-1 text-slate-600">
                  {company.name}
                  {job.isDemo && (
                    <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      DEMO
                    </span>
                  )}
                </p>
              </div>
            </div>

            {match && (
              <div className="text-right">
                <p
                  className={`text-4xl font-black tabular-nums ${
                    match.eligible ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {match.score}%
                </p>
                <p className="text-[11px] font-medium text-slate-400">YOUR MATCH</p>
              </div>
            )}
          </div>

          <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <MapPin size={14} aria-hidden />
              <dd>
                {job.location ?? "Not specified"} · {getWorkTypeLabel(job.workType)}
              </dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Briefcase size={14} aria-hidden />
              <dd>
                {formatExperience(job.experienceMin ?? 0, job.experienceMax ?? undefined)}
              </dd>
            </div>
            {job.salaryMin !== null && job.salaryMax !== null && (
              <dd>{formatSalary(job.salaryMin, job.salaryMax, job.salaryUnit ?? "LPA")}</dd>
            )}
          </dl>

          <div className="mt-6">
            {user ? (
              <ApplyButton jobId={job.id} eligible={match?.eligible ?? false} />
            ) : (
              <ButtonLink href={`/signup?next=/jobs/${job.id}`}>
                Sign up to apply with evidence
              </ButtonLink>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        {/* Match explanation */}
        {match && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-900">
              Why you match {match.score}%
            </h2>
            <p className="mb-5 text-xs text-slate-500">
              Matching is deterministic and fully explained. Nothing is hidden from you.
            </p>

            {match.blockingReasons.length > 0 && (
              <ul className="mb-5 space-y-2 rounded-xl bg-amber-50 p-4">
                {match.blockingReasons.map((reason) => (
                  <li key={reason} className="flex gap-2 text-sm text-amber-900">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
                    {reason}
                  </li>
                ))}
              </ul>
            )}

            <ul className="space-y-3">
              {match.skillMatches.map((skill) => (
                <li key={skill.slug} className="rounded-xl border border-slate-100 p-3.5">
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      {skill.status === "met" ? (
                        <CheckCircle2 size={14} className="text-green-500" aria-hidden />
                      ) : (
                        <AlertCircle size={14} className="text-amber-500" aria-hidden />
                      )}
                      {skill.name}
                      <span className="text-[10px] uppercase tracking-wide text-slate-400">
                        {skill.importance}
                      </span>
                    </span>
                    <span className="text-xs tabular-nums text-slate-500">
                      {skill.candidateScore} / {skill.requiredScore} required
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">{skill.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Requirements (visible to everyone) */}
        {!match && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
              Skill requirements
            </h2>
            <ul className="space-y-2">
              {requiredSkills.map((skill) => (
                <li
                  key={skill.slug}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm"
                >
                  <span className="text-slate-800">
                    {skill.name}
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">
                      {skill.importance}
                    </span>
                  </span>
                  <span className="text-xs tabular-nums text-slate-500">
                    {skill.requiredLevel} · {skill.requiredScore}+
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {job.description && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-900">
              About the role
            </h2>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{job.description}</p>
          </section>
        )}

        {responsibilities.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-900">
              Responsibilities
            </h2>
            <ul className="space-y-2">
              {responsibilities.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a56ff]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {job.isDemo && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
            This is a demo listing used to exercise the matching engine. It is not a real vacancy
            and applying to it will not reach an employer.
          </p>
        )}
      </div>
    </main>
  );
}
