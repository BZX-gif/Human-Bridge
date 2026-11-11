import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase, ChevronRight, MapPin, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listJobsWithMatch } from "@/lib/services/job-service";
import { isDatabaseConfigured } from "@/db";
import { PageHeader } from "@/components/ui/AppPage";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatExperience, formatSalary, getWorkTypeLabel } from "@/lib/utils";

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
      <PageHeader
        eyebrow="Opportunities"
        title="Matched on evidence, not keywords."
        description="Each role states the skills it needs and the level required. When you are signed in, the match is calculated from your verified evidence — and the reasoning is always shown."
        actions={
          !user ? (
            <ButtonLink href="/signup" size="md">
              See your match
            </ButtonLink>
          ) : (
            <ButtonLink href="/skills" variant="secondary" size="md">
              <ShieldCheck size={15} aria-hidden />
              Review evidence
            </ButtonLink>
          )
        }
      />

      <div className="mt-6 flex items-start gap-2.5 rounded-md bg-paper-3/70 px-4 py-3">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-link" aria-hidden />
        <p className="text-sm leading-relaxed text-graphite">
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
            action={<ButtonLink href="/journey" size="md">Open roadmap</ButtonLink>}
          />
        </div>
      ) : (
        <ul className="stagger mt-5 space-y-3 sm:space-y-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`} className="hb-card hb-card-interactive group block p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3.5 sm:items-center sm:gap-4">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-paper-2 text-sm font-semibold text-graphite"
                      aria-hidden
                    >
                      {job.companyInitials}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold leading-snug tracking-[-0.015em] text-ink">{job.title}</h2>
                        {job.isDemo && <Badge size="sm" variant="outline">Demo listing</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-muted">{job.companyName}</p>
                    </div>
                  </div>

                  {job.match ? (
                    <div className="shrink-0 text-right">
                      <p className={cn("stat-value", job.match.eligible ? "text-moss" : "text-ink")}>
                        {job.match.score}%
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {job.match.eligible ? "requirements met" : "partial match"}
                      </p>
                    </div>
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-2 text-graphite transition-[background-color,color] duration-500 ease-out-expo group-hover:bg-accent group-hover:text-white">
                      <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
                    </span>
                  )}
                </div>

                <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-graphite">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-muted" aria-hidden />
                    <dd>
                      {job.location} · {getWorkTypeLabel(job.workType)}
                    </dd>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={15} className="text-muted" aria-hidden />
                    <dd>{formatExperience(job.experienceMin, job.experienceMax ?? undefined)}</dd>
                  </div>
                  {job.salaryMin !== null && job.salaryMax !== null && (
                    <dd className="tabular">{formatSalary(job.salaryMin, job.salaryMax, job.salaryUnit ?? "LPA")}</dd>
                  )}
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill) => {
                    const match = job.match?.skillMatches.find((entry) => entry.slug === skill.slug);
                    return (
                      <span
                        key={skill.slug}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
                          match?.status === "met"
                            ? "bg-moss-soft text-moss"
                            : match
                              ? "bg-ochre-soft text-ochre"
                              : "bg-paper-2 text-graphite",
                        )}
                      >
                        <span className="font-medium">{skill.name}</span>
                        {/* Same colour as the name: dimming it with opacity drops
                            small text on a tinted chip below 4.5:1. */}
                        <span className="tabular">
                          {skill.importance === "essential" ? "essential · " : ""}
                          {skill.requiredScore}+
                        </span>
                      </span>
                    );
                  })}
                </div>

                {job.match && !job.match.eligible && (
                  <p className="mt-3 text-sm font-medium text-ochre">
                    {job.match.blockingReasons[0] ?? "Some required evidence is missing."}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 px-1 text-xs leading-relaxed text-muted">
        A match is a comparison against recorded evidence, not a hiring decision. Employers make
        their own judgements.
      </p>
    </main>
  );
}
