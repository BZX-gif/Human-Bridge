"use client";

import { useState } from "react";
import Link from "next/link";
import { DEMO_CAREERS, DEMO_SKILLS } from "@/lib/demo-data";
import { ChevronRight, ChevronLeft, CheckCircle2, Upload, ArrowRight } from "lucide-react";

const goals = [
  { id: "first_job", label: "Get my first job", icon: "🚀", description: "I'm entering the workforce for the first time." },
  { id: "switch_career", label: "Switch careers", icon: "🔄", description: "I want to move into a different field." },
  { id: "improve", label: "Improve my current career", icon: "📈", description: "I want to grow within my existing field." },
  { id: "better_opportunities", label: "Find better opportunities", icon: "⭐", description: "I want a better role, company or salary." },
  { id: "explore", label: "Explore what's out there", icon: "🔍", description: "I'm not sure yet — help me find out." },
];

const educationLevels = [
  "Currently studying (school / college)",
  "Recent graduate (0–1 year)",
  "Graduate with some work experience",
  "Working professional",
  "No formal degree — self-taught / bootcamp",
  "Prefer not to say",
];

const commonSkills = DEMO_SKILLS.slice(0, 15);

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [goal, setGoal] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [targetCareer, setTargetCareer] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const totalSteps = 6;
  const progress = ((step - 1) / totalSteps) * 100;

  const toggleSkill = (id: number) => {
    setSelectedSkills(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const canAdvance = () => {
    if (step === 1) return goal !== "";
    if (step === 2) return education !== "";
    if (step === 3) return experience !== "";
    if (step === 4) return true;
    if (step === 5) return targetCareer !== null;
    return true;
  };

  const handleNext = () => {
    if (step < totalSteps) setStep((step + 1) as Step);
    else setIsComplete(true);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  if (isComplete) {
    const career = DEMO_CAREERS.find(c => c.id === targetCareer);
    return (
      <main className="pt-16 min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={36} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">You&apos;re all set! 🎉</h1>
          <p className="text-slate-500 mb-2">
            Your profile has been created. Your target career:
          </p>
          {career && (
            <div className="inline-flex items-center gap-2 bg-[#e8edff] text-[#1a56ff] font-bold text-lg px-5 py-2 rounded-xl mb-6">
              {career.name}
            </div>
          )}
          <p className="text-slate-500 mb-8">
            We&apos;ve analysed your profile. Your personalised skill gap report and learning roadmap are ready.
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-[#1a56ff] text-white font-semibold py-3.5 rounded-xl hover:bg-[#1040cc] transition-colors"
            >
              View My Dashboard & Skill Gap
              <ArrowRight size={16} className="inline ml-2" />
            </Link>
            <Link
              href="/assessments"
              className="block w-full bg-white text-slate-700 font-semibold py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Start My First Assessment
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16 min-h-screen bg-[#f8fafc]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Step {step} of {totalSteps}</span>
            <span className="text-sm text-slate-400">{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a56ff] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8">
          {/* Step 1: Goal */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">What are you trying to achieve?</h2>
                <p className="text-slate-500">This helps us personalise your experience from the start.</p>
              </div>
              <div className="space-y-3">
                {goals.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                      goal === g.id
                        ? "border-[#1a56ff] bg-[#e8edff]"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-2xl shrink-0">{g.icon}</span>
                    <div>
                      <p className={`font-semibold ${goal === g.id ? "text-[#1a56ff]" : "text-slate-900"}`}>{g.label}</p>
                      <p className="text-sm text-slate-500">{g.description}</p>
                    </div>
                    {goal === g.id && (
                      <CheckCircle2 size={18} className="text-[#1a56ff] ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Education */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">What&apos;s your education and background?</h2>
                <p className="text-slate-500">We don&apos;t judge by degrees — we&apos;re just understanding where you&apos;re starting from.</p>
              </div>
              <div className="space-y-2.5">
                {educationLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => setEducation(level)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left text-sm transition-all ${
                      education === level
                        ? "border-[#1a56ff] bg-[#e8edff] text-[#1a56ff] font-semibold"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      education === level ? "border-[#1a56ff] bg-[#1a56ff]" : "border-slate-300"
                    }`}>
                      {education === level && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Experience */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">What experience do you have?</h2>
                <p className="text-slate-500">Tell us about your work experience, projects or anything relevant.</p>
              </div>
              <textarea
                value={experience}
                onChange={e => setExperience(e.target.value)}
                placeholder="Example: I've worked as a data entry clerk for 1 year. I've built a few Excel dashboards for a college project. I completed an online Python course..."
                className="w-full h-36 p-4 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none focus:outline-none focus:border-[#1a56ff] focus:ring-2 focus:ring-[#1a56ff]/10"
              />
              <p className="text-xs text-slate-400 mt-2">Don&apos;t overthink it. Even a sentence is fine. You can update this later.</p>
            </div>
          )}

          {/* Step 4: Skills */}
          {step === 4 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">What skills do you already have?</h2>
                <p className="text-slate-500">Select the skills you&apos;re comfortable with. We&apos;ll verify them through assessments.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {commonSkills.map(skill => (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                      selectedSkills.includes(skill.id)
                        ? "bg-[#1a56ff] text-white border-[#1a56ff]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {selectedSkills.includes(skill.id) && "✓ "}
                    {skill.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-4">Selected: {selectedSkills.length} skills. These are self-reported for now — assessments will verify them.</p>
            </div>
          )}

          {/* Step 5: Target Career */}
          {step === 5 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">What type of work interests you?</h2>
                <p className="text-slate-500">Choose a career direction. You can change this anytime.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_CAREERS.map(career => (
                  <button
                    key={career.id}
                    onClick={() => setTargetCareer(career.id)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      targetCareer === career.id
                        ? "border-[#1a56ff] bg-[#e8edff]"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${targetCareer === career.id ? "text-[#1a56ff]" : "text-slate-900"}`}>
                        {career.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{career.tagline}</p>
                      <p className="text-xs text-slate-400 mt-0.5">₹{career.salaryMin}–{career.salaryMax}L</p>
                    </div>
                    {targetCareer === career.id && (
                      <CheckCircle2 size={16} className="text-[#1a56ff] shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Resume */}
          {step === 6 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload your resume (optional)</h2>
                <p className="text-slate-500">We&apos;ll analyse your resume to extract additional skills and experience. Skip this if you don&apos;t have one yet.</p>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-[#1a56ff] transition-colors cursor-pointer">
                <Upload size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 mb-1">Drop your resume here</p>
                <p className="text-sm text-slate-400 mb-3">PDF, DOC or DOCX up to 5MB</p>
                <button className="text-sm font-semibold text-[#1a56ff] bg-[#e8edff] px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors">
                  Choose File
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center">
                Your resume is stored securely and only used to improve your profile. You can delete it anytime.
              </p>
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-1">💡 Human Bridge encourages Skill Passports, not resumes</p>
                <p className="text-xs text-blue-700">Your Skill Passport — built through assessments and projects — is more valuable than a resume. We&apos;ll help you build it.</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={handleBack}
            className={`flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors ${step === 1 ? "invisible" : ""}`}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            className="flex items-center gap-2 bg-[#1a56ff] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1040cc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {step === totalSteps ? "Complete Profile" : "Continue"}
            <ChevronRight size={16} />
          </button>
        </div>

        {step === 6 && (
          <div className="text-center mt-4">
            <button
              onClick={() => setIsComplete(true)}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip resume upload →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
