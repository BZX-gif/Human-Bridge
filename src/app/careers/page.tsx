import Link from "next/link";
import type { Metadata } from "next";
import { Briefcase, ChevronRight, TrendingUp } from "lucide-react";
import { listCareers } from "@/lib/services/career-service";
import { isDatabaseConfigured } from "@/db";
import { EmptyState } from "@/components/ui/States";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore careers — Human Bridge",
  description:
    "Browse careers, see the skills each role actually requires, and find the path from where you are to employment.",
};

const DEMAND_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  very_high: { label: "Very high demand", color: "text-green-700", dot: "bg-green-500" },
  high: { label: "High demand", color: "text-blue-700", dot: "bg-blue-500" },
  moderate: { label: "Moderate demand", color: "text-amber-700", dot: "bg-amber-500" },
  low: { label: "Low demand", color: "text-slate-600", dot: "bg-slate-400" },
};

export default async function CareersPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="min-h-screen bg-[#f8fafc] pt-16">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Database not configured"
            message="Set DATABASE_URL and run npm run db:seed to load the career catalogue."
          />
        </div>
      </main>
    );
  }

  const careers = await listCareers();

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#1a56ff]">
            Career explorer
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900">
            Start from the role. Work backwards to the skills.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Each career here is defined by a structured set of skills with required levels. Pick a
            target and Human Bridge will show you your gap and how to prove you have closed it.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {careers.length === 0 ? (
          <EmptyState
            title="No careers loaded"
            message="Run npm run db:seed to populate the career catalogue."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {careers.map((career) => {
              const demand = DEMAND_LABELS[career.demandLevel ?? "moderate"] ?? DEMAND_LABELS.moderate;
              return (
                <li key={career.id}>
                  <Link
                    href={`/careers/${career.slug}`}
                    className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h2 className="font-bold text-slate-900">{career.name}</h2>
                      <ChevronRight size={16} className="mt-0.5 shrink-0 text-slate-300" aria-hidden />
                    </div>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-600">
                      {career.description}
                    </p>
                    <dl className="space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${demand.dot}`} aria-hidden />
                        <dd className={demand.color}>{demand.label}</dd>
                      </div>
                      {career.salaryMin !== null && career.salaryMax !== null && (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp size={12} aria-hidden />
                          <dd>
                            {career.salaryMin}–{career.salaryMax} {career.salaryUnit ?? "LPA"}
                          </dd>
                        </div>
                      )}
                      {career.experienceLevel && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase size={12} aria-hidden />
                          <dd>{career.experienceLevel}</dd>
                        </div>
                      )}
                    </dl>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-8 text-xs leading-relaxed text-slate-500">
          Salary and demand figures are indicative market context for orientation only. They are
          not offers, guarantees or predictions about your outcome.
        </p>
      </div>
    </main>
  );
}
