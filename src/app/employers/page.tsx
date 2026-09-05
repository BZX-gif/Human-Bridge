"use client";

import { useState } from "react";
import Link from "next/link";
import { DEMO_USER, DEMO_CAREERS, DEMO_SKILLS, calculateMatchScore, DEMO_JOBS } from "@/lib/demo-data";
import {
  CheckCircle2,
  ArrowRight,
  Users,
  Briefcase,
  BarChart3,
  Shield,
  Star,
  Clock,
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

const DEMO_CANDIDATES = [
  {
    name: "Aditya Sharma",
    initials: "AS",
    career: "Data Analyst",
    readiness: 82,
    matchScore: 94,
    verifiedSkills: ["SQL", "Excel", "Power BI", "Data Analysis"],
    assessmentScore: 91,
    location: "Bangalore",
    color: "bg-blue-600",
  },
  {
    name: "Priya Patel",
    initials: "PP",
    career: "Data Analyst",
    readiness: 76,
    matchScore: 87,
    verifiedSkills: ["SQL", "Python", "Tableau", "Communication"],
    assessmentScore: 84,
    location: "Mumbai",
    color: "bg-violet-600",
  },
  {
    name: "Rahul Kumar",
    initials: "RK",
    career: "Data Analyst",
    readiness: 68,
    matchScore: 79,
    verifiedSkills: ["Excel", "Statistics", "Power BI"],
    assessmentScore: 78,
    location: "Hyderabad",
    color: "bg-green-600",
  },
  {
    name: "Sneha Nair",
    initials: "SN",
    career: "Digital Marketing",
    readiness: 81,
    matchScore: 85,
    verifiedSkills: ["SEO", "Content Marketing", "Google Analytics"],
    assessmentScore: 88,
    location: "Pune (Remote)",
    color: "bg-pink-600",
  },
];

type FormStep = 1 | 2 | 3;

export default function EmployersPage() {
  const [showJobBuilder, setShowJobBuilder] = useState(false);
  const [jobStep, setJobStep] = useState<FormStep>(1);
  const [jobTitle, setJobTitle] = useState("");
  const [selectedCareer, setSelectedCareer] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<{ skillId: number; importance: string }[]>([]);
  const [jobBuilt, setJobBuilt] = useState(false);

  const toggleJobSkill = (id: number, importance: string) => {
    setSelectedSkills(prev => {
      const exists = prev.find(s => s.skillId === id);
      if (exists) return prev.filter(s => s.skillId !== id);
      return [...prev, { skillId: id, importance }];
    });
  };

  return (
    <main className="pt-16 min-h-screen bg-white">
      {/* Job Builder Modal */}
      {showJobBuilder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  {jobBuilt ? "Job Created! 🎉" : "Build a Job — Skill First"}
                </h2>
                {!jobBuilt && <p className="text-xs text-slate-500">Step {jobStep} of 3</p>}
              </div>
              <button onClick={() => { setShowJobBuilder(false); setJobStep(1); setJobBuilt(false); setJobTitle(""); setSelectedSkills([]); }} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            {jobBuilt ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Job Posted Successfully</h3>
                <p className="text-slate-500 text-sm mb-4">"{jobTitle}" has been published. Human Bridge will now match verified candidates against your skill requirements.</p>
                <div className="bg-[#f8fafc] rounded-xl p-4 mb-4 text-left">
                  <p className="text-xs font-semibold text-slate-500 mb-2">ESTIMATED MATCHES</p>
                  <p className="text-2xl font-bold text-slate-900">23 candidates</p>
                  <p className="text-xs text-slate-500">with 70%+ skill match found</p>
                </div>
                <button onClick={() => { setShowJobBuilder(false); setJobBuilt(false); setJobTitle(""); setSelectedSkills([]); setJobStep(1); }}
                  className="w-full bg-[#1a56ff] text-white font-semibold py-3 rounded-xl hover:bg-[#1040cc] transition-colors text-sm">
                  View Matched Candidates
                </button>
              </div>
            ) : (
              <div className="p-5">
                {/* Progress */}
                <div className="flex gap-1.5 mb-6">
                  {[1, 2, 3].map(s => (
                    <div key={s} className={`flex-1 h-1 rounded-full ${s <= jobStep ? "bg-[#1a56ff]" : "bg-slate-100"}`} />
                  ))}
                </div>

                {jobStep === 1 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Job Title & Career Type</h3>
                    <input
                      type="text"
                      placeholder="e.g. Junior Data Analyst"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1a56ff] mb-4 text-slate-900 placeholder:text-slate-400"
                    />
                    <label className="block text-sm font-medium text-slate-700 mb-2">Career Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DEMO_CAREERS.slice(0, 6).map(c => (
                        <button key={c.id} onClick={() => setSelectedCareer(c.slug)}
                          className={`p-2.5 text-sm rounded-xl border text-left transition-all ${selectedCareer === c.slug ? "border-[#1a56ff] bg-[#e8edff] text-[#1a56ff] font-semibold" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {jobStep === 2 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Required Skills</h3>
                    <p className="text-xs text-slate-500 mb-4">Select skills and their importance. Human Bridge will match candidates based on verified proficiency.</p>
                    <div className="space-y-2">
                      {DEMO_SKILLS.slice(0, 10).map(skill => {
                        const selected = selectedSkills.find(s => s.skillId === skill.id);
                        return (
                          <div key={skill.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selected ? "border-[#1a56ff] bg-[#e8edff]" : "border-slate-200 hover:bg-slate-50"}`}>
                            <button onClick={() => toggleJobSkill(skill.id, selected?.importance || "essential")} className="flex-1 text-left">
                              <p className={`text-sm font-medium ${selected ? "text-[#1a56ff]" : "text-slate-800"}`}>{skill.name}</p>
                            </button>
                            {selected && (
                              <select
                                value={selected.importance}
                                onChange={e => setSelectedSkills(prev => prev.map(s => s.skillId === skill.id ? { ...s, importance: e.target.value } : s))}
                                className="text-xs border border-blue-200 bg-white rounded-lg px-2 py-1 focus:outline-none text-[#1a56ff] font-semibold"
                              >
                                <option value="essential">Essential</option>
                                <option value="important">Important</option>
                                <option value="helpful">Helpful</option>
                              </select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">{selectedSkills.length} skills selected</p>
                  </div>
                )}

                {jobStep === 3 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Job Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Experience Required</label>
                        <select className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1a56ff] text-slate-700">
                          <option>0–1 years (Entry level)</option>
                          <option>1–3 years</option>
                          <option>3–5 years</option>
                          <option>5+ years</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Work Type</label>
                        <select className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1a56ff] text-slate-700">
                          <option>Remote</option>
                          <option>Hybrid</option>
                          <option>On-site</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Salary Range (LPA)</label>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="number" placeholder="Min (e.g. 4)" className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1a56ff] text-slate-700 placeholder:text-slate-400" />
                          <input type="number" placeholder="Max (e.g. 8)" className="p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#1a56ff] text-slate-700 placeholder:text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-50">
                  <button onClick={() => jobStep > 1 && setJobStep((jobStep - 1) as FormStep)} className={`text-sm text-slate-400 hover:text-slate-600 ${jobStep === 1 ? "invisible" : ""}`}>
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (jobStep < 3) setJobStep((jobStep + 1) as FormStep);
                      else setJobBuilt(true);
                    }}
                    disabled={jobStep === 1 && !jobTitle}
                    className="flex items-center gap-2 bg-[#1a56ff] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1040cc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {jobStep === 3 ? "Post Job" : "Continue"}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-slate-900 pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#1a56ff]/20 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Star size={12} fill="currentColor" />
                For Employers
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
                Hire for Skills.
                <br />
                <span className="text-[#1a56ff]">Not Just Resumes.</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Access candidates whose skills have been verified through real assessments and practical projects. Match on what candidates can actually do, not just what they claim.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowJobBuilder(true)}
                  className="inline-flex items-center justify-center gap-2 bg-[#1a56ff] text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-[#1040cc] transition-colors text-sm"
                >
                  Post a Job
                  <ArrowRight size={16} />
                </button>
                <Link href="#talent" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-white/20 transition-colors text-sm border border-white/20">
                  Find Talent
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: "500+", label: "Verified candidates", sub: "Skills assessment-backed" },
                { stat: "91%", label: "Interview conversion", sub: "vs. 34% industry average" },
                { stat: "2.4×", label: "Faster screening", sub: "Skill-first filtering" },
                { stat: "48h", label: "Average time to hire", sub: "Streamlined process" },
              ].map(item => (
                <div key={item.label} className="bg-white/10 border border-white/10 rounded-2xl p-5">
                  <p className="text-3xl font-black text-white mb-1">{item.stat}</p>
                  <p className="text-sm font-semibold text-slate-300">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works for employers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How Human Bridge hiring works</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">A better way to screen and hire — built around skills, not resumes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Build a skill-first job", desc: "Define the skills your role needs, not just a job description. Set importance levels: essential, important, helpful.", icon: Briefcase, color: "bg-blue-50 text-blue-600" },
              { step: "02", title: "Receive matched candidates", desc: "Human Bridge surfaces candidates ranked by their verified skill match score — not random CV applications.", icon: Users, color: "bg-violet-50 text-violet-600" },
              { step: "03", title: "Review verified profiles", desc: "Each candidate shows exactly which skills are verified by assessment, projects and employer feedback.", icon: Shield, color: "bg-green-50 text-green-600" },
              { step: "04", title: "Hire with confidence", desc: "Reduce bad hires. Know what candidates can actually do before the first interview.", icon: CheckCircle2, color: "bg-amber-50 text-amber-600" },
            ].map(item => (
              <div key={item.step} className="p-5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center`}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-3xl font-black text-slate-100">{item.step}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Candidate talent pool */}
      <section id="talent" className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-[#1a56ff] uppercase tracking-widest mb-2">Verified Talent</p>
              <h2 className="text-3xl font-bold text-slate-900">Sample candidate matches</h2>
              <p className="text-slate-500 mt-1 text-sm">Demo data — representative of how candidate profiles appear.</p>
            </div>
            <div className="hidden sm:flex gap-2">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
                <Search size={14} className="text-slate-400" />
                <span className="text-slate-400">Search candidates...</span>
              </div>
              <button className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                <Filter size={14} />
                Filter
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {DEMO_CANDIDATES.map((candidate, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${candidate.color} rounded-xl flex items-center justify-center text-white font-bold shrink-0`}>
                    {candidate.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{candidate.name}</h3>
                        <p className="text-sm text-slate-500">{candidate.career} · {candidate.location}</p>
                      </div>
                      <div className="text-center shrink-0">
                        <div className={`text-2xl font-black ${candidate.matchScore >= 90 ? "text-green-600" : candidate.matchScore >= 80 ? "text-blue-600" : "text-amber-600"}`}>
                          {candidate.matchScore}%
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">MATCH</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {candidate.verifiedSkills.map(skill => (
                        <span key={skill} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <BarChart3 size={12} />
                        Career Readiness: <span className="font-semibold text-slate-800">{candidate.readiness}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Star size={12} />
                        Assessment: <span className="font-semibold text-slate-800">{candidate.assessmentScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <Link href="/passport" className="text-xs font-semibold text-[#1a56ff] bg-[#e8edff] px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors">
                      View Profile
                    </Link>
                    <button className="text-xs font-semibold text-white bg-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                      Shortlist
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Post job CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to hire smarter?
          </h2>
          <p className="text-slate-500 text-lg mb-8">
            Post your first job in minutes. Define the skills you need, and Human Bridge will surface matched, verified candidates automatically.
          </p>
          <button
            onClick={() => setShowJobBuilder(true)}
            className="inline-flex items-center gap-2 bg-[#1a56ff] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#1040cc] transition-colors text-base shadow-xl shadow-blue-500/25"
          >
            Post a Job — It&apos;s Free to Start
            <ArrowRight size={18} />
          </button>
          <p className="text-xs text-slate-400 mt-4">No credit card required. Pricing transparency built in from day one.</p>
        </div>
      </section>
    </main>
  );
}
