import Link from "next/link";
import type { Metadata } from "next";
import { DEMO_CAREERS, type Career, getDemandLabel } from "@/lib/demo-data";
import { ChevronRight, TrendingUp, Briefcase, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Explore Careers — Human Bridge",
  description: "Browse high-demand careers, understand what skills each role requires, and discover your path to employment.",
};

const colorMap: Record<string, { bg: string; text: string; dot: string; badge: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", dot: "bg-violet-500", badge: "bg-violet-100 text-violet-700" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700" },
  pink: { bg: "bg-pink-50", text: "text-pink-600", dot: "bg-pink-500", badge: "bg-pink-100 text-pink-700" },
  green: { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500", badge: "bg-green-100 text-green-700" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", dot: "bg-teal-500", badge: "bg-teal-100 text-teal-700" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", dot: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500", badge: "bg-rose-100 text-rose-700" },
};

const demandConfig: Record<string, { color: string; label: string; dot: string }> = {
  very_high: { color: "text-green-700", label: "Very High Demand", dot: "bg-green-500" },
  high: { color: "text-blue-700", label: "High Demand", dot: "bg-blue-500" },
  medium: { color: "text-amber-700", label: "Medium Demand", dot: "bg-amber-500" },
  low: { color: "text-slate-600", label: "Steady Demand", dot: "bg-slate-400" },
};

function CareerCard({ career }: { career: Career }) {
  const colors = colorMap[career.color] || colorMap.blue;
  const demand = demandConfig[career.demandLevel] || demandConfig.high;
  const essentialSkills = career.skills.filter(s => s.importance === "essential").slice(0, 4);
  const topSkills = [...essentialSkills, ...career.skills.filter(s => s.importance === "important")].slice(0, 5);

  return (
    <Link
      href={`/careers/${career.slug}`}
      className="group bg-white border border-slate-100 rounded-2xl p-6 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100 transition-all card-hover flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center shrink-0`}>
          <Briefcase size={22} className={colors.text} />
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${demand.dot} animate-pulse`} />
          <span className={`text-xs font-semibold ${demand.color}`}>{demand.label}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-900 mb-1.5">{career.name}</h3>
      <p className="text-sm text-slate-500 mb-4 leading-relaxed">{career.tagline}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {topSkills.map((cs) => (
          <span
            key={cs.skill.id}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
              cs.importance === "essential" ? colors.badge : "bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            {cs.skill.name}
          </span>
        ))}
        {career.skills.length > 5 && (
          <span className="text-xs px-2 py-1 text-slate-400">+{career.skills.length - 5} more</span>
        )}
      </div>

      {/* Stats */}
      <div className="mt-auto">
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-50">
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Salary</p>
            <p className="text-xs font-bold text-slate-900">₹{career.salaryMin}–{career.salaryMax}L</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Growth</p>
            <p className="text-xs font-bold text-green-600 flex items-center gap-0.5">
              <TrendingUp size={10} />
              {career.growthRate}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-0.5">Jobs</p>
            <p className="text-xs font-bold text-slate-900">{career.totalJobs.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-400">{career.experienceLevel}</span>
          <span className="text-xs font-semibold text-[#1a56ff] flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
            See Skills & Gap
            <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CareersPage() {
  const categories = [
    { label: "All Careers", careers: DEMO_CAREERS },
    { label: "Technology", careers: DEMO_CAREERS.filter(c => ["software-developer", "ui-ux-designer", "product-manager"].includes(c.slug)) },
    { label: "Data & Analytics", careers: DEMO_CAREERS.filter(c => ["data-analyst", "business-analyst"].includes(c.slug)) },
    { label: "Business", careers: DEMO_CAREERS.filter(c => ["sales-executive", "financial-analyst", "hr-executive", "content-strategist"].includes(c.slug)) },
    { label: "Marketing", careers: DEMO_CAREERS.filter(c => ["digital-marketing-executive", "content-strategist"].includes(c.slug)) },
  ];

  return (
    <main className="pt-16 min-h-screen bg-[#f8fafc]">
      {/* Hero */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#1a56ff] uppercase tracking-widest mb-3">Career Explorer</p>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Explore careers that match
              <br />
              your ambitions.
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed">
              Every career shows you exactly what skills employers require — so you know precisely what to learn and prove.
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search careers, skills or titles..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#f8fafc] border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1a56ff] focus:ring-2 focus:ring-[#1a56ff]/10"
              />
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 bg-[#1a56ff] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1040cc] transition-colors text-sm shrink-0"
            >
              Check My Skill Gap
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Careers Mapped", value: "10+" },
            { label: "Skills Tracked", value: "30+" },
            { label: "Open Jobs", value: "18,000+" },
            { label: "Companies", value: "500+" },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-slate-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Demo disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 mb-8">
          <div className="w-4 h-4 shrink-0 mt-0.5 text-amber-600">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-3a.75.75 0 0 1-.75-.75v-3a.75.75 0 0 1 1.5 0v3A.75.75 0 0 1 8 9z" clipRule="evenodd"/>
            </svg>
          </div>
          <p className="text-xs text-amber-800">
            <strong>Sample Data:</strong> Salary ranges, demand levels and job counts are illustrative demo data. Real figures will be updated from verified employer and market data sources.
          </p>
        </div>

        {/* Career Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">All Careers <span className="text-slate-400 font-normal text-base">({DEMO_CAREERS.length})</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEMO_CAREERS.map(career => (
              <CareerCard key={career.id} career={career} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#1a56ff] to-[#6366f1] rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Don&apos;t know which career to choose?</h3>
          <p className="text-blue-100 mb-5">Our AI Career Copilot analyses your background, interests and skills to recommend the right career path for you.</p>
          <Link
            href="/ai-copilot"
            className="inline-flex items-center gap-2 bg-white text-[#1a56ff] font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
          >
            Ask AI Career Copilot
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
