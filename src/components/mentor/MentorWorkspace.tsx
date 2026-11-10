"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  CalendarDays,
  Info,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { ButtonLink } from "@/components/ui/Button";
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
      <header className="flex flex-col gap-3 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <PaperMark className="paper-mark-hero" />
            <p className="eyebrow">Paper · Your career guide</p>
          </div>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3rem)] leading-[1.02] tracking-[-0.02em]">
            A thinking partner, not a fortune teller.
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
            Ask Paper about your next step, a gap, a project or your week. It sees your real plan
            and evidence — and nothing else. It will not invent an outcome.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-[10px] font-medium",
              summary.aiConfigured
                ? "border-moss/25 bg-moss-soft text-moss"
                : "border-line bg-paper-2 text-muted",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", summary.aiConfigured ? "bg-moss" : "bg-faint")} aria-hidden />
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
              className="inline-flex items-center gap-1 rounded-[4px] border border-line px-2 py-1 text-[10px] font-medium text-muted hover:border-line-strong hover:text-ink"
            >
              <RotateCcw size={10} aria-hidden />
              Clear
            </button>
          )}
        </div>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="flex min-h-[560px] flex-col overflow-hidden rounded-lg border border-line bg-paper">
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6" style={{ maxHeight: "62vh" }}>
            {/* Opening context, not a fake assistant message */}
            <div className="rounded-lg border border-line bg-paper-2 p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                <Sparkles size={11} aria-hidden />
                Where you are
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-graphite">{opening}</p>
              {summary.gaps.length > 0 && (
                <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
                  Largest recorded gap: {summary.gaps[0].name} ({summary.gaps[0].currentScore}/
                  {summary.gaps[0].requiredScore} required).
                </p>
              )}
            </div>

            {messages.length === 0 && (
              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                  Start with a question
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void send(prompt)}
                      className="rounded-full border border-line bg-paper px-3 py-1.5 text-left text-[11px] text-graphite transition-colors hover:border-ink hover:text-ink"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 space-y-4">
              {messages.map((message, index) =>
                message.role === "user" ? (
                  <div key={index} className="flex justify-end gap-2.5">
                    <div className="max-w-[85%] rounded-lg rounded-br-[3px] bg-ink px-4 py-3 text-[12.5px] leading-relaxed text-paper">
                      <p className="whitespace-pre-line">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div key={index} className="flex justify-start gap-2.5">
                    <PaperMark className="paper-mark-avatar mt-0.5 h-6 w-6 shrink-0 rounded-full" />
                    <div className="max-w-[88%] rounded-lg rounded-bl-[3px] border border-line bg-paper px-4 py-3">
                      <p className="whitespace-pre-line text-[12.5px] leading-[1.75] text-graphite">
                        {message.content}
                      </p>
                      {message.mode && (
                        <p className="mt-2 border-t border-line pt-2 text-[9.5px] uppercase tracking-[0.12em] text-faint">
                          {message.mode === "ai" ? "AI guidance" : "Guided response · from your plan"}
                        </p>
                      )}
                    </div>
                  </div>
                ),
              )}
              {sending && (
                <div className="flex items-center gap-2.5 text-[11px] text-faint" role="status">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-paper-2">
                    <Loader2 size={11} className="animate-spin" aria-hidden />
                  </span>
                  Reading your plan…
                </div>
              )}
            </div>
            <div ref={endRef} />
          </div>

          {error && (
            <div role="alert" className="mx-4 mb-2 rounded-md border border-rust/20 bg-rust-soft px-3 py-2 text-[11.5px] text-rust sm:mx-6">
              {error}
            </div>
          )}
          {notices.length > 0 && (
            <div role="status" className="mx-4 mb-2 rounded-md border border-line bg-paper-2 px-3 py-2 text-[10.5px] leading-relaxed text-muted sm:mx-6">
              {notices[0]}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="border-t border-line bg-paper p-3 sm:p-4"
          >
            <div className="flex items-end gap-2">
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
                rows={2}
                maxLength={4000}
                placeholder="Ask about your next step, a gap, or how to plan your week…"
                className="hb-input min-h-[44px] resize-none py-2.5"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ink text-paper transition-colors hover:bg-ink-soft disabled:opacity-40"
                aria-label="Send message"
              >
                {sending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <ArrowUp size={15} aria-hidden />}
              </button>
            </div>
            <p className="mt-2 text-[9.5px] leading-relaxed text-faint">
              {disclaimer} Press Enter to send, Shift + Enter for a new line.
            </p>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-line bg-paper p-5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              <Info size={11} aria-hidden />
              What it can see
            </p>
            <dl className="mt-3 space-y-2.5 text-[11.5px]">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Career goal</dt>
                <dd className="text-right font-medium text-graphite">{summary.careerName ?? "Not chosen"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Roadmap progress</dt>
                <dd className="text-right font-medium text-graphite tabular">{summary.progress}%</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Current focus</dt>
                <dd className="max-w-[170px] text-right font-medium leading-snug text-graphite">
                  {summary.currentFocus ?? "None"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Verified skills</dt>
                <dd className="text-right font-medium text-graphite tabular">{summary.verifiedSkills}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Stated time</dt>
                <dd className="text-right font-medium text-graphite tabular">{summary.weeklyHours}h/week</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-line pt-3 text-[10px] leading-relaxed text-faint">
              It cannot see your email, password, private messages or anything you have not recorded
              in Human Bridge.
            </p>
          </div>

          <div className="rounded-lg border border-line bg-paper-2 p-5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              <ShieldCheck size={11} aria-hidden />
              Honest by design
            </p>
            <ul className="mt-2.5 space-y-2 text-[10.5px] leading-relaxed text-muted">
              <li>It uses only your recorded plan, skills and evidence.</li>
              <li>It will not invent resources, employers, salaries or vacancies.</li>
              <li>It will not call a skill verified unless an assessment or employer did.</li>
              <li>If AI is unavailable, a grounded guided response takes over.</li>
            </ul>
          </div>

          {summary.gaps.length > 0 && (
            <div className="rounded-lg border border-line bg-paper p-5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                <Target size={11} aria-hidden />
                Recorded gaps
              </p>
              <ul className="mt-2.5 space-y-2">
                {summary.gaps.slice(0, 4).map((gap) => (
                  <li key={gap.name} className="text-[11px]">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-graphite">{gap.name}</span>
                      <span className="text-[10px] tabular text-faint">
                        {gap.currentScore}/{gap.requiredScore}
                      </span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-paper-3">
                      <div
                        className="h-full rounded-full bg-graphite"
                        style={{ width: `${Math.min(100, Math.round((gap.currentScore / Math.max(1, gap.requiredScore)) * 100))}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <ButtonLink href="/skills" variant="ghost" size="sm" className="mt-2 px-0">
                Open skills
                <ArrowRight size={11} aria-hidden />
              </ButtonLink>
            </div>
          )}

          <div className="rounded-lg border border-line bg-paper p-5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              <CalendarDays size={11} aria-hidden />
              Today
            </p>
            {summary.todaysTasks.length === 0 ? (
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Nothing scheduled. Ask Paper what deserves the time.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {summary.todaysTasks.slice(0, 4).map((task) => (
                  <li key={task.title} className="flex items-start gap-1.5 text-[11px] text-graphite">
                    <span className={cn("mt-1.5 h-1 w-1 shrink-0 rounded-full", task.status === "done" ? "bg-moss" : "bg-faint")} aria-hidden />
                    <span className="min-w-0 flex-1 leading-snug">{task.title}</span>
                    <span className="text-[9.5px] text-faint">{task.minutes}m</span>
                  </li>
                ))}
              </ul>
            )}
            <ButtonLink href="/planner" variant="ghost" size="sm" className="mt-2 px-0">
              Open planner
              <ArrowRight size={11} aria-hidden />
            </ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  );
}
