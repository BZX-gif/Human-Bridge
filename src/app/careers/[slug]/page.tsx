import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEMO_CAREERS, DEMO_JOBS, getCareerBySlug, type Career } from "@/lib/demo-data";
import { ArrowRight, ChevronRight, Briefcase, TrendingUp, Clock, MapPin, Building2 } from "lucide-react";
import { formatSalary, formatExperience, getWorkTypeLabel } from "@/lib/utils";

export async function generateStaticParams() {
  return DEMO_CAREERS.map(c => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const career = getCareerBySlug(slug);
  if (!career) return { title: "Career Not Found" };
  return {
    title: `${career.name} Career Guide — Human Bridge`,
    description: career.description,
  };
}

const importanceConfig = {
  essential: {
    label: "Essential",
    dot: "bg-[#1a56ff]",
    badge: "bg-[#e8edff] text-[#1a56ff] border border-blue-100",
    bar: "bg-[#1a56ff]",
    width: "w-full",
  },
  important: {
    label: "Important",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border border-amber-100",
    bar: "bg-amber-400",
    width: "w-4/5",
  },
  helpful: {
    label: "Helpful",
    dot: "bg-slate-400",
    badge: "bg-slate-50 text-slate-600 border border-slate-100",
    bar: "bg-slate-300",
    width: "w-3/5",
  },
};

const colorMap: Record<string, { bg: string; text: string; light: string }> = {
  blue: { bg: "bg-blue-600", text: "text-blue-600", light: "bg-blue-50" },
  violet: { bg: "bg-violet-600", text: "text-violet-600", light: "bg-violet-50" },
  orange: { bg: "bg-orange-500", text: "text-orange-600", light: "bg-orange-50" },
  pink: { bg: "bg-pink-500", text: "text-pink-600", light: "bg-pink-50" },
  green: { bg: "bg-green-600", text: "text-green-600", light: "bg-green-50" },
  teal: { bg: "bg-teal-600", text: "text-teal-600", light: "bg-teal-50" },
  indigo: { bg: "bg-indigo-600", text: "text-indigo-600", light: "bg-indigo-50" },
  emerald: { bg: "bg-emerald-600", text: "text-emerald-600", light: "bg-emerald-50" },
  amber: { bg: "bg-amber-500", text: "text-amber-600", light: "bg-amber-50" },
  rose: { bg: "bg-rose-500", text: "text-rose-600", light: "bg-rose-50" },
};

function groupSkillsByCategory(career: Career) {
  const groups: Record<string, typeof career.skills> = {};
  for (const cs of career.skills) {
    const cat = cs.categoryLabel || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(cs);
  }
  return groups;
}

export default async function CareerDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const career = getCareerBySlug(slug);
  if (!career) notFound();

  const colors = colorMap[career.color] || colorMap.blue;
  const skillGroups = groupSkillsByCategory(career);
  const relatedJobs = DEMO_JOBS.filter(j => j.career.id === career.id).slice(0, 3);

  return (
    <main className="pt-16 min-h-screen bg-[#f8fafc]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link href="/careers" className="hover:text-slate-600 transition-colors">Careers</Link>
            <ChevronRight size={14} />
            <span className="text-slate-700 font-medium">{career.name}</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-14 h-14 ${colors.light} rounded-2xl flex items-center justify-center`}>
                  <Briefcase size={26} className={colors.text} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Career</p>
                  <h1 className="text-2xl font-bold text-slate-900">{career.name}</h1>
                </div>
              </div>

              <p className={`text-xl font-medium ${colors.text} mb-4`}>{career.tagline}</p>

              <p className="text-slate-600 leading-relaxed mb-6 max-w-2xl">
                {career.whatThisRoleDoes}
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <TrendingUp size={15} className="text-green-500" />
                  {career.growthRate} growth
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Briefcase size={15} className="text-blue-500" />
                  {career.totalJobs.toLocaleString()} open jobs
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock size={15} className="text-amber-500" />
                  {career.experienceLevel}
                </div>
              </div>
            </div>

            {/* Right: Stats card */}
            <div className="bg-[#f8fafc] rounded-2xl p-5 border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Overview</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Typical Salary</p>
                  <p className="text-lg font-bold text-slate-900">
                    {formatSalary(career.salaryMin, career.salaryMax, career.salaryUnit)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Sample data — varies by company and location</p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-400 mb-1">Demand Level</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      career.demandLevel === "very_high" ? "bg-green-500" :
                      career.demandLevel === "high" ? "bg-blue-500" :
                      career.demandLevel === "medium" ? "bg-amber-500" : "bg-slate-400"
                    }`} />
                    <p className="text-sm font-semibold text-slate-900">
                      {career.demandLevel === "very_high" ? "Very High" :
                       career.demandLevel === "high" ? "High" :
                       career.demandLevel === "medium" ? "Medium" : "Steady"}
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-400 mb-1">Skills Required</p>
                  <p className="text-sm font-semibold text-slate-900">{career.skills.length} key skills</p>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-400 mb-1">Career Stages</p>
                  <p className="text-sm font-semibold text-slate-900">{career.careerPathway.length} levels</p>
                </div>
              </div>
              <Link
                href="/onboarding"
                className={`mt-5 block w-full text-center py-3 rounded-xl text-sm font-semibold text-white ${colors.bg} hover:opacity-90 transition-opacity`}
              >
                Check My Skill Gap
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Skills Required */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Skills Required</h2>

              {Object.entries(skillGroups).map(([category, skills]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{category}</h3>
                  <div className="space-y-3">
                    {skills.map(({ skill, importance }) => {
                      const imp = importanceConfig[importance];
                      return (
                        <div key={skill.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${imp.dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-800">{skill.name}</span>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${imp.badge} ml-2 shrink-0`}>
                                  {imp.label}
                                </span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${imp.bar} ${imp.width}`} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="mt-6 pt-5 border-t border-slate-50">
                <div className="flex flex-wrap gap-3">
                  {Object.entries(importanceConfig).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${val.dot}`} />
                      <span className="text-xs text-slate-500">{val.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What the Role Does */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Typical Requirements</h2>
              <ul className="space-y-3">
                {career.typicalRequirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <div className={`w-5 h-5 ${colors.light} rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
                      <span className={`text-[10px] font-bold ${colors.text}`}>{i + 1}</span>
                    </div>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-900">Open {career.name} Jobs</h2>
                  <Link href="/jobs" className="text-sm font-medium text-[#1a56ff] hover:text-[#1040cc] transition-colors">
                    View all →
                  </Link>
                </div>
                <div className="space-y-4">
                  {relatedJobs.map(job => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block p-4 bg-[#f8fafc] rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-white transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">{job.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{job.company.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">
                            {formatSalary(job.salaryMin, job.salaryMax, job.salaryUnit)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                        <span>{getWorkTypeLabel(job.workType)}</span>
                        <span>{formatExperience(job.experienceMin, job.experienceMax)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Career Pathway + Sidebar */}
          <div className="space-y-6">
            {/* Career Pathway */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-5">Career Pathway</h2>
              <div className="space-y-0">
                {career.careerPathway.map((step, i) => (
                  <div key={i} className="relative">
                    <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${i === 1 ? `${colors.light} border border-current border-opacity-20` : "hover:bg-slate-50"}`}>
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        i === 0 ? "border-slate-300 bg-white" :
                        i === 1 ? `border-current ${colors.text} ${colors.light}` :
                        "border-slate-200 bg-slate-50"
                      }`}>
                        <span className={`text-[10px] font-bold ${i === 1 ? colors.text : "text-slate-400"}`}>
                          {i + 1}
                        </span>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${i === 1 ? colors.text : "text-slate-700"}`}>
                          {step.title}
                          {i === 1 && <span className="ml-2 text-[10px] bg-current bg-opacity-10 px-1.5 py-0.5 rounded-full font-medium">Target</span>}
                        </p>
                        <p className="text-xs text-slate-400">{step.yearsExperience}</p>
                      </div>
                    </div>
                    {i < career.careerPathway.length - 1 && (
                      <div className="ml-[22px] flex justify-start">
                        <div className="w-0.5 h-4 bg-slate-100 ml-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Check Skill Gap CTA */}
            <div className={`${colors.light} rounded-2xl p-5 border border-current border-opacity-10`}>
              <h3 className={`font-bold ${colors.text} mb-2`}>Ready to get started?</h3>
              <p className="text-sm text-slate-600 mb-4">
                Check your current skill level against what {career.name} roles require.
              </p>
              <Link
                href="/onboarding"
                className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white ${colors.bg} hover:opacity-90 transition-opacity`}
              >
                Check My Skill Gap
                <ArrowRight size={14} className="inline ml-1.5" />
              </Link>
            </div>

            {/* Other Careers */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Explore Similar Careers</h3>
              <div className="space-y-2">
                {DEMO_CAREERS.filter(c => c.id !== career.id).slice(0, 4).map(c => (
                  <Link
                    key={c.id}
                    href={`/careers/${c.slug}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{c.name}</span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
