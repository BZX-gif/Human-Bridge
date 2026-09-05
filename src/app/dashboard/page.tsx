"use client";

import Link from "next/link";
import { DEMO_USER, DEMO_JOBS, calculateMatchScore, getSkillGapColor } from "@/lib/demo-data";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  ArrowRight,
  ChevronRight,
  Award,
  BookOpen,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Target,
  MapPin,
} from "lucide-react";
import { formatSalary, formatExperience, getWorkTypeLabel } from "@/lib/utils";

const roadmapStatus = {
  completed: { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", label: "Completed" },
  in_progress: { color: "text-[#1a56ff]", bg: "bg-[#e8edff]", border: "border-blue-200", dot: "bg-[#1a56ff]", label: "In Progress" },
  upcoming: { color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-100", dot: "bg-slate-300", label: "Upcoming" },
};

const gapDotColors: Record<string, string> = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
};

export default function DashboardPage() {
  const recommendedJobs = DEMO_JOBS.map(j => ({
    ...j,
    matchScore: calculateMatchScore(DEMO_USER.skills, j.skills),
  }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  const user = DEMO_USER;
  const currentWeekItem = user.roadmap.find(w => w.status === "in_progress");

  return (
    <main className="pt-16 min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-sm text-slate-500 mb-1">Good morning 👋</p>
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/passport"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Award size={15} />
              Skill Passport
            </Link>
            <Link
              href="/ai-copilot"
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#1a56ff] px-4 py-2 rounded-xl hover:bg-[#1040cc] transition-colors"
            >
              <Sparkles size={15} />
              AI Copilot
            </Link>
          </div>
        </div>

        {/* Demo banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-800">
          <strong>Demo Dashboard:</strong> This shows a sample user profile (Aditya Sharma). In the live product, this will reflect your actual skill assessments and career progress.
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Career Goal", value: user.targetCareer.name, icon: Target, color: "text-[#1a56ff]", bg: "bg-[#e8edff]" },
            { label: "Career Readiness", value: `${user.careerReadiness}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
            { label: "Assessments Done", value: String(user.assessmentResults.length), icon: CheckCircle2, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Current Week", value: `Week ${user.roadmap.find(w => w.status === "in_progress")?.week || "—"}`, icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className="font-bold text-slate-900 text-base leading-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Career Readiness */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Career Readiness</h2>
                  <p className="text-sm text-slate-500">Target: {user.targetCareer.name}</p>
                </div>
                <span className="text-3xl font-black text-[#1a56ff]">{user.careerReadiness}%</span>
              </div>
              <ProgressBar value={user.careerReadiness} color="blue" size="lg" animate />
              <p className="text-xs text-slate-400 mt-2">You need ~8% more to be considered highly competitive for this role.</p>
            </div>

            {/* Skill Gap */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-900">Your Skill Profile</h2>
                <Link href="/assessments" className="text-xs font-semibold text-[#1a56ff]">
                  Take Assessments →
                </Link>
              </div>
              <div className="space-y-4">
                {user.skills.map(({ skill, proficiency, status }) => {
                  const gapColor = getSkillGapColor(proficiency);
                  const emoji = gapDotColors[gapColor];
                  return (
                    <div key={skill.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{emoji}</span>
                          <span className="text-sm font-medium text-slate-800">{skill.name}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            status === "assessed" ? "bg-green-50 text-green-700" :
                            status === "project_verified" ? "bg-blue-50 text-blue-700" :
                            "bg-slate-50 text-slate-500"
                          }`}>
                            {status === "assessed" ? "Assessed" :
                             status === "project_verified" ? "Verified" : "Self-reported"}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{proficiency}%</span>
                      </div>
                      <ProgressBar value={proficiency} color="auto" size="sm" animate />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Learning Roadmap */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-900">Your Learning Roadmap</h2>
                <span className="text-xs text-slate-400">6-week plan</span>
              </div>
              <div className="space-y-3">
                {user.roadmap.map((item) => {
                  const st = roadmapStatus[item.status as keyof typeof roadmapStatus] || roadmapStatus.upcoming;
                  return (
                    <div key={item.week} className={`flex items-start gap-3 p-3.5 rounded-xl border ${st.border} ${st.bg}`}>
                      <div className="shrink-0 mt-0.5">
                        <div className={`w-7 h-7 rounded-full border-2 ${
                          item.status === "completed" ? "bg-green-500 border-green-500" :
                          item.status === "in_progress" ? "bg-[#1a56ff] border-[#1a56ff]" :
                          "bg-white border-slate-200"
                        } flex items-center justify-center`}>
                          {item.status === "completed" ? (
                            <CheckCircle2 size={14} className="text-white" />
                          ) : item.status === "in_progress" ? (
                            <Clock size={12} className="text-white" />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">{item.week}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${st.color}`}>Week {item.week}: {item.title}</p>
                          {item.status === "in_progress" && (
                            <span className="text-[10px] bg-[#1a56ff] text-white px-1.5 py-0.5 rounded-full font-medium">NOW</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      </div>
                      <span className={`text-[10px] font-semibold ${st.color} shrink-0`}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Next step */}
            {currentWeekItem && (
              <div className="bg-gradient-to-br from-[#1a56ff] to-[#6366f1] rounded-2xl p-5 text-white">
                <p className="text-xs font-semibold text-blue-200 mb-2">RECOMMENDED NEXT STEP</p>
                <h3 className="font-bold mb-1">Week {currentWeekItem.week}: {currentWeekItem.title}</h3>
                <p className="text-sm text-blue-100 mb-4">{currentWeekItem.description}</p>
                <Link
                  href="/skills"
                  className="block text-center text-sm font-semibold bg-white text-[#1a56ff] py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  Start Learning
                  <ArrowRight size={14} className="inline ml-1" />
                </Link>
              </div>
            )}

            {/* Assessment results */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Assessments</h3>
              <div className="space-y-2.5">
                {user.assessmentResults.map((result) => (
                  <div key={result.title} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{result.title}</p>
                      <p className="text-xs text-slate-400">{result.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        result.score >= 85 ? "text-green-600" :
                        result.score >= 70 ? "text-blue-600" : "text-amber-600"
                      }`}>{result.score}%</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/assessments" className="mt-3 block text-center text-xs font-semibold text-[#1a56ff] pt-3 border-t border-slate-50">
                Take more assessments →
              </Link>
            </div>

            {/* Recommended jobs */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Top Job Matches</h3>
                <Link href="/jobs" className="text-xs font-medium text-[#1a56ff]">View all</Link>
              </div>
              <div className="space-y-3">
                {recommendedJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block p-3 rounded-xl bg-[#f8fafc] hover:bg-slate-100 transition-colors border border-slate-50">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-800 leading-tight">{job.title}</p>
                      <span className={`text-xs font-bold shrink-0 ml-2 ${
                        job.matchScore >= 85 ? "text-green-600" :
                        job.matchScore >= 70 ? "text-blue-600" : "text-amber-600"
                      }`}>
                        {job.matchScore}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{job.company.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={10} />{job.location}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Passport link */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-[#1a56ff]" />
                <h3 className="text-sm font-bold">Your Skill Passport</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">humanbridge.com/p/aditya</p>
              <ProgressBar value={82} color="blue" size="sm" animate />
              <p className="text-xs text-slate-400 mt-1 mb-4">82% complete</p>
              <Link
                href="/passport"
                className="block text-center text-xs font-semibold bg-[#1a56ff] text-white py-2.5 rounded-xl hover:bg-[#1040cc] transition-colors"
              >
                View & Share Passport
              </Link>
            </div>

            {/* AI Copilot */}
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} />
                <h3 className="text-sm font-bold">AI Career Copilot</h3>
              </div>
              <p className="text-xs text-purple-200 mb-4">Ask anything about your career, skills or job search.</p>
              <Link
                href="/ai-copilot"
                className="block text-center text-xs font-semibold bg-white text-violet-600 py-2.5 rounded-xl hover:bg-purple-50 transition-colors"
              >
                Open AI Copilot
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
