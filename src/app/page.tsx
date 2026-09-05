import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertCircle, Briefcase, Users, BarChart3, BookOpen, Award, Zap, ChevronRight, TrendingUp, Star } from "lucide-react";
import { listCareers } from "@/lib/services/career-service";
import { isDatabaseConfigured } from "@/db";

const bridgeSteps = [
  { label: "Job", sub: "What employers need", color: "bg-[#1a56ff]" },
  { label: "Skills", sub: "Required abilities", color: "bg-violet-600" },
  { label: "Your Skills", sub: "Where you stand", color: "bg-indigo-500" },
  { label: "Skill Gap", sub: "What's missing", color: "bg-amber-500" },
  { label: "Learning", sub: "Build the gap", color: "bg-orange-500" },
  { label: "Proof", sub: "Show what you can do", color: "bg-green-600" },
  { label: "Employment", sub: "Get hired", color: "bg-emerald-600" },
];

const howItWorks = [
  {
    step: "01",
    title: "Discover",
    description: "Explore real careers and understand what each role actually requires — not just job titles.",
    icon: Briefcase,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    step: "02",
    title: "Understand",
    description: "See exactly which skills each job requires, organised by importance: essential, important and helpful.",
    icon: BarChart3,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    step: "03",
    title: "Assess",
    description: "Evaluate your current skills honestly. Not through self-reporting alone — through real tasks and scenarios.",
    icon: CheckCircle2,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    step: "04",
    title: "Build",
    description: "Follow a personalised roadmap to close your specific skill gaps. Targeted, efficient, employment-focused.",
    icon: BookOpen,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    step: "05",
    title: "Prove",
    description: "Complete practical projects and assessments. Show employers what you can actually do — not just claim.",
    icon: Award,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    step: "06",
    title: "Get Hired",
    description: "Match with employers who need your exact skill profile. Apply with a verified Skill Passport, not just a resume.",
    icon: Zap,
    color: "text-green-600",
    bg: "bg-green-50",
  },
];


const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
  violet: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
  pink: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-100" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-100" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" },
};

const demandColors: Record<string, string> = {
  very_high: "text-green-600",
  high: "text-blue-600",
  medium: "text-amber-600",
  low: "text-slate-500",
};

const demandLabels: Record<string, string> = {
  very_high: "Very High Demand",
  high: "High Demand",
  medium: "Medium Demand",
  low: "Steady Demand",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featuredCareers = isDatabaseConfigured() ? (await listCareers()).slice(0, 6) : [];

  return (
    <main className="pt-16">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col justify-center overflow-hidden bg-white">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(26,86,255,0.06),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#e8edff] text-[#1a56ff] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Star size={12} fill="currentColor" />
                Career-to-Employment Infrastructure
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-[1.08] tracking-tight mb-6">
                Don&apos;t Just Find
                <br />
                a Job.{" "}
                <span className="gradient-text">Become Ready</span>
                <br />
                for One.
              </h1>

              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Human Bridge connects the skills companies need with the people ready to build them. Find the gap, close the gap, and prove it with real work.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/careers"
                  className="inline-flex items-center justify-center gap-2 bg-[#1a56ff] text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-[#1040cc] transition-colors text-sm shadow-lg shadow-blue-500/20"
                >
                  Explore Careers
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/employers"
                  className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-6 py-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm"
                >
                  I&apos;m Hiring
                </Link>
              </div>

              {/* What we will and will not claim */}
              <div className="flex items-start gap-2 text-sm text-slate-500">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-500" aria-hidden />
                <span>
                  No placement guarantees and no invented statistics. Human Bridge is early — what
                  we offer is a real work simulation, a defense round, and evidence you own.
                </span>
              </div>
            </div>

            {/* Right: Bridge visual */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(26,86,255,0.12),transparent_70%)] blur-2xl" />

                <div className="relative bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 p-6 w-72">
                  <div className="text-center mb-5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Journey</span>
                  </div>
                  <div className="space-y-0">
                    {bridgeSteps.map((step, i) => (
                      <div key={i} className="relative">
                        <div className={`flex items-center gap-3 p-3 rounded-xl ${i === 3 ? "bg-amber-50 border border-amber-100" : "hover:bg-slate-50"} transition-colors`}>
                          <div className={`w-2 h-2 rounded-full ${step.color} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${i === 3 ? "text-amber-700" : "text-slate-900"}`}>{step.label}</p>
                            <p className={`text-[11px] ${i === 3 ? "text-amber-600" : "text-slate-400"}`}>{step.sub}</p>
                          </div>
                          {i === 6 && (
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Goal</span>
                          )}
                          {i === 3 && (
                            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Gap</span>
                          )}
                        </div>
                        {i < bridgeSteps.length - 1 && (
                          <div className="flex justify-center my-0.5">
                            <div className="w-px h-4 bg-gradient-to-b from-slate-200 to-transparent" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── The Problem ─────────────────────────────────────────────────── */}
      <section className="bg-slate-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">The Problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              The employment gap is real.
              <br />
              <span className="text-slate-400">And it&apos;s growing.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Millions of capable people can&apos;t prove what they know. Thousands of companies can&apos;t find who they need. Human Bridge exists to solve this.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: People have */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="w-10 h-10 bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
                <Users size={20} className="text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-4">People have…</h3>
              <ul className="space-y-2.5 mb-6">
                {["Degrees and ambition", "Potential and drive", "Years of education", "A desire to succeed"].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-green-400">
                    <CheckCircle2 size={14} />
                    {item}
                  </li>
                ))}
              </ul>
              <h3 className="font-semibold text-slate-300 mb-4">But often lack…</h3>
              <ul className="space-y-2.5">
                {["Practical, job-ready skills", "Career clarity and direction", "Employer visibility", "Proof of ability"].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-red-400">
                    <AlertCircle size={14} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Center: Bridge */}
            <div className="bg-gradient-to-b from-[#1a56ff] to-[#6366f1] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="mb-6">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="text-white">
                  <path d="M10 48C10 48 10 32 22 28C34 24 46 28 46 12" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="10" cy="48" r="5" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="2"/>
                  <circle cx="46" cy="12" r="5" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Human Bridge</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                Connects both sides. Bridges the gap between potential and employment.
              </p>
              <div className="text-xs text-blue-200 font-mono bg-blue-900/30 rounded-lg px-4 py-3 leading-loose">
                PERSON<br/>↓<br/>CAREER<br/>↓<br/>SKILL GAP<br/>↓<br/>LEARNING<br/>↓<br/>VERIFIED SKILLS<br/>↓<br/>JOB MATCH<br/>↓<br/>EMPLOYMENT
              </div>
            </div>

            {/* Right: Companies */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="w-10 h-10 bg-green-900/50 rounded-xl flex items-center justify-center mb-4">
                <Briefcase size={20} className="text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-4">Companies have…</h3>
              <ul className="space-y-2.5 mb-6">
                {["Open positions to fill", "Required skill sets", "Hiring budgets allocated", "Growth targets to hit"].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-green-400">
                    <CheckCircle2 size={14} />
                    {item}
                  </li>
                ))}
              </ul>
              <h3 className="font-semibold text-slate-300 mb-4">But struggle to find…</h3>
              <ul className="space-y-2.5">
                {["Job-ready candidates", "Verified skill sets", "Efficient screening", "The right cultural fit"].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-red-400">
                    <AlertCircle size={14} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-[#1a56ff] uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              From ambition to employment.
              <br />
              <span className="text-slate-400">In six clear steps.</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Human Bridge walks you through every stage of becoming genuinely employable — not just application-ready.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {howItWorks.map((item) => (
              <div key={item.step} className="group p-6 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all card-hover bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center`}>
                    <item.icon size={20} className={item.color} />
                  </div>
                  <span className="text-3xl font-black text-slate-100">{item.step}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-[#1a56ff] text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-[#1040cc] transition-colors text-sm shadow-lg shadow-blue-500/20"
            >
              Start Your Journey
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Featured Careers ─────────────────────────────────────────────── */}
      <section className="bg-[#f8fafc] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-[#1a56ff] uppercase tracking-widest mb-2">Careers</p>
              <h2 className="text-3xl font-bold text-slate-900">
                Explore high-demand careers.
              </h2>
              <p className="text-slate-500 mt-2">Each career shows exactly what skills you need and where you stand.</p>
            </div>
            <Link href="/careers" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#1a56ff] hover:text-[#1040cc] transition-colors">
              View all careers
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredCareers.map((career) => {
              const colors = colorMap[career.color ?? "blue"] || colorMap.blue;
              const demandColor = demandColors[career.demandLevel ?? "high"] ?? demandColors.high;
              const demandLabel = demandLabels[career.demandLevel ?? "high"] ?? demandLabels.high;

              return (
                <Link
                  key={career.id}
                  href={`/careers/${career.slug}`}
                  className="group bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all card-hover"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center text-lg`}>
                      <span className={colors.text} aria-hidden>&#9889;</span>
                    </div>
                    <span className={`text-xs font-semibold ${demandColor}`}>{demandLabel}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 mb-1">{career.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{career.tagline}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div>
                      <p className="text-xs text-slate-400">Indicative range</p>
                      <p className="text-sm font-bold text-slate-900">
                        {career.salaryMin}&ndash;{career.salaryMax} {career.salaryUnit}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#1a56ff] flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                      See skills
                      <ChevronRight size={12} aria-hidden />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link href="/careers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a56ff]">
              View all careers
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Skill Passport ───────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Passport preview */}
            <div className="order-2 lg:order-1">
              <div className="bg-slate-900 rounded-2xl p-6 text-white max-w-sm mx-auto shadow-2xl shadow-slate-900/30">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-0.5">
                      SKILL PASSPORT
                      <span className="ml-2 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                        DEMO
                      </span>
                    </p>
                    <p className="text-xs text-[#1a56ff] font-semibold">Illustrative example</p>
                  </div>
                  <div className="w-8 h-8 bg-[#1a56ff] rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                      <path d="M3 14C3 14 3 10 6.5 9C10 8 14 9 14 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="3" cy="14" r="1.5" fill="white"/>
                      <circle cx="14" cy="4" r="1.5" fill="white"/>
                    </svg>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 bg-[#1a56ff] rounded-full flex items-center justify-center font-bold text-white">
                    AS
                  </div>
                  <div>
                    <p className="font-bold text-white">Aditya Sharma</p>
                    <p className="text-sm text-slate-400">Data Analyst</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-slate-400">Career Readiness</span>
                    <span className="text-xs font-bold text-white">82%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1a56ff] rounded-full" style={{ width: "82%" }} />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-400 mb-2">VERIFIED SKILLS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["SQL ✓", "Excel ✓", "Power BI ✓", "Analysis ✓", "Comms ✓"].map(skill => (
                      <span key={skill} className="text-xs bg-slate-800 text-green-400 border border-slate-700 px-2 py-1 rounded-lg">{skill}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-2">ASSESSMENTS</p>
                  <div className="space-y-1.5">
                    {[
                      { name: "SQL Assessment", score: "91%" },
                      { name: "Data Analysis", score: "87%" },
                    ].map(a => (
                      <div key={a.name} className="flex justify-between">
                        <span className="text-xs text-slate-300">{a.name}</span>
                        <span className="text-xs font-bold text-[#1a56ff]">{a.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Copy */}
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold text-[#1a56ff] uppercase tracking-widest mb-3">Skill Passport</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                A profile that shows
                <br />
                what you can actually do.
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-6">
                Degrees tell employers what you studied. The Human Bridge Skill Passport shows what you can do — with real assessments, completed projects and verified skills.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Skills verified by real assessments — not self-reported",
                  "Projects that prove practical ability",
                  "Shareable public URL: humanbridge.com/p/you",
                  "Career readiness score that updates as you grow",
                  "Visible to employers looking for your skill profile",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/passport"
                className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors text-sm"
              >
                View Skill Passport
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── For Employers ───────────────────────────────────────────────── */}
      <section className="bg-[#f8fafc] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-10 md:p-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#1a56ff]/10 rounded-full blur-3xl" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">For Employers</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Hire for skills.
                  <br />
                  Not just resumes.
                </h2>
                <p className="text-slate-400 text-lg mb-6 leading-relaxed">
                  Access candidates whose skills have been verified through real assessments and practical projects. No more guessing from bullet points.
                </p>
                <ul className="mb-8 space-y-2.5">
                  {[
                    "Structured skill requirements, not keyword soup",
                    "Deterministic match scores with the reasoning shown",
                    "Self-reported claims discounted against verified evidence",
                    "Essential-skill gating and human review built in",
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#1a56ff]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/employers"
                  className="inline-flex items-center gap-2 bg-[#1a56ff] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1040cc] transition-colors text-sm"
                >
                  Start Hiring
                  <ArrowRight size={16} />
                </Link>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-amber-300">
                  DEMO — illustrative candidate cards, not real people
                </p>
                {[
                  { name: "Aditya Sharma", role: "Data Analyst", match: "94%", skills: ["SQL", "Excel", "Power BI"] },
                  { name: "Priya Patel", role: "Data Analyst", match: "87%", skills: ["SQL", "Python", "Tableau"] },
                  { name: "Rahul Kumar", role: "Data Analyst", match: "79%", skills: ["Excel", "Statistics", "Power BI"] },
                ].map((candidate, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-[#1a56ff] rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {candidate.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{candidate.name}</p>
                          <p className="text-xs text-slate-400">{candidate.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">{candidate.match}</p>
                        <p className="text-xs text-slate-400">match</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {candidate.skills.map(s => (
                        <span key={s} className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 bg-[#e8edff] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 18 18" fill="none">
              <path d="M3 14C3 14 3 10 6.5 9C10 8 14 9 14 4" stroke="#1a56ff" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="3" cy="14" r="1.5" fill="#1a56ff"/>
              <circle cx="14" cy="4" r="1.5" fill="#1a56ff"/>
            </svg>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
            Find the skills.
            <br />
            Build the skills.
            <br />
            <span className="gradient-text">Prove the skills. Get hired.</span>
          </h2>
          <p className="text-slate-500 text-lg mb-8 max-w-xl mx-auto">
            Close the gap between where you are and the role you want — with evidence an employer can actually check.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 bg-[#1a56ff] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#1040cc] transition-colors text-base shadow-xl shadow-blue-500/25"
            >
              Start for Free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-8 py-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-base"
            >
              Explore Careers
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-5">
            No credit card required. Start exploring careers and your skill gap immediately.
          </p>
        </div>
      </section>
    </main>
  );
}
