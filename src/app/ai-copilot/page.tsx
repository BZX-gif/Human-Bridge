"use client";

import { useState, useRef, useEffect } from "react";
import { DEMO_USER, DEMO_CAREERS } from "@/lib/demo-data";
import { Send, Sparkles, User, RefreshCw, Briefcase, BarChart3, BookOpen, Award } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "What career should I choose based on my background?",
  "What skills am I missing to become a Data Analyst?",
  "Why am I not getting interviews?",
  "How can I become a Product Manager?",
  "Which jobs match my current skill profile?",
  "Give me a project to prove my SQL skills.",
  "Analyse this job description for me.",
  "Improve my answer to a behavioural interview question.",
];

const AI_RESPONSES: Record<string, string> = {
  default: "Based on your profile as Aditya Sharma, targeting a Data Analyst role with 72% career readiness, here's my analysis:\n\n**Your current strengths:**\n• Excel (82%) — You're assessment-verified here. Employers will trust this.\n• SQL (61%) — Solid foundation, but intermediate SQL (window functions, complex joins) needs work.\n• Communication (76%) — This is often underestimated. Keep developing it.\n\n**Your priority gaps:**\n🔴 Power BI (25%) — This is your biggest gap. Most Data Analyst roles list Power BI as essential.\n🔴 Statistics (48%) — Hypothesis testing and probability concepts are regularly tested in interviews.\n\n**My recommendation:**\nFocus on Power BI first — you can build a real dashboard project within 1 week that employers will see. Then tackle Statistics with practical application, not just theory.\n\nWould you like me to build your 4-week roadmap?",
  career: "Looking at your background, I recommend focusing on **Data Analytics** — here's why:\n\n1. You already have Excel (82%) which is the #1 skill for junior analysts\n2. Your SQL foundation (61%) gives you a real head start\n3. Data Analyst roles in India have a 23% YoY demand increase\n4. Entry-level salaries range ₹4–8 LPA — achievable in 6–8 weeks with targeted preparation\n\n**Alternative paths worth considering:**\n• Business Analyst — Uses your existing analytical thinking with less technical SQL depth\n• Digital Marketing Analyst — Combines data with creative thinking\n\nWant me to show you the exact skill gap for each?",
  skills: "Here's your current skill gap for Data Analyst (based on your profile):\n\n**Skill Gap Analysis:**\n\n🟢 Excel — 82% → Target: 80%+ → **NO GAP**\n🟢 Communication — 76% → Target: 75%+ → **NO GAP**\n🟡 SQL — 61% → Target: 75%+ → **14% gap** — Priority: High\n🔴 Statistics — 48% → Target: 65%+ → **17% gap** — Priority: Medium\n🔴 Power BI — 25% → Target: 70%+ → **45% gap** — Priority: Critical\n\n**Your 6-week plan to close these gaps:**\n• Week 1–2: Power BI (start with the basics immediately)\n• Week 3: SQL intermediate (window functions, subqueries)\n• Week 4: Statistics (practical focus — business context)\n• Week 5: Build a complete analytics project\n• Week 6: Apply to matched jobs\n\nShall I generate specific practice tasks for any of these?",
  interview: "Here are the most common Data Analyst interview questions you should prepare for:\n\n**Technical Questions:**\n1. 'Write a SQL query to find the top 5 customers by revenue in the last quarter.'\n2. 'Explain the difference between INNER JOIN and LEFT JOIN.'\n3. 'How would you identify outliers in a dataset?'\n4. 'What is a p-value, and how would you explain it to a non-technical stakeholder?'\n\n**Scenario Questions:**\n1. 'Our app conversion rate dropped 15% last week. How would you investigate?'\n2. 'A senior manager asks you to prove that marketing spend is working. How do you approach this?'\n\n**Behavioural Questions:**\n1. 'Tell me about a time you found an insight that changed a business decision.'\n2. 'How do you handle conflicting data from different sources?'\n\nWould you like me to evaluate your answer to any of these questions?",
};

function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("career") || lower.includes("choose") || lower.includes("which career")) {
    return AI_RESPONSES.career;
  }
  if (lower.includes("missing") || lower.includes("gap") || lower.includes("skill")) {
    return AI_RESPONSES.skills;
  }
  if (lower.includes("interview") || lower.includes("question") || lower.includes("not getting")) {
    return AI_RESPONSES.interview;
  }
  return AI_RESPONSES.default;
}

function formatMessage(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-bold text-slate-900 mt-3 mb-1">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith("• ") || line.startsWith("🟢 ") || line.startsWith("🟡 ") || line.startsWith("🔴 ")) {
      return <p key={i} className="text-sm text-slate-700 my-0.5 pl-2">{line}</p>;
    }
    if (/^\d+\./.test(line)) {
      return <p key={i} className="text-sm text-slate-700 my-0.5 pl-2">{line}</p>;
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return <p key={i} className="text-sm text-slate-700">{line}</p>;
  });
}

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello, ${DEMO_USER.name}! 👋 I'm your Human Bridge AI Career Copilot.\n\nI have access to your profile and know you're targeting a **Data Analyst** role with 72% career readiness. I can help you with:\n\n• Understanding your skill gaps\n• Building a personalised roadmap\n• Interview preparation\n• Job description analysis\n• Career guidance\n\nWhat would you like to explore today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 800 + Math.random() * 800));

    const response = getAIResponse(text);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: "assistant", content: response, timestamp: new Date() }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <main className="pt-16 min-h-screen bg-[#f8fafc] flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Human Bridge AI</h1>
              <p className="text-xs text-slate-500">Your personal career copilot</p>
            </div>
            <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Demo Mode</span>
          </div>

          {/* Profile context */}
          <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <div className="w-6 h-6 bg-[#1a56ff] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
              {DEMO_USER.avatarInitials}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">{DEMO_USER.name}</p>
              <p className="text-[10px] text-slate-400">Targeting: {DEMO_USER.targetCareer.name} · {DEMO_USER.careerReadiness}% ready</p>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Chat */}
          <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-96">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#1a56ff] text-white rounded-tr-sm"
                      : "bg-[#f8fafc] border border-slate-100 rounded-tl-sm"
                  }`}>
                    {msg.role === "user" ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : (
                      <div>{formatMessage(msg.content)}</div>
                    )}
                    <p className={`text-[10px] mt-2 ${msg.role === "user" ? "text-blue-200" : "text-slate-400"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-[#1a56ff] rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-white text-[10px] font-bold">
                      {DEMO_USER.avatarInitials}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5 items-center h-5">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts */}
            <div className="px-4 pb-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {SUGGESTED_PROMPTS.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="shrink-0 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-[#e8edff] hover:text-[#1a56ff] hover:border-blue-200 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-slate-100 p-4">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about your career, skills, jobs or interview prep..."
                  className="flex-1 text-sm bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#1a56ff] focus:ring-2 focus:ring-[#1a56ff]/10 text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-10 h-10 bg-[#1a56ff] text-white rounded-xl flex items-center justify-center hover:bg-[#1040cc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Demo AI — responses are simulated. Real AI integration uses your actual profile data.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">AI can help you with</h3>
              <div className="space-y-2.5">
                {[
                  { icon: Briefcase, label: "Career guidance", desc: "Find the right path" },
                  { icon: BarChart3, label: "Skill gap analysis", desc: "What you're missing" },
                  { icon: BookOpen, label: "Learning roadmap", desc: "How to close the gap" },
                  { icon: Award, label: "Interview prep", desc: "Questions and feedback" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon size={14} className="text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Try these prompts</h3>
              <div className="space-y-1.5">
                {SUGGESTED_PROMPTS.slice(4).map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="w-full text-left text-xs text-slate-600 hover:text-[#1a56ff] p-2 rounded-lg hover:bg-[#e8edff] transition-colors leading-relaxed"
                  >
                    → {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-4 text-white">
              <p className="text-xs font-semibold text-purple-200 mb-1">Your Profile</p>
              <p className="font-bold mb-1">{DEMO_USER.name}</p>
              <p className="text-xs text-purple-200 mb-3">→ {DEMO_USER.targetCareer.name}</p>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-white rounded-full" style={{ width: `${DEMO_USER.careerReadiness}%` }} />
              </div>
              <p className="text-xs text-purple-200">{DEMO_USER.careerReadiness}% career ready</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
