"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, ChevronRight, Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Panel, SectionHeader, Stat } from "@/components/ui/AppPage";
import { cn } from "@/lib/utils";
import { JobBuilder } from "./JobBuilder";

export interface EmployerJob {
  id: number;
  title: string;
  status: string;
  location: string;
  workType: string;
  postedAt: string;
  requiredSkills: {
    slug: string;
    name: string;
    importance: string;
    requiredScore: number;
  }[];
  applicantCount: number;
}

export interface EmployerApplication {
  id: number;
  status: string;
  matchScore: number | null;
  appliedAt: string;
  jobId: number;
  jobTitle: string;
  candidateName: string;
}

interface Props {
  companyName: string;
  jobs: EmployerJob[];
  applications: EmployerApplication[];
}

export function EmployerDashboard({ companyName, jobs, applications }: Props) {
  const router = useRouter();
  const [building, setBuilding] = useState(false);

  const active = jobs.filter((j) => j.status === "active");

  return (
    <main id="main-content" className="app-page">
      {building && (
        <JobBuilder
          onClose={() => setBuilding(false)}
          onCreated={() => {
            setBuilding(false);
            router.refresh();
          }}
        />
      )}

      {/* Anchor targets for the sidebar shortcuts "Post a role" and "Candidates". */}
      <span id="post" aria-hidden />
      <PageHeader
        eyebrow={companyName}
        title="Hiring dashboard"
        description="Every candidate is ranked on verified evidence against the requirements you set."
        actions={
          <Button size="md" onClick={() => setBuilding(true)}>
            <Plus size={16} aria-hidden />
            Post a job
          </Button>
        }
      />

      <div className="stagger mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Active jobs" value={active.length} />
        <Stat label="Total jobs" value={jobs.length} />
        <Stat label="Applications" value={applications.length} />
        <Stat label="Shortlisted" value={applications.filter((a) => a.status === "shortlisted").length} />
      </div>

      <section className="app-section" id={applications.length === 0 ? "candidates" : undefined}>
        <SectionHeader
          title={
            <span className="flex items-center gap-2.5">
              <Briefcase size={20} className="text-link" aria-hidden />
              Your jobs
            </span>
          }
          action={
            jobs.length > 0 ? (
              <span className="tabular text-sm text-muted">
                {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
              </span>
            ) : undefined
          }
        />
        <div className="mt-4">
          {jobs.length === 0 ? (
            <EmptyState
              title="No jobs posted yet"
              message="Create a skill-first job to start matching against verified candidates."
              action={
                <Button size="md" onClick={() => setBuilding(true)}>
                  Post your first job
                </Button>
              }
              icon={<Briefcase size={20} aria-hidden />}
            />
          ) : (
            <ul className="space-y-3 sm:space-y-4">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/employers/jobs/${job.id}/candidates`}
                    className="hb-card hb-card-interactive group block p-5 sm:p-7"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-3">
                      <div className="min-w-0">
                        <h3 className="text-xl font-semibold leading-snug tracking-[-0.02em] text-ink">
                          {job.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                          {job.location} · <span className="capitalize">{job.workType}</span> · posted{" "}
                          {formatDate(job.postedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="tabular inline-flex items-center gap-1.5 text-sm font-medium text-graphite">
                          <Users size={15} className="text-muted" aria-hidden />
                          {job.applicantCount} applicant
                          {job.applicantCount === 1 ? "" : "s"}
                        </span>
                        <Badge variant={job.status === "active" ? "green" : "default"} className="capitalize">
                          {job.status}
                        </Badge>
                        <ChevronRight
                          size={18}
                          className="text-field transition-transform duration-300 ease-apple group-hover:translate-x-0.5 group-hover:text-ink"
                          aria-hidden
                        />
                      </div>
                    </div>
                    {job.requiredSkills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {job.requiredSkills.map((skill) => (
                          <span
                            key={skill.slug}
                            className={cn(
                              "tabular rounded-full px-2.5 py-1 text-xs",
                              skill.importance === "essential"
                                ? "bg-ink font-medium text-paper"
                                : "bg-paper-2 text-graphite",
                            )}
                          >
                            {skill.name} {skill.requiredScore}+
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {applications.length > 0 && (
        <Panel className="app-section" id="candidates">
          <SectionHeader title="Recent applications" />
          <ul className="mt-3 divide-y divide-line">
            {applications.slice(0, 10).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="hb-avatar h-10 w-10 text-sm" aria-hidden>
                    {initials(a.candidateName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-ink">{a.candidateName}</p>
                    <p className="truncate text-sm text-muted">
                      {a.jobTitle} · {formatDate(a.appliedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5">
                  {a.matchScore !== null && (
                    <span className="tabular text-lg font-semibold text-ink">{a.matchScore}%</span>
                  )}
                  <Badge className="capitalize">{a.status}</Badge>
                  <Link href={`/employers/jobs/${a.jobId}/candidates`} className="hb-link text-sm">
                    Review
                    <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </main>
  );
}

/**
 * Fixed locale and time zone: the server render and the browser must produce
 * the same text, whatever the viewer's own locale is.
 */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(iso: string | Date): string {
  return DATE_FORMAT.format(new Date(iso));
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
