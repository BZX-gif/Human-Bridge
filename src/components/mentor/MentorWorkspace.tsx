"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  CalendarDays,
  ChevronRight,
  Info,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  mode?: "ai" | "guided";
}

interface MentorReply {
  reply: string;
  mode: "ai" | "guided";
  provider: string | null;
  disclaimer: string;
  notices: string[];
}

export interface MentorSummary {
  firstName: string;
  careerName: string | null;
  progress: number;
  currentFocus: string | null;
  verifiedSkills: number;
  gaps: { name: string; currentScore: number; requiredScore: number }[];
  todaysTasks: { title: string; status: string; minutes: number }[];
  weeklyHours: number;
  aiConfigured: boolean;
}

const PROMPTS = [
  "What should I do today?",
  "Where are my biggest gaps?",
  "Which project should I build next?",
  "How do I fit this into my week?",
  "Help me prepare for an interview",
];

function PaperMark({ className }: { className?: string }) {
  return (
    <span className={cn("paper-mark", className)} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path className="paper-mark-back" d="M6.5 5.5h9l3 3v10h-12z" />
        <path className="paper-mark-front" d="M5 4h9l4 4v12H5z" />
        <path className="paper-mark-fold" d="M14 4v4h4" />
        <path className="paper-mark-line" d="M8 12h7M8 15h7" />
      </svg>
    </span>
  );
}

export function MentorWorkspace({ summary }: { summary: MentorSummary }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [disclaimer, setDisclaimer] = useState(
    "Guidance is generated from your own recorded plan and evidence. Effort estimates are approximate, and no outcome is guaranteed.",
  );
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Nothing to follow yet: keep the opening context in view.
    if (messages.length === 0 && !sending) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setError(null);
    setInput("");
    const history = messages.slice(-10).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { role: "user", content: message }]);
    setSending(true);
    try {
      const result = await apiFetch<MentorReply>("/api/mentor", {
        method: "POST",
        json: { message, history },
      });
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.reply, mode: result.mode },
      ]);
      setNotices(result.notices);
      setDisclaimer(result.disclaimer);
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.message
          : "Paper could not respond. Your plan is unchanged — please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  const opening = summary.careerName
    ? `You are ${summary.progress}% through the ${summary.careerName} roadmap${
        summary.currentFocus ? `, and the current milestone is “${summary.currentFocus}”` : ""
      }. You have ${summary.verifiedSkills} skill${summary.verifiedSkills === 1 ? "" : "s"} backed by evidence.`
    : "You have not chosen a career direction yet, so any plan would be generic. That decision comes first.";

  return (
    <div className="app-page">
      <header className="animate-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <PaperMark className="paper-mark-hero" />
            <p className="eyebrow">Paper · Your career guide</p>
          </div>
          <h1 className="display-md mt-4 text-ink">A thinking partner, not a fortune teller.</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            Ask Paper about your next step, a gap, a project or your week. It sees your real plan
            and evidence — and nothing else. It will not invent an outcome.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-xs font-medium",
              summary.aiConfigured ? "bg-moss-soft text-moss" : "bg-paper-4 text-graphite",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", summary.aiConfigured ? "bg-moss" : "bg-muted")} aria-hidden />
            {summary.aiConfigured ? "AI available" : "Guided mode"}
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setNotices([]);
                setError(null);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-paper px-3.5 text-xs font-medium text-ink shadow-xs ring-1 ring-line transition-[background-color,transform] duration-200 ease-apple hover:bg-paper-3 active:scale-[0.97]"
            >
              <RotateCcw size={13} aria-hidden />
              Clear
            </button>
          )}
        </div>
      </header>

      <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
        <section className="hb-card animate-rise-lg flex min-h-[460px] flex-col overflow-clip [animation-delay:80ms]">
          <div
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7"
            style={{ maxHeight: "max(320px, min(62vh, calc(100dvh - 440px)))" }}
          >
            {/* Opening context, not a fake assistant message */}
            <div className="rounded-lg bg-paper-2 p-5">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Sparkles size={15} className="text-link" aria-hidden />
                Where you are
              </p>
              <p className="mt-2 text-md leading-relaxed text-graphite">{opening}</p>
              {summary.gaps.length > 0 && (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Largest recorded gap: {summary.gaps[0].name} ({summary.gaps[0].currentScore}/
                  {summary.gaps[0].requiredScore} required).
                </p>
              )}
            </div>

            {messages.length === 0 && (
              <div className="mt-7">
                <p className="text-sm font-medium text-muted">Start with a question</p>
                <div className="stagger mt-3 flex flex-wrap gap-2">
                  {PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void send(prompt)}
                      className="rounded-full bg-paper px-4 py-2 text-left text-sm text-ink ring-1 ring-inset ring-line-strong transition-[background-color,box-shadow,color,transform] duration-200 ease-apple hover:bg-accent-soft hover:text-link hover:ring-accent/40 active:scale-[0.98]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {messages.map((message, index) =>
                message.role === "user" ? (
                  <div key={index} className="hb-swap-in flex justify-end">
                    <div className="max-w-[85%] rounded-[20px] rounded-br-[6px] bg-accent px-4 py-2.5 text-md leading-relaxed text-white">
                      <p className="whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={index} className="hb-swap-in flex items-end justify-start gap-2.5">
                    <PaperMark className="paper-mark-avatar h-7 w-7 shrink-0 rounded-full" />
                    <div className="max-w-[88%] rounded-[20px] rounded-bl-[6px] bg-paper-2 px-4 py-3">
                      <p className="whitespace-pre-line text-md leading-relaxed text-ink">{message.content}</p>
                      {message.mode && (
                        <p className="mt-2.5 border-t border-line-strong/60 pt-2 text-xs text-muted">
                          {message.mode === "ai" ? "AI guidance" : "Guided response · from your plan"}
                        </p>
                      )}
                    </div>
                  </div>
                ),
              )}
              {sending && (
                <div className="hb-swap-in flex items-end gap-2.5" role="status">
                  <PaperMark className="paper-mark-avatar h-7 w-7 shrink-0 rounded-full" />
                  <div className="rounded-[20px] rounded-bl-[6px] bg-paper-2 px-4 py-3.5">
                    <span className="hb-typing" aria-hidden>
                      <span />
                      <span />
                      <span />
                    </span>
                    <span className="sr-only">Reading your plan…</span>
                  </div>
                </div>
              )}
            </div>
            <div ref={endRef} />
          </div>

          {error && (
            <div role="alert" className="mx-4 mb-2 rounded-md bg-rust-soft px-4 py-2.5 text-sm text-rust sm:mx-7">
              {error}
            </div>
          )}
          {notices.length > 0 && (
            <div role="status" className="mx-4 mb-2 rounded-md bg-paper-2 px-4 py-2.5 text-xs leading-relaxed text-muted sm:mx-7">
              {notices[0]}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="border-t border-line p-3 sm:px-7 sm:py-4"
          >
            <div className="flex items-end gap-2 rounded-[22px] bg-paper-2 p-1.5 ring-1 ring-inset ring-line-strong transition-[box-shadow,background-color] duration-200 ease-apple focus-within:bg-paper focus-within:ring-2 focus-within:ring-accent">
              <label htmlFor="mentor-input" className="sr-only">
                Ask Paper
              </label>
              <textarea
                id="mentor-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send(input);
                  }
                }}
                rows={1}
                maxLength={4000}
                placeholder="Ask about your next step, a gap, or how to plan your week…"
                className="max-h-40 min-h-[36px] min-w-0 flex-1 resize-none bg-transparent px-3 py-1.5 text-md leading-relaxed text-ink [field-sizing:content] placeholder:text-muted focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-[background-color,transform,opacity] duration-200 ease-apple hover:bg-accent-hover active:scale-90 disabled:bg-paper-4 disabled:text-muted"
                aria-label="Send message"
              >
                {sending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <ArrowUp size={17} strokeWidth={2.4} aria-hidden />}
              </button>
            </div>
            <p className="mt-2.5 px-1 text-xs leading-relaxed text-muted">
              {disclaimer} Press Enter to send, Shift + Enter for a new line.
            </p>
          </form>
        </section>

        <aside className="space-y-4 lg:space-y-5">
          <div className="hb-card p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Info size={15} aria-hidden />
              What it can see
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Career goal</dt>
                <dd className="text-right font-medium text-ink">{summary.careerName ?? "Not chosen"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Roadmap progress</dt>
                <dd className="tabular text-right font-medium text-ink">{summary.progress}%</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-muted">Current focus</dt>
                <dd className="max-w-[170px] text-right font-medium leading-snug text-ink">
                  {summary.currentFocus ?? "None"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Verified skills</dt>
                <dd className="tabular text-right font-medium text-ink">{summary.verifiedSkills}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Stated time</dt>
                <dd className="tabular text-right font-medium text-ink">{summary.weeklyHours}h/week</dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              It cannot see your email, password, private messages or anything you have not recorded
              in Human Bridge.
            </p>
          </div>

          <div className="hb-card p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ShieldCheck size={15} className="text-moss" aria-hidden />
              Honest by design
            </p>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted">
              <li>It uses only your recorded plan, skills and evidence.</li>
              <li>It will not invent resources, employers, salaries or vacancies.</li>
              <li>It will not call a skill verified unless an assessment or employer did.</li>
              <li>If AI is unavailable, a grounded guided response takes over.</li>
            </ul>
          </div>

          {summary.gaps.length > 0 && (
            <div className="hb-card p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Target size={15} aria-hidden />
                Recorded gaps
              </p>
              <ul className="mt-4 space-y-3.5">
                {summary.gaps.slice(0, 4).map((gap) => (
                  <li key={gap.name} className="text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-ink">{gap.name}</span>
                      <span className="tabular text-xs text-muted">
                        {gap.currentScore}/{gap.requiredScore}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-3">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${Math.min(100, Math.round((gap.currentScore / Math.max(1, gap.requiredScore)) * 100))}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/skills" className="hb-link mt-4 text-sm">
                Open skills
                <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
              </Link>
            </div>
          )}

          <div className="hb-card p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <CalendarDays size={15} aria-hidden />
              Today
            </p>
            {summary.todaysTasks.length === 0 ? (
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Nothing scheduled. Ask Paper what deserves the time.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {summary.todaysTasks.slice(0, 4).map((task) => (
                  <li key={task.title} className="flex items-start gap-2.5 text-sm text-ink">
                    <span className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full", task.status === "done" ? "bg-moss" : "bg-line-strong")} aria-hidden />
                    <span className="min-w-0 flex-1 leading-snug">{task.title}</span>
                    <span className="tabular shrink-0 text-xs text-muted">{task.minutes}m</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/planner" className="hb-link mt-4 text-sm">
              Open planner
              <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
