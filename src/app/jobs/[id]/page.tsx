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

  // Job and session are independent — fetch together. (generateMetadata calls
  // getJob too; the request memo collapses it to one execution.)
  const [data, user] = await Promise.all([
    getJob(jobId).catch(() => null),
    getCurrentUser(),
  ]);
  if (!data) notFound();

  const { job, company, requiredSkills } = data;
  const candidate = user ? await toCandidateSkills(user.id) : null;
  const match = user && candidate ? matchCandidateToRequirements(requiredSkills, candidate) : null;

  const responsibilities = Array.isArray(job.responsibilities)
    ? (job.responsibilities as string[])
    : [];

  return (
    <main className="min-h-full bg-paper-2">
      <div className="border-b border-line bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <Link href="/jobs" className="text-xs font-semibold text-ink hover:underline">
            ← All jobs
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div className="flex gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-line bg-paper-3 text-[15px] font-semibold text-graphite"
                aria-hidden
              >
                {company.logoInitials}
              </span>
              <div>
                <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.2rem)] leading-tight tracking-[-0.015em] tracking-tight text-ink sm:text-3xl">
                  {job.title}
                </h1>
                <p className="mt-1 text-muted">
                  {company.name}
                  {job.isDemo && (
                    <span className="ml-2 rounded bg-ochre-soft px-1.5 py-0.5 text-[10px] font-medium text-ochre">
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
                    match.eligible ? "text-moss" : "text-ochre"
                  }`}
                >
                  {match.score}%
                </p>
                <p className="text-[11px] font-medium text-faint">YOUR MATCH</p>
              </div>
            )}
          </div>

          <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
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
          <section className="rounded-lg border border-line bg-paper p-6">
            <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-ink">
              Why you match {match.score}%
            </h2>
            <p className="mb-5 text-xs text-muted">
              Matching is deterministic and fully explained. Nothing is hidden from you.
            </p>

            {match.blockingReasons.length > 0 && (
              <ul className="mb-5 space-y-2 rounded-md bg-ochre-soft p-4">
                {match.blockingReasons.map((reason) => (
                  <li key={reason} className="flex gap-2 text-sm text-ochre">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
                    {reason}
                  </li>
                ))}
              </ul>
            )}

            <ul className="space-y-3">
              {match.skillMatches.map((skill) => (
                <li key={skill.slug} className="rounded-md border border-line p-3.5">
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {skill.status === "met" ? (
                        <CheckCircle2 size={14} className="text-green-500" aria-hidden />
                      ) : (
                        <AlertCircle size={14} className="text-amber-500" aria-hidden />
                      )}
                      {skill.name}
                      <span className="text-[10px] uppercase tracking-wide text-faint">
                        {skill.importance}
                      </span>
                    </span>
                    <span className="text-xs tabular-nums text-muted">
                      {skill.candidateScore} / {skill.requiredScore} required
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{skill.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Requirements (visible to everyone) */}
        {!match && (
          <section className="rounded-lg border border-line bg-paper p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink">
              Skill requirements
            </h2>
            <ul className="space-y-2">
              {requiredSkills.map((skill) => (
                <li
                  key={skill.slug}
                  className="flex items-center justify-between gap-3 rounded-md bg-paper-2 px-3.5 py-2.5 text-sm"
                >
                  <span className="text-ink">
                    {skill.name}
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-faint">
                      {skill.importance}
                    </span>
                  </span>
                  <span className="text-xs tabular-nums text-muted">
                    {skill.requiredLevel} · {skill.requiredScore}+
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {job.description && (
          <section className="rounded-lg border border-line bg-paper p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">
              About the role
            </h2>
            <p className="whitespace-pre-wrap leading-relaxed text-graphite">{job.description}</p>
          </section>
        )}

        {responsibilities.length > 0 && (
          <section className="rounded-lg border border-line bg-paper p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">
              Responsibilities
            </h2>
            <ul className="space-y-2">
              {responsibilities.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-graphite">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {job.isDemo && (
          <p className="rounded-lg border border-ochre/20 bg-ochre-soft p-4 text-xs leading-relaxed text-ochre">
            This is a demo listing used to exercise the matching engine. It is not a real vacancy
            and applying to it will not reach an employer.
          </p>
        )}
      </div>
    </main>
  );
}
