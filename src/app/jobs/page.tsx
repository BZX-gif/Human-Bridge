import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Briefcase, MapPin, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listJobsWithMatch } from "@/lib/services/job-service";
import { isDatabaseConfigured } from "@/db";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatExperience, formatSalary, getWorkTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Roles with structured skill requirements. See exactly why you match, and exactly what is missing.",
};

export default async function JobsPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main id="main-content" className="app-page">
        <EmptyState
          title="Opportunities unavailable"
          message="The database is not configured, so listings cannot be loaded."
        />
      </main>
    );
  }

  const user = await getCurrentUser();
  const jobs = await listJobsWithMatch(user?.id ?? null);

  return (
    <main id="main-content" className="app-page">
      <header className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Opportunities</p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3rem)] leading-[1.02] tracking-[-0.02em]">
            Matched on evidence, not keywords.
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
            Each role states the skills it needs and the level required. When you are signed in, the
            match is calculated from your verified evidence — and the reasoning is always shown.
          </p>
        </div>
        {!user ? (
          <ButtonLink href="/signup" size="md">
            See your match
            <ArrowUpRight size={14} aria-hidden />
          </ButtonLink>
        ) : (
          <ButtonLink href="/skills" variant="secondary" size="md">
            <ShieldCheck size={14} aria-hidden />
            Review evidence
          </ButtonLink>
        )}
      </header>

      <div className="mt-5 flex items-start gap-2 rounded-md border border-line bg-paper-2 px-3.5 py-2.5">
        <ShieldCheck size={13} className="mt-0.5 shrink-0 text-graphite" aria-hidden />
        <p className="text-[10.5px] leading-relaxed text-muted">
          Listings marked “demo” are illustrative catalogue entries, not live vacancies. Human Bridge
          does not guarantee interviews, offers or salaries, and no match score is an employment
          prediction.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No opportunities listed yet"
            message="Nothing has been published. In the meantime, your roadmap and project portfolio are the useful work."
            action={<ButtonLink href="/journey" size="sm">Open roadmap</ButtonLink>}
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                className="group block rounded-lg border border-line bg-paper p-5 transition-colors hover:border-line-strong sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 gap-3.5">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] border border-line bg-paper-2 text-[11px] font-semibold text-graphite"
                      aria-hidden
                    >
                      {job.companyInitials}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[15px] font-semibold leading-snug text-ink">{job.title}</h2>
                        {job.isDemo && <Badge size="sm" variant="outline">Demo listing</Badge>}
                      </div>
                      <p className="mt-0.5 text-[11.5px] text-muted">{job.companyName}</p>
                    </div>
                  </div>

                  {job.match ? (
                    <div className="shrink-0 text-right">
                      <p className="font-display text-[26px] leading-none tabular text-ink">
                        {job.match.score}%
                      </p>
                      <p className="mt-1 text-[9.5px] uppercase tracking-[0.1em] text-faint">
                        {job.match.eligible ? "requirements met" : "partial match"}
                      </p>
                    </div>
                  ) : (
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                      aria-hidden
                    />
                  )}
                </div>

                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[10.5px] text-muted">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={11} aria-hidden />
                    <dd>
                      {job.location} · {getWorkTypeLabel(job.workType)}
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={11} aria-hidden />
                    <dd>{formatExperience(job.experienceMin, job.experienceMax ?? undefined)}</dd>
                  </div>
                  {job.salaryMin !== null && job.salaryMax !== null && (
                    <dd>{formatSalary(job.salaryMin, job.salaryMax, job.salaryUnit ?? "LPA")}</dd>
                  )}
                </dl>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill) => {
                    const match = job.match?.skillMatches.find((entry) => entry.slug === skill.slug);
                    return (
                      <span
                        key={skill.slug}
                        className={
                          match?.status === "met"
                            ? "inline-flex items-center gap-1 rounded-[3px] border border-moss/20 bg-moss-soft px-1.5 py-1 text-[10px] text-moss"
                            : match
                              ? "inline-flex items-center gap-1 rounded-[3px] border border-ochre/20 bg-ochre-soft px-1.5 py-1 text-[10px] text-ochre"
                              : "inline-flex items-center gap-1 rounded-[3px] border border-line bg-paper-2 px-1.5 py-1 text-[10px] text-muted"
                        }
                      >
                        {skill.name}
                        <span className="opacity-60">
                          {skill.importance === "essential" ? "essential · " : ""}
                          {skill.requiredScore}+
                        </span>
                      </span>
                    );
                  })}
                </div>

                {job.match && !job.match.eligible && (
                  <p className="mt-2.5 text-[10.5px] font-medium text-ochre">
                    {job.match.blockingReasons[0] ?? "Some required evidence is missing."}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 text-[10px] leading-relaxed text-faint">
        A match is a comparison against recorded evidence, not a hiring decision. Employers make
        their own judgements.
      </p>
    </main>
  );
}
