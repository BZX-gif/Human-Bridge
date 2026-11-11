"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { ButtonLink } from "@/components/ui/Button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What is my biggest skill gap right now?",
  "What should I work on next to reach my target role?",
  "Why did I score the way I did on my last assessment?",
  "Which of my skills are actually verified?",
];

/**
 * Career Copilot.
 *
 * There is no canned script here. Every reply comes from the server, which
 * grounds the model in the user's real skill scores and gaps. If no provider is
 * configured we say so plainly instead of faking intelligence.
 */
export function CopilotChat({
  available,
  userName,
}: {
  available: boolean;
  userName: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Nothing to follow yet: leave the page where it is.
    if (messages.length === 0 && !busy) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<{ reply: string }>("/api/copilot", {
        method: "POST",
        json: { messages: next },
      });
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(
        e instanceof ApiClientError
          ? e.message
          : "The Career Copilot could not be reached. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main-content" className="app-page">
      <div className="mx-auto max-w-3xl">
        <header className="animate-rise">
          <p className="eyebrow">Career Copilot</p>
          <h1 className="display-md mt-2.5 text-ink">Ask about your evidence, {userName}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            The Copilot is given your real skill scores, levels, verification status and gaps. It
            is instructed not to invent numbers — if it does not know, it will say so.
          </p>
        </header>

        {!available && (
          <div className="animate-rise mt-7 flex items-start gap-3.5 rounded-lg bg-ochre-soft p-5 sm:p-6">
            <Bot size={20} className="mt-0.5 shrink-0 text-ochre" aria-hidden />
            <div className="text-md text-ochre">
              <p className="text-base font-semibold">Career Copilot is unavailable</p>
              <p className="mt-1 leading-relaxed">
                No AI provider is configured on this deployment, so there is nothing to chat with.
                We will not simulate an assistant with pre-written replies. Your skill gaps,
                learning path and job matches are all still available and are computed
                deterministically.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <ButtonLink href="/dashboard" size="md">
                  Go to your dashboard
                </ButtonLink>
                <ButtonLink href="/passport" size="md" variant="secondary">
                  View your passport
                </ButtonLink>
              </div>
            </div>
          </div>
        )}

        {available && (
          <section className="hb-card animate-rise-lg mt-7 flex min-h-[420px] flex-col overflow-clip [animation-delay:80ms]">
            <div
              className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7"
              style={{ maxHeight: "max(320px, calc(100dvh - 420px))" }}
              aria-live="polite"
            >
              {messages.length === 0 && (
                <div>
                  <p className="text-sm font-medium text-muted">Try one of these:</p>
                  <div className="stagger mt-3 flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        className="rounded-full bg-paper px-4 py-2 text-left text-sm text-ink ring-1 ring-inset ring-line-strong transition-[background-color,box-shadow,color,transform] duration-200 ease-apple hover:bg-accent-soft hover:text-link hover:ring-accent/40 active:scale-[0.98]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, i) =>
                message.role === "user" ? (
                  <div key={i} className="hb-swap-in flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-[20px] rounded-br-[6px] bg-accent px-4 py-2.5 text-md leading-relaxed text-white">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="hb-swap-in flex items-end gap-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-link"
                      aria-hidden
                    >
                      <Bot size={15} />
                    </span>
                    <div className="max-w-[88%] whitespace-pre-wrap rounded-[20px] rounded-bl-[6px] bg-paper-2 px-4 py-3 text-md leading-relaxed text-ink">
                      {message.content}
                    </div>
                  </div>
                ),
              )}

              {busy && (
                <div className="hb-swap-in flex items-end gap-2.5" role="status">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-link"
                    aria-hidden
                  >
                    <Bot size={15} />
                  </span>
                  <div className="rounded-[20px] rounded-bl-[6px] bg-paper-2 px-4 py-3.5">
                    <span className="hb-typing" aria-hidden>
                      <span />
                      <span />
                      <span />
                    </span>
                    <span className="sr-only">Thinking…</span>
                  </div>
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-md bg-rust-soft px-4 py-3 text-sm text-rust">
                  {error}
                </p>
              )}
              <div ref={endRef} />
            </div>

            <form
              className="border-t border-line p-3 sm:px-7 sm:py-4"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <div className="flex items-center gap-2 rounded-full bg-paper-2 p-1.5 ring-1 ring-inset ring-line-strong transition-[box-shadow,background-color] duration-200 ease-apple focus-within:bg-paper focus-within:ring-2 focus-within:ring-accent">
                <label htmlFor="copilot-input" className="sr-only">
                  Message the Career Copilot
                </label>
                <input
                  id="copilot-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your skills, gaps or next step…"
                  className="h-9 min-w-0 flex-1 bg-transparent px-3 text-md text-ink placeholder:text-muted focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-[background-color,transform] duration-200 ease-apple hover:bg-accent-hover active:scale-90 disabled:bg-paper-4 disabled:text-muted"
                  aria-label="Send"
                >
                  <ArrowUp size={17} strokeWidth={2.4} aria-hidden />
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
