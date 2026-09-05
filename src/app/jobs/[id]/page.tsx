import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_JOBS, DEMO_USER, calculateMatchScore } from "@/lib/demo-data";
import { MapPin, Clock, Briefcase, ChevronRight, Building2, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { formatSalary, formatExperience, getWorkTypeLabel, getPostedLabel } from "@/lib/utils";

export async function generateStaticParams() {
  return DEMO_JOBS.map(j => ({ id: String(j.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = DEMO_JOBS.find(j => j.id === parseInt(id));
  if (!job) return { title: "Job Not Found" };
  return {
    title: `${job.title} at ${job.company.name} — Human Bridge`,
    description: job.description,
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = DEMO_JOBS.find(j => j.id === parseInt(id));
  if (!job) notFound();

  const matchScore = calculateMatchScore(DEMO_USER.skills, job.skills);
  const userSkillIds = new Set(DEMO_USER.skills.map(s => s.skill.id));

  const companyColors: Record<string, string> = {
    IN: "bg-blue-600",
    RZ: "bg-indigo-600",
    ME: "bg-pink-600",
    GW: "bg-green-600",
    ZH: "bg-orange-600",
  };
  const logoColor = companyColors[job.company.logoInitials] || "bg-slate-600";

  const matchColor =
    matchScore >= 85 ? { text: "text-green-600", bg: "bg-green-50", border: "border-green-200", bar: "bg-green-500" } :
    matchScore >= 70 ? { text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", bar: "bg-[#1a56ff]" } :
    matchScore >= 55 ? { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", bar: "bg-amber-500" } :
    { text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", bar: "bg-slate-400" };

  const matchLabel =
    matchScore >= 85 ? "Excellent Match" :
    matchScore >= 70 ? "Good Match" :
    matchScore >= 55 ? "Partial Match" :
    "Developing";

  return (
    <main className="pt-16 min-h-screen bg-[#f8fafc]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link href="/jobs" className="hover:text-slate-600 transition-colors">Jobs</Link>
            <ChevronRight size={14} />
            <span className="text-slate-700 font-medium">{job.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-14 h-14 ${logoColor} rounded-2xl flex items-center justify-center text-white font-bold text-base shrink-0`}>
                  {job.company.logoInitials}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">{job.title}</h1>
                  <p className="text-slate-500">{job.company.name}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><MapPin size={14} />{job.location}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} />{formatExperience(job.experienceMin, job.experienceMax)}</span>
                <span className="flex items-center gap-1.5"><Briefcase size={14} />{getWorkTypeLabel(job.workType)}</span>
                <span className="font-semibold text-slate-900">{formatSalary(job.salaryMin, job.salaryMax, job.salaryUnit)}</span>
                <span className="text-slate-400">Posted {getPostedLabel(job.postedDaysAgo)}</span>
              </div>

              <p className="text-slate-600 leading-relaxed mb-5">{job.description}</p>

              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Sample job listing — not a real opening. Demo data only.
              </div>
            </div>

            {/* Your Match */}
            <div className={`${matchColor.bg} rounded-2xl border ${matchColor.border} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Your Match Score</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-4xl font-black ${matchColor.text}`}>{matchScore}%</span>
                    <span className={`text-sm font-semibold ${matchColor.text}`}>{matchLabel}</span>
                  </div>
                </div>
                <div className={`w-20 h-20 rounded-full border-4 ${matchColor.border} flex items-center justify-center`}>
                  <span className={`text-2xl font-black ${matchColor.text}`}>{matchScore}</span>
                </div>
              </div>

              <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-4">
                <div className={`h-full rounded-full ${matchColor.bar} transition-all`} style={{ width: `${matchScore}%` }} />
              </div>

              <h3 className="text-sm font-bold text-slate-800 mb-3">Skill Breakdown:</h3>
              <div className="space-y-2.5">
                {job.skills.map(({ skill, importance }) => {
                  const userSkill = DEMO_USER.skills.find(us => us.skill.id === skill.id);
                  const hasSkill = !!userSkill;
                  const proficiency = userSkill?.proficiency || 0;

                  return (
                    <div key={skill.id} className="flex items-center gap-3">
                      {hasSkill ? (
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle size={16} className="text-amber-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-800">{skill.name}</span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs text-slate-400">{importance}</span>
                            {hasSkill && <span className="text-xs font-bold text-slate-700">{proficiency}%</span>}
                          </div>
                        </div>
                        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${proficiency >= 75 ? "bg-green-500" : proficiency >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                            style={{ width: `${proficiency}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {matchScore < 80 && (
                <div className="mt-4 pt-4 border-t border-white/50">
                  <p className="text-sm font-semibold text-slate-800 mb-2">To improve your match:</p>
                  <div className="flex gap-2">
                    <Link
                      href="/assessments"
                      className="text-xs font-semibold text-white bg-[#1a56ff] px-3 py-1.5 rounded-lg hover:bg-[#1040cc] transition-colors"
                    >
                      Take Assessments
                    </Link>
                    <Link
                      href="/dashboard"
                      className="text-xs font-semibold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      View Roadmap
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Required Skills */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">Required Skills</h2>
              <div className="space-y-3">
                {job.skills.map(({ skill, importance }) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${
                        importance === "essential" ? "bg-[#1a56ff]" :
                        importance === "important" ? "bg-amber-400" : "bg-slate-300"
                      }`} />
                      <span className="text-sm font-medium text-slate-800">{skill.name}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      importance === "essential" ? "bg-[#e8edff] text-[#1a56ff]" :
                      importance === "important" ? "bg-amber-50 text-amber-700" :
                      "bg-slate-50 text-slate-600"
                    }`}>
                      {importance.charAt(0).toUpperCase() + importance.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Apply card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-20">
              <div className={`text-center p-4 rounded-xl ${matchColor.bg} border ${matchColor.border} mb-4`}>
                <p className={`text-3xl font-black ${matchColor.text}`}>{matchScore}%</p>
                <p className="text-sm text-slate-600 font-medium">Your Match</p>
              </div>

              <Link
                href="/passport"
                className="block w-full text-center bg-[#1a56ff] text-white font-semibold py-3 rounded-xl hover:bg-[#1040cc] transition-colors text-sm mb-3"
              >
                Apply with Skill Passport
              </Link>
              <button className="block w-full text-center bg-[#f8fafc] text-slate-600 font-semibold py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors text-sm">
                Save Job
              </button>

              <div className="mt-4 pt-4 border-t border-slate-50 space-y-2 text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>Salary</span>
                  <span className="font-semibold text-slate-900">{formatSalary(job.salaryMin, job.salaryMax, job.salaryUnit)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Work type</span>
                  <span className="font-semibold text-slate-900">{getWorkTypeLabel(job.workType)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Experience</span>
                  <span className="font-semibold text-slate-900">{formatExperience(job.experienceMin, job.experienceMax)}</span>
                </div>
              </div>
            </div>

            {/* Company card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">About {job.company.name}</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${logoColor} rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {job.company.logoInitials}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{job.company.name}</p>
                  <p className="text-xs text-slate-500">{job.company.industry}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <p><span className="font-medium text-slate-700">Size:</span> {job.company.size}</p>
                <p><span className="font-medium text-slate-700">Location:</span> {job.company.location}</p>
                {job.company.verified && (
                  <p className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle2 size={12} />
                    Verified Company
                  </p>
                )}
              </div>
            </div>

            {/* Similar jobs */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Similar Jobs</h3>
              <div className="space-y-2">
                {DEMO_JOBS.filter(j => j.career.id === job.career.id && j.id !== job.id).slice(0, 3).map(j => (
                  <Link key={j.id} href={`/jobs/${j.id}`} className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <p className="text-sm font-medium text-slate-800">{j.title}</p>
                    <p className="text-xs text-slate-400">{j.company.name} · {formatSalary(j.salaryMin, j.salaryMax, j.salaryUnit)}</p>
                  </Link>
                ))}
                {DEMO_JOBS.filter(j => j.career.id === job.career.id && j.id !== job.id).length === 0 && (
                  <div className="space-y-2">
                    {DEMO_JOBS.filter(j => j.id !== job.id).slice(0, 2).map(j => (
                      <Link key={j.id} href={`/jobs/${j.id}`} className="block p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                        <p className="text-sm font-medium text-slate-800">{j.title}</p>
                        <p className="text-xs text-slate-400">{j.company.name}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
