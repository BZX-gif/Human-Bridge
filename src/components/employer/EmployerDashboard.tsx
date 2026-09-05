"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
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
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      {building && (
        <JobBuilder
          onClose={() => setBuilding(false)}
          onCreated={() => {
            setBuilding(false);
            router.refresh();
          }}
        />
      )}

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{companyName}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Hiring dashboard
            </h1>
          </div>
          <Button onClick={() => setBuilding(true)}>
            <Plus size={16} aria-hidden />
            Post a job
          </Button>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Active jobs" value={active.length} />
          <Metric label="Total jobs" value={jobs.length} />
          <Metric label="Applications" value={applications.length} />
          <Metric
            label="Shortlisted"
            value={applications.filter((a) => a.status === "shortlisted").length}
          />
        </div>

        <section className="mb-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
            <Briefcase size={15} className="text-[#1a56ff]" aria-hidden />
            Your jobs
          </h2>
          {jobs.length === 0 ? (
            <EmptyState
              title="No jobs posted yet"
              message="Create a skill-first job to start matching against verified candidates."
              action={<Button onClick={() => setBuilding(true)}>Post your first job</Button>}
            />
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/employers/jobs/${job.id}/candidates`}
                    className="block rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">{job.title}</h3>
                        <p className="text-xs text-slate-500">
                          {job.location} · {job.workType} · posted{" "}
                          {new Date(job.postedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <Users size={12} aria-hidden />
                          {job.applicantCount} applicant
                          {job.applicantCount === 1 ? "" : "s"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            job.status === "active"
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.requiredSkills.map((skill) => (
                        <span
                          key={skill.slug}
                          className={`rounded-lg border px-2 py-1 text-[11px] ${
                            skill.importance === "essential"
                              ? "border-[#1a56ff]/30 bg-[#eef3ff] text-[#1a56ff]"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {skill.name} {skill.requiredScore}+
                        </span>
                      ))}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {applications.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
              Recent applications
            </h2>
            <ul className="divide-y divide-slate-100">
              {applications.slice(0, 10).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.candidateName}</p>
                    <p className="text-xs text-slate-500">
                      {a.jobTitle} · {new Date(a.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.matchScore !== null && (
                      <span className="text-sm font-bold tabular-nums text-slate-900">
                        {a.matchScore}%
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {a.status}
                    </span>
                    <Link
                      href={`/employers/jobs/${a.jobId}/candidates`}
                      className="text-xs font-semibold text-[#1a56ff] hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
