"use client";

import { DEMO_USER, getSkillGapColor } from "@/lib/demo-data";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  CheckCircle2,
  Share2,
  Award,
  ExternalLink,
  Download,
  Copy,
  Star,
  Briefcase,
  BookOpen,
  Shield,
} from "lucide-react";
import Link from "next/link";

const verificationConfig = {
  assessed: { label: "Assessed", color: "text-blue-600 bg-blue-50 border-blue-200", icon: "✓" },
  project_verified: { label: "Project Verified", color: "text-green-600 bg-green-50 border-green-200", icon: "✓✓" },
  employer_verified: { label: "Employer Verified", color: "text-purple-600 bg-purple-50 border-purple-200", icon: "★" },
  self_reported: { label: "Self-Reported", color: "text-slate-500 bg-slate-50 border-slate-200", icon: "○" },
};

export default function PassportPage() {
  const user = DEMO_USER;

  const verifiedCount = user.skills.filter(s => s.status === "assessed" || s.status === "project_verified").length;
  const selfReportedCount = user.skills.filter(s => s.status === "self_reported").length;

  return (
    <main className="pt-16 min-h-screen bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-[#1a56ff] uppercase tracking-widest mb-2">Skill Passport</p>
            <h1 className="text-3xl font-bold text-slate-900">Your Professional Profile</h1>
            <p className="text-slate-500 mt-1 text-sm">humanbridge.com/p/aditya</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              <Copy size={14} />
              Copy Link
            </button>
            <button className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              <Download size={14} />
              Export PDF
            </button>
            <button className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#1a56ff] px-4 py-2 rounded-xl hover:bg-[#1040cc] transition-colors">
              <Share2 size={14} />
              Share Passport
            </button>
          </div>
        </div>

        {/* Demo notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-800">
          <strong>Demo Passport:</strong> This is a sample Skill Passport for Aditya Sharma. In the live product, this page is publicly shareable and reflects your actual verified skills.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Passport card */}
          <div className="lg:col-span-1">
            {/* The Passport */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/30 sticky top-20">
              {/* Passport header */}
              <div className="bg-gradient-to-r from-[#1a56ff] to-[#6366f1] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                        <path d="M3 14C3 14 3 10 6.5 9C10 8 14 9 14 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="3" cy="14" r="1.5" fill="white"/>
                        <circle cx="14" cy="4" r="1.5" fill="white"/>
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-white/90">HUMANBRIDGE</span>
                  </div>
                  <span className="text-xs text-blue-200 font-mono">SKILL PASSPORT</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-white/30">
                    {user.avatarInitials}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{user.name}</p>
                    <p className="text-blue-200 text-sm">{user.targetCareer.name}</p>
                    <p className="text-xs text-blue-300 mt-0.5">humanbridge.com/p/aditya</p>
                  </div>
                </div>
              </div>

              {/* Career readiness */}
              <div className="p-5 border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">CAREER READINESS</span>
                  <span className="text-lg font-black text-white">{user.careerReadiness}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#1a56ff] to-[#6366f1] rounded-full transition-all duration-1000" style={{ width: `${user.careerReadiness}%` }} />
                </div>
              </div>

              {/* Verified skills */}
              <div className="p-5 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-3">VERIFIED SKILLS</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.filter(s => s.status === "assessed").map(({ skill }) => (
                    <span key={skill.id} className="text-xs bg-slate-800 text-green-400 border border-slate-700 px-2 py-1 rounded-lg flex items-center gap-1">
                      {skill.name}
                      <CheckCircle2 size={10} className="shrink-0" />
                    </span>
                  ))}
                </div>
              </div>

              {/* Assessments */}
              <div className="p-5 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-400 mb-3">ASSESSMENTS</p>
                <div className="space-y-2">
                  {user.assessmentResults.map(a => (
                    <div key={a.title} className="flex justify-between items-center">
                      <span className="text-xs text-slate-300">{a.title}</span>
                      <span className={`text-xs font-bold ${a.score >= 85 ? "text-green-400" : "text-blue-400"}`}>{a.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div className="p-5">
                <p className="text-xs font-semibold text-slate-400 mb-3">PROJECTS</p>
                <div className="space-y-2">
                  {user.completedProjects.map(p => (
                    <div key={p.title} className="flex items-center justify-between">
                      <span className="text-xs text-slate-300">{p.title}</span>
                      {p.verified && <span className="text-[10px] bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded-full border border-green-800">Verified</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Detail sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skill Profile */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-900">Skill Profile</h2>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {verifiedCount} Verified
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-slate-300 rounded-full" />
                    {selfReportedCount} Self-reported
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {user.skills.map(({ skill, proficiency, status }) => {
                  const vConfig = verificationConfig[status] || verificationConfig.self_reported;
                  const gapColor = getSkillGapColor(proficiency);
                  return (
                    <div key={skill.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">{skill.name}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${vConfig.color}`}>
                            {vConfig.label}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{proficiency}%</span>
                      </div>
                      <ProgressBar value={proficiency} color={gapColor as "green" | "yellow" | "red"} size="sm" animate />
                      <p className="text-xs text-slate-400 mt-0.5">{skill.whyEmployersWant?.slice(0, 80)}...</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-50">
                <div className="flex flex-wrap gap-3 text-xs">
                  {Object.entries(verificationConfig).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${val.color}`}>{val.icon}</span>
                      <span className="text-slate-500">{val.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Assessment Results */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-900">Assessment Results</h2>
                <Link href="/assessments" className="text-xs font-semibold text-[#1a56ff]">Take More →</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {user.assessmentResults.map(a => (
                  <div key={a.title} className={`p-4 rounded-xl text-center border ${
                    a.score >= 85 ? "bg-green-50 border-green-200" :
                    a.score >= 70 ? "bg-blue-50 border-blue-200" :
                    "bg-amber-50 border-amber-200"
                  }`}>
                    <p className={`text-3xl font-black mb-1 ${
                      a.score >= 85 ? "text-green-600" :
                      a.score >= 70 ? "text-blue-600" :
                      "text-amber-600"
                    }`}>{a.score}%</p>
                    <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.date}</p>
                    <div className="mt-2">
                      <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        Verified ✓
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-900">Proof-of-Skill Projects</h2>
                <Link href="/assessments" className="text-xs font-semibold text-[#1a56ff]">Add Project →</Link>
              </div>
              <div className="space-y-4">
                {user.completedProjects.map((project, i) => (
                  <div key={i} className="p-4 bg-[#f8fafc] rounded-xl border border-slate-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm">{project.title}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {project.skills.map(s => (
                            <span key={s} className="text-xs bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-lg">{s}</span>
                          ))}
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ml-2 ${
                        project.verified ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}>
                        {project.verified ? "Verified ✓" : "Self-Submitted"}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Empty project slot */}
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center">
                  <p className="text-sm text-slate-400 mb-2">Add another proof-of-skill project</p>
                  <Link href="/assessments" className="text-xs font-semibold text-[#1a56ff]">
                    Browse Projects →
                  </Link>
                </div>
              </div>
            </div>

            {/* Employer sharing */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-[#1a56ff] rounded-xl flex items-center justify-center shrink-0">
                  <Shield size={18} />
                </div>
                <div>
                  <h2 className="font-bold mb-1">Share with Employers</h2>
                  <p className="text-sm text-slate-400">Your Skill Passport is publicly accessible via your unique URL. Share it with employers, in your email signature or on LinkedIn.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-3 mb-4">
                <span className="text-sm text-slate-300 flex-1 font-mono">humanbridge.com/p/aditya</span>
                <button className="text-xs font-semibold text-[#1a56ff] bg-[#e8edff] px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors">
                  Copy
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Profile Views", value: "247" },
                  { label: "Employer Views", value: "12" },
                  { label: "Applications", value: "3" },
                ].map(stat => (
                  <div key={stat.label} className="bg-slate-800 rounded-xl p-3">
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-[11px] text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
