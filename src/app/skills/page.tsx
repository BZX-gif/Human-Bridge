import Link from "next/link";
import type { Metadata } from "next";
import { DEMO_SKILLS, DEMO_LEARNING_RESOURCES } from "@/lib/demo-data";
import { BookOpen, Clock, Star, ChevronRight, Zap, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Skills Library — Human Bridge",
  description: "Explore all skills tracked on Human Bridge. See why employers value each skill and how to build it.",
};

const categoryLabels: Record<string, { label: string; color: string; bg: string }> = {
  core: { label: "Core Skill", color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
  tool: { label: "Tool", color: "text-violet-700", bg: "bg-violet-50 border-violet-100" },
  human: { label: "Human Skill", color: "text-green-700", bg: "bg-green-50 border-green-100" },
  domain: { label: "Domain", color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
};

const levelConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: "Beginner", color: "text-green-600" },
  intermediate: { label: "Intermediate", color: "text-amber-600" },
  advanced: { label: "Advanced", color: "text-red-600" },
  expert: { label: "Expert", color: "text-purple-600" },
};

export default function SkillsPage() {
  const groupedSkills = {
    core: DEMO_SKILLS.filter(s => s.category === "core"),
    tool: DEMO_SKILLS.filter(s => s.category === "tool"),
    human: DEMO_SKILLS.filter(s => s.category === "human"),
  };

  return (
    <main className="pt-16 min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-xs font-semibold text-[#1a56ff] uppercase tracking-widest mb-3">Skills Library</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Every skill employers
            <br />
            actually want.
          </h1>
          <p className="text-slate-500 text-lg max-w-xl">
            We track the skills companies need, not just the ones that sound impressive. Browse, assess and build what matters.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {Object.entries(groupedSkills).map(([cat, skills]) => {
            const config = categoryLabels[cat];
            return (
              <div key={cat} className={`bg-white rounded-2xl border p-4 ${config.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>{config.label}s</span>
                  <span className={`text-xs font-bold ${config.color}`}>{skills.length} skills</span>
                </div>
                <p className="text-xs text-slate-500">
                  {cat === "core" ? "The foundational knowledge your career is built on." :
                   cat === "tool" ? "Software and platforms employers expect you to use." :
                   "The human capabilities that AI cannot replace."}
                </p>
              </div>
            );
          })}
        </div>

        {/* Skills by category */}
        {Object.entries(groupedSkills).map(([cat, skills]) => {
          const config = categoryLabels[cat];
          return (
            <div key={cat} className="mb-10">
              <div className="flex items-center gap-2 mb-5">
                <h2 className="text-lg font-bold text-slate-900">{config.label}s</h2>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                  {skills.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map(skill => (
                  <div key={skill.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-slate-900">{skill.name}</h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3 leading-relaxed">{skill.description}</p>
                    <div className="bg-[#f8fafc] rounded-xl p-3 mb-3">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Why employers want this</p>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{skill.whyEmployersWant}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/assessments"
                        className="flex-1 text-center text-xs font-semibold text-[#1a56ff] bg-[#e8edff] py-2 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Take Assessment
                      </Link>
                      <Link
                        href="/assessments"
                        className="flex-1 text-center text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Start Learning
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Learning Resources */}
        <div id="learning" className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Learning Resources</h2>
              <p className="text-slate-500 mt-1">Targeted courses designed around employment, not just knowledge.</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-800">
            <strong>Coming Soon:</strong> Full learning content will be available in the next platform release. Resources listed are planned curriculum.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEMO_LEARNING_RESOURCES.map(resource => {
              const levelConf = levelConfig[resource.level] || levelConfig.beginner;
              return (
                <div key={resource.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                      <BookOpen size={18} className="text-[#1a56ff]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {resource.free ? (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">Free</span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Premium</span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1 leading-snug">{resource.title}</h3>
                  <p className="text-xs text-[#1a56ff] font-medium mb-2">{resource.skillName}</p>
                  <p className="text-xs text-slate-500 mb-4 flex-1 leading-relaxed">{resource.description}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1"><Clock size={11} />{resource.duration}</span>
                    <span className={`font-semibold ${levelConf.color}`}>{levelConf.label}</span>
                    <span className="text-slate-400">{resource.provider}</span>
                  </div>

                  <button className="w-full py-2 bg-[#1a56ff] text-white text-xs font-semibold rounded-xl hover:bg-[#1040cc] transition-colors">
                    Start Learning
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
