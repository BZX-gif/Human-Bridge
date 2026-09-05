"use client";

import { useState } from "react";
import { DEMO_ASSESSMENTS, DEMO_PROJECTS, DEMO_USER } from "@/lib/demo-data";
import {
  CheckCircle2,
  Clock,
  ChevronRight,
  Play,
  BookOpen,
  Star,
  Award,
  Briefcase,
  FileText,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const difficultyConfig: Record<string, { color: string; bg: string }> = {
  Beginner: { color: "text-green-700", bg: "bg-green-50" },
  Intermediate: { color: "text-amber-700", bg: "bg-amber-50" },
  Advanced: { color: "text-red-700", bg: "bg-red-50" },
};

const typeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  Mixed: { icon: <Star size={14} />, label: "Mixed Format" },
  Practical: { icon: <Lightbulb size={14} />, label: "Practical Challenge" },
  MCQ: { icon: <FileText size={14} />, label: "Multiple Choice" },
};

export default function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState<"assessments" | "projects">("assessments");
  const [activeAssessment, setActiveAssessment] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [isComplete, setIsComplete] = useState(false);

  const assessment = activeAssessment !== null ? DEMO_ASSESSMENTS.find(a => a.id === activeAssessment) : null;
  const question = assessment?.questions[currentQuestion];

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    setAnswers(prev => ({ ...prev, [currentQuestion]: index }));
  };

  const handleNext = () => {
    if (!assessment) return;
    if (currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(answers[currentQuestion + 1] as number ?? null);
    } else {
      setIsComplete(true);
    }
  };

  const handleStartAssessment = (id: number) => {
    setActiveAssessment(id);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers({});
    setIsComplete(false);
  };

  const handleClose = () => {
    setActiveAssessment(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers({});
    setIsComplete(false);
  };

  const calcScore = () => {
    if (!assessment) return 0;
    let correct = 0;
    let total = 0;
    assessment.questions.forEach((q, i) => {
      if (q.correctIndex !== undefined) {
        total++;
        if (answers[i] === q.correctIndex) correct++;
      }
    });
    if (total === 0) return 85;
    return Math.round((correct / total) * 100);
  };

  return (
    <main className="pt-16 min-h-screen bg-[#f8fafc]">
      {/* Active assessment modal */}
      {activeAssessment !== null && assessment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Assessment header */}
            <div className="border-b border-slate-100 p-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">{assessment.title}</h2>
                <p className="text-xs text-slate-500">{assessment.careerName} · {assessment.duration} min · {assessment.questions.length} questions</p>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            {isComplete ? (
              /* Results */
              <div className="p-8 text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  calcScore() >= 70 ? "bg-green-50 border-2 border-green-200" : "bg-amber-50 border-2 border-amber-200"
                }`}>
                  <span className={`text-2xl font-black ${calcScore() >= 70 ? "text-green-600" : "text-amber-600"}`}>
                    {calcScore()}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {calcScore() >= assessment.passingScore ? "Assessment Passed! 🎉" : "Keep Practising 💪"}
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  {calcScore() >= assessment.passingScore
                    ? `Excellent work. This skill will now appear as Assessed on your Skill Passport.`
                    : `Score was ${calcScore()}%. Passing score is ${assessment.passingScore}%. Review the material and try again.`}
                </p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-[#f8fafc] rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-slate-900">{calcScore()}%</p>
                    <p className="text-xs text-slate-500">Score</p>
                  </div>
                  <div className="bg-[#f8fafc] rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-slate-900">{assessment.passingScore}%</p>
                    <p className="text-xs text-slate-500">Passing</p>
                  </div>
                  <div className="bg-[#f8fafc] rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-slate-900">{assessment.duration}m</p>
                    <p className="text-xs text-slate-500">Duration</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                  <Link
                    href="/passport"
                    className="flex-1 py-2.5 rounded-xl bg-[#1a56ff] text-white text-sm font-semibold text-center hover:bg-[#1040cc] transition-colors"
                  >
                    View Skill Passport
                  </Link>
                </div>
              </div>
            ) : question ? (
              /* Question */
              <div className="p-6">
                {/* Progress */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex gap-1 flex-1">
                    {assessment.questions.map((_, i) => (
                      <div key={i} className={`flex-1 h-1 rounded-full ${
                        i < currentQuestion ? "bg-[#1a56ff]" :
                        i === currentQuestion ? "bg-[#1a56ff]/50" : "bg-slate-100"
                      }`} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {currentQuestion + 1} / {assessment.questions.length}
                  </span>
                </div>

                {/* Question type badge */}
                <div className="mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {question.type === "mcq" ? "Multiple Choice" :
                     question.type === "scenario" ? "Scenario Question" :
                     question.type === "practical" ? "Practical Challenge" :
                     "Written Response"}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-slate-900 mb-5 leading-relaxed">
                  {question.question}
                </h3>

                {/* MCQ or Scenario answers */}
                {question.options && (
                  <div className="space-y-2 mb-6">
                    {question.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all ${
                          selectedAnswer === i
                            ? "border-[#1a56ff] bg-[#e8edff] text-[#1a56ff] font-medium"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className={`inline-flex w-5 h-5 rounded-full mr-2.5 border text-[10px] items-center justify-center font-bold shrink-0 ${
                          selectedAnswer === i ? "bg-[#1a56ff] border-[#1a56ff] text-white" : "border-slate-300 text-slate-400"
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Written/Practical */}
                {(question.type === "written" || question.type === "practical") && !question.options && (
                  <div className="mb-6">
                    <textarea
                      className="w-full h-32 p-3 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none focus:outline-none focus:border-[#1a56ff] focus:ring-2 focus:ring-[#1a56ff]/10"
                      placeholder="Type your response here..."
                      onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion]: e.target.value }))}
                    />
                    <p className="text-xs text-slate-400 mt-1">This response will be evaluated by our AI system.</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (currentQuestion > 0) {
                        setCurrentQuestion(prev => prev - 1);
                        setSelectedAnswer(answers[currentQuestion - 1] as number ?? null);
                      }
                    }}
                    className="text-sm text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-colors"
                    disabled={currentQuestion === 0}
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!selectedAnswer && selectedAnswer !== 0 && !answers[currentQuestion]}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56ff] text-white text-sm font-semibold rounded-xl hover:bg-[#1040cc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {currentQuestion < assessment.questions.length - 1 ? "Next Question" : "Submit Assessment"}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Page */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-xs font-semibold text-[#1a56ff] uppercase tracking-widest mb-3">Skills Assessment</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Prove what you can do.
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Don&apos;t just claim skills — prove them. Complete assessments and practical projects that employers can trust.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verification legend */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
          <p className="text-xs font-semibold text-slate-700 mr-2">Verification Levels:</p>
          {[
            { label: "Self-Reported", color: "bg-slate-200 text-slate-600" },
            { label: "Assessed", color: "bg-blue-100 text-blue-700" },
            { label: "Project Verified", color: "bg-green-100 text-green-700" },
            { label: "Employer Verified", color: "bg-purple-100 text-purple-700" },
          ].map(item => (
            <span key={item.label} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.color}`}>
              {item.label}
            </span>
          ))}
          <p className="text-xs text-slate-400 ml-auto">Higher verification = more employer trust</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          {[
            { id: "assessments", label: "Assessments", count: DEMO_ASSESSMENTS.length },
            { id: "projects", label: "Projects", count: DEMO_PROJECTS.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "assessments" | "projects")}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? "bg-[#e8edff] text-[#1a56ff]" : "bg-slate-200 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Assessments */}
        {activeTab === "assessments" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEMO_ASSESSMENTS.map(assessment => {
              const completed = DEMO_USER.assessmentResults.find(r => r.title.includes(assessment.skillName));
              const typeInfo = typeConfig[assessment.type] || typeConfig.Mixed;

              return (
                <div key={assessment.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-[#e8edff] rounded-xl flex items-center justify-center text-[#1a56ff]">
                      <Award size={20} />
                    </div>
                    {completed && (
                      <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-2 py-1 rounded-lg border border-green-200">
                        <CheckCircle2 size={12} />
                        {completed.score}%
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 mb-1">{assessment.title}</h3>
                  <p className="text-xs text-[#1a56ff] font-medium mb-2">{assessment.careerName}</p>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed flex-1">{assessment.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4 text-xs">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock size={12} />
                      {assessment.duration} min
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 border-l border-slate-200 pl-2">
                      {typeInfo.icon}
                      {typeInfo.label}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 border-l border-slate-200 pl-2">
                      {assessment.questions.length} questions
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                    <span className="text-xs text-slate-400">Passing: {assessment.passingScore}%</span>
                    <button
                      onClick={() => handleStartAssessment(assessment.id)}
                      className="ml-auto flex items-center gap-1.5 bg-[#1a56ff] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#1040cc] transition-colors"
                    >
                      <Play size={11} />
                      {completed ? "Retake" : "Start Assessment"}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Placeholder card */}
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-5 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                <BookOpen size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">More assessments coming</p>
              <p className="text-xs text-slate-400">New skill assessments are added weekly.</p>
            </div>
          </div>
        )}

        {/* Projects */}
        {activeTab === "projects" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DEMO_PROJECTS.map(project => {
              const diff = difficultyConfig[project.difficulty] || difficultyConfig.Intermediate;
              return (
                <div key={project.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-100 transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                      <Briefcase size={20} className="text-amber-600" />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${diff.bg} ${diff.color}`}>
                      {project.difficulty}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 mb-1">{project.title}</h3>
                  <p className="text-xs text-amber-600 font-medium mb-2">{project.careerName}</p>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed flex-1">{project.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.skills.map(s => (
                      <span key={s} className="text-xs bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-lg">{s}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <Clock size={12} />
                    ~{project.estimatedHours} hours
                    <span className="border-l border-slate-200 pl-2">{project.deliverables.length} deliverables</span>
                  </div>

                  <div className="pt-4 border-t border-slate-50">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Instructions:</p>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed line-clamp-3">{project.instructions}</p>
                    <button className="w-full flex items-center justify-center gap-1.5 bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-amber-600 transition-colors">
                      Start Project
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
