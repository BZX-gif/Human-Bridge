import Link from "next/link";
import type { Metadata } from "next";
import { DEMO_JOBS, DEMO_USER, calculateMatchScore } from "@/lib/demo-data";
import { MapPin, Clock, Briefcase, TrendingUp, Filter, Search, ChevronRight, Building2 } from "lucide-react";
import { formatSalary, formatExperience, getWorkTypeLabel, getPostedLabel } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Browse Jobs — Human Bridge",
  description: "Find jobs matched to your verified skill profile. See your match percentage before you apply.",
};

const workTypeBadge: Record<string, string> = {
  remote: "bg-green-50 text-green-700 border border-green-100",
  hybrid: "bg-blue-50 text-blue-700 border border-blue-100",
  onsite: "bg-slate-50 text-slate-600 border border-slate-100",
};

export default function JobsPage() {
  const jobsWithMatch = DEMO_JOBS.map(job => ({
    ...job,
    matchScore: calculateMatchScore(DEMO_USER.skills, job.skills),
  })).sort((a, b) => b.matchScore - a.matchScore);

  const companyColors: Record<string, string> = {
    IN: "bg-blue-600",
    RZ: "bg-indigo-600",
    ME: "bg-pink-600",
    GW: "bg-green-600",
    ZH: "bg-orange-600",
  };

  return (
    <main className="pt-16 min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-semibold text-[#1a56ff] uppercase tracking-widest mb-3">Job Marketplace</p>
              <h1 className="text-4xl font-bold text-slate-900 mb-3">
                Jobs matched to
                <br />
                your skills.
              </h1>
              <p className="text-slate-500 text-lg">
                Every job shows your skill match percentage — so you know exactly how competitive you are before applying.
              </p>
            </div>
            {/* Match score banner */}
            <div className="bg-gradient-to-br from-[#1a56ff] to-[#6366f1] rounded-2xl p-5 text-white">
              <p className="text-xs font-semibold text-blue-200 mb-2">YOUR PROFILE — {DEMO_USER.name}</p>
              <p className="text-sm text-blue-100 mb-4">Career target: {DEMO_USER.targetCareer.name}</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Career Ready", value: `${DEMO_USER.careerReadiness}%` },
                  { label: "Skills Verified", value: `${DEMO_USER.skills.filter(s => s.status === "assessed").length}` },
                  { label: "Avg Match", value: `${Math.round(jobsWithMatch.slice(0, 5).reduce((s, j) => s + j.matchScore, 0) / 5)}%` },
                ].map(item => (
                  <div key={item.label} className="bg-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold">{item.value}</p>
                    <p className="text-[11px] text-blue-200">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Search & filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs, companies, skills..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a56ff] focus:ring-2 focus:ring-[#1a56ff]/10"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <Filter size={15} />
              Filters
            </button>
            <select className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 focus:outline-none focus:border-[#1a56ff] transition-colors">
              <option>Best Match</option>
              <option>Newest First</option>
              <option>Highest Salary</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
          <span className="text-amber-600 text-xs mt-0.5">ⓘ</span>
          <p className="text-xs text-amber-800">
            <strong>Sample Data:</strong> Job listings, companies and salaries are illustrative demo content. Match scores are calculated against the demo user profile.
          </p>
        </div>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">
            {jobsWithMatch.length} jobs found{" "}
            <span className="text-slate-400 font-normal">— sorted by your skill match</span>
          </h2>
        </div>

        {/* Job grid */}
        <div className="space-y-4">
          {jobsWithMatch.map((job) => {
            const matchColor =
              job.matchScore >= 85 ? "text-green-600 bg-green-50 border-green-200" :
              job.matchScore >= 70 ? "text-blue-600 bg-blue-50 border-blue-200" :
              job.matchScore >= 55 ? "text-amber-600 bg-amber-50 border-amber-200" :
              "text-slate-600 bg-slate-50 border-slate-200";

            const logoColor = companyColors[job.company.logoInitials] || "bg-slate-600";

            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all card-hover"
              >
                <div className="flex items-start gap-4">
                  {/* Company logo */}
                  <div className={`w-12 h-12 ${logoColor} rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {job.company.logoInitials}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{job.title}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{job.company.name}</p>
                      </div>
                      {/* Match score */}
                      <div className={`text-center px-3 py-2 rounded-xl border shrink-0 ${matchColor}`}>
                        <p className="text-lg font-black leading-none">{job.matchScore}%</p>
                        <p className="text-[10px] font-semibold mt-0.5">Match</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {job.location}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg font-medium ${workTypeBadge[job.workType]}`}>
                        {getWorkTypeLabel(job.workType)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatExperience(job.experienceMin, job.experienceMax)}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatSalary(job.salaryMin, job.salaryMax, job.salaryUnit)}
                      </span>
                      <span className="text-slate-400">{getPostedLabel(job.postedDaysAgo)}</span>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {job.skills.map(({ skill, importance }) => (
                        <span
                          key={skill.id}
                          className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                            importance === "essential"
                              ? "bg-[#e8edff] text-[#1a56ff]"
                              : "bg-slate-50 text-slate-600 border border-slate-100"
                          }`}
                        >
                          {skill.name}
                        </span>
                      ))}
                      <span className="text-xs text-slate-400 flex items-center gap-0.5 ml-1">
                        View Job <ChevronRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 bg-[#f0f4ff] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-100">
          <div>
            <h3 className="font-bold text-slate-900 mb-1">Want higher match scores?</h3>
            <p className="text-sm text-slate-600">Complete your skill assessments to increase your profile strength and match rate.</p>
          </div>
          <Link
            href="/assessments"
            className="inline-flex items-center gap-2 bg-[#1a56ff] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1040cc] transition-colors text-sm shrink-0"
          >
            Take Assessments
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </main>
  );
}
