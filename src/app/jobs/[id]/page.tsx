import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertCircle, Briefcase, CheckCircle2, ChevronLeft, MapPin } from "lucide-react";
import { getJob, toCandidateSkills } from "@/lib/services/job-service";
import { matchCandidateToRequirements } from "@/lib/services/matching-service";
import { getCurrentUser } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Panel, SectionHeader } from "@/components/ui/AppPage";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import { cn, formatExperience, formatSalary, getWorkTypeLabel } from "@/lib/utils";

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
    <main id="main-content" className="app-page app-page-narrow">
      <Link href="/jobs" className="hb-link animate-rise text-sm">
        <ChevronLeft size={15} strokeWidth={2.2} aria-hidden />
        All opportunities
      </Link>

      <section className="hb-tile hb-tile-white animate-rise mt-4 p-6 sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-paper-2 text-lg font-semibold text-graphite"
              aria-hidden
            >
              {company.logoInitials}
            </span>
            <div className="min-w-0">
              <h1 className="display-md text-ink">{job.title}</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-base text-graphite">
                {company.name}
                {job.isDemo && (
                  <Badge size="sm" variant="yellow">
                    Demo listing
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {match && (
            <div className="shrink-0 sm:text-right">
              <p
                className={cn(
                  "tabular text-6xl font-semibold leading-none tracking-[-0.035em] sm:text-7xl",
                  match.eligible ? "text-moss" : "text-ochre",
                )}
              >
                {match.score}%
              </p>
              <p className="mt-2 text-sm font-medium text-muted">Your match</p>
            </div>
          )}
        </div>

        <dl className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-md text-graphite">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-muted" aria-hidden />
            <dd>
              {job.location ?? "Not specified"} · {getWorkTypeLabel(job.workType)}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase size={16} className="text-muted" aria-hidden />
            <dd>{formatExperience(job.experienceMin ?? 0, job.experienceMax ?? undefined)}</dd>
          </div>
          {job.salaryMin !== null && job.salaryMax !== null && (
            <dd className="tabular">{formatSalary(job.salaryMin, job.salaryMax, job.salaryUnit ?? "LPA")}</dd>
          )}
        </dl>

        <div className="mt-8">
          {user ? (
            <ApplyButton jobId={job.id} eligible={match?.eligible ?? false} />
          ) : (
            <ButtonLink href={`/signup?next=/jobs/${job.id}`} size="lg">
              Sign up to apply with evidence
            </ButtonLink>
          )}
        </div>
      </section>

      <div className="mt-4 space-y-4 sm:mt-5 lg:space-y-5">
        {/* Match explanation */}
        {match && (
          <Panel>
            <SectionHeader
              title={`Why you match ${match.score}%`}
              description="Matching is deterministic and fully explained. Nothing is hidden from you."
            />

            {match.blockingReasons.length > 0 && (
              <ul className="mt-5 space-y-2.5 rounded-md bg-ochre-soft p-5">
                {match.blockingReasons.map((reason) => (
                  <li key={reason} className="flex gap-2.5 text-md text-ochre">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden />
                    {reason}
                  </li>
                ))}
              </ul>
            )}

            <ul className="mt-5 space-y-2.5">
              {match.skillMatches.map((skill) => (
                <li key={skill.slug} className="rounded-md bg-paper-2 p-4 sm:p-5">
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2.5 text-base font-semibold text-ink">
                      {skill.status === "met" ? (
                        <CheckCircle2 size={18} className="shrink-0 self-center text-moss" aria-hidden />
                      ) : (
                        <AlertCircle size={18} className="shrink-0 self-center text-ochre" aria-hidden />
                      )}
                      {skill.name}
                      <span className="text-xs font-normal text-muted">{skill.importance}</span>
                    </span>
                    <span className="tabular text-sm text-muted">
                      {skill.candidateScore} / {skill.requiredScore} required
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted">{skill.explanation}</p>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* Requirements (visible to everyone) */}
        {!match && (
          <Panel>
            <SectionHeader title="Skill requirements" />
            <ul className="mt-4 space-y-2">
              {requiredSkills.map((skill) => (
                <li
                  key={skill.slug}
                  className="flex items-center justify-between gap-3 rounded-md bg-paper-2 px-4 py-3 text-md"
                >
                  <span className="font-medium text-ink">
                    {skill.name}
                    <span className="ml-2 text-xs font-normal text-muted">{skill.importance}</span>
                  </span>
                  <span className="tabular text-sm text-muted">
                    {skill.requiredLevel} · {skill.requiredScore}+
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {job.description && (
          <Panel>
            <SectionHeader title="About the role" />
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-graphite">{job.description}</p>
          </Panel>
        )}

        {responsibilities.length > 0 && (
          <Panel>
            <SectionHeader title="Responsibilities" />
            <ul className="mt-4 space-y-3">
              {responsibilities.map((item) => (
                <li key={item} className="flex gap-3 text-base leading-relaxed text-graphite">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {job.isDemo && (
          <p className="rounded-lg bg-ochre-soft p-5 text-sm leading-relaxed text-ochre">
            This is a demo listing used to exercise the matching engine. It is not a real vacancy
            and applying to it will not reach an employer.
          </p>
        )}
      </div>
    </main>
  );
}
