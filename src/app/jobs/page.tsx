import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase, MapPin } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listJobsWithMatch } from "@/lib/services/job-service";
import { isDatabaseConfigured } from "@/db";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { formatExperience, formatSalary, getWorkTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jobs — Human Bridge",
  description:
    "Jobs with structured skill requirements. See exactly why you match, and exactly what is missing.",
};

export default async function JobsPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="min-h-screen bg-[#f8fafc] pt-16">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Database not configured"
            message="Set DATABASE_URL and run npm run db:seed."
          />
        </div>
      </main>
    );
  }

  const user = await getCurrentUser();
  const jobs = await listJobsWithMatch(user?.id ?? null);

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#1a56ff]">
            Job marketplace
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900">
            Matched on evidence, not keywords.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Every job here defines the skills it needs and the level it needs them at. Your match
            is calculated from your verified evidence — and we always show you the reasoning.
          </p>
          {!user && (
            <div className="mt-6">
              <ButtonLink href="/signup">Sign up to see your match</ButtonLink>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {jobs.length === 0 ? (
          <EmptyState title="No open jobs" message="Check back soon, or run the seed to load demo jobs." />
        ) : (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${job.companyColor ?? "bg-slate-600"}`}
                        aria-hidden
                      >
                        {job.companyInitials}
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-slate-900">
                          {job.title}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {job.companyName}
                          {job.isDemo && (
                            <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                              DEMO
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {job.match && (
                      <div className="shrink-0 text-right">
                        <p
                          className={`text-2xl font-black tabular-nums ${
                            job.match.eligible ? "text-green-600" : "text-amber-600"
                          }`}
                        >
                          {job.match.score}%
                        </p>
                        <p className="text-[11px] text-slate-400">match</p>
                      </div>
                    )}
                  </div>

                  <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} aria-hidden />
                      <dd>
                        {job.location} · {getWorkTypeLabel(job.workType)}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={12} aria-hidden />
                      <dd>{formatExperience(job.experienceMin, job.experienceMax ?? undefined)}</dd>
                    </div>
                    {job.salaryMin !== null && job.salaryMax !== null && (
                      <dd>{formatSalary(job.salaryMin, job.salaryMax, job.salaryUnit ?? "LPA")}</dd>
                    )}
                  </dl>

                  {/* Structured requirements */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {job.requiredSkills.map((skill) => {
                      const match = job.match?.skillMatches.find((m) => m.slug === skill.slug);
                      return (
                        <span
                          key={skill.slug}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] ${
                            match?.status === "met"
                              ? "border-green-200 bg-green-50 text-green-700"
                              : match
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {skill.name}
                          <span className="opacity-60">
                            {skill.importance === "essential" ? "· essential" : ""} {skill.requiredScore}+
                          </span>
                        </span>
                      );
                    })}
                  </div>

                  {job.match && !job.match.eligible && (
                    <p className="mt-3 text-xs font-medium text-amber-700">
                      {job.match.blockingReasons[0]}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
