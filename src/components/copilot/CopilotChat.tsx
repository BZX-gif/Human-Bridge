"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
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
    endRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <main className="min-h-full bg-paper-2">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-8 sm:px-6">
        <header className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink">
            Career Copilot
          </p>
          <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.2rem)] leading-tight tracking-[-0.015em] text-ink">
            Ask about your evidence, {userName}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The Copilot is given your real skill scores, levels, verification status and gaps. It
            is instructed not to invent numbers — if it does not know, it will say so.
          </p>
        </header>

        {!available && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-ochre/20 bg-ochre-soft p-4">
            <Bot size={16} className="mt-0.5 shrink-0 text-ochre" aria-hidden />
            <div className="text-sm text-ochre">
              <p className="font-semibold">Career Copilot is unavailable</p>
              <p className="mt-1 leading-relaxed">
                No AI provider is configured on this deployment, so there is nothing to chat with.
                We will not simulate an assistant with pre-written replies. Your skill gaps,
                learning path and job matches are all still available and are computed
                deterministically.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ButtonLink href="/dashboard" size="sm">
                  Go to your dashboard
                </ButtonLink>
                <ButtonLink href="/passport" size="sm" variant="secondary">
                  View your passport
                </ButtonLink>
              </div>
            </div>
          </div>
        )}

        {available && (
          <>
            <div className="flex-1 space-y-4" aria-live="polite">
              {messages.length === 0 && (
                <div className="rounded-lg border border-line bg-paper p-6">
                  <p className="mb-4 text-sm text-muted">Try one of these:</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        className="rounded-md border border-line px-3 py-2 text-left text-xs text-graphite transition-colors hover:border-ink hover:text-ink"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      message.role === "user"
                        ? "bg-ink text-white"
                        : "bg-paper-2 text-ink"
                    }`}
                    aria-hidden
                  >
                    {message.role === "user" ? <User size={15} /> : <Bot size={15} />}
                  </span>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-ink text-white"
                        : "border border-line bg-paper text-ink"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper-2 text-ink" aria-hidden>
                    <Bot size={15} />
                  </span>
                  <div className="rounded-lg border border-line bg-paper px-4 py-3 text-sm text-faint">
                    Thinking...
                  </div>
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-md bg-rust-soft p-3 text-sm text-rust">
                  {error}
                </p>
              )}
              <div ref={endRef} />
            </div>

            <form
              className="sticky bottom-0 mt-6 flex gap-2 bg-paper-2 py-4"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <label htmlFor="copilot-input" className="sr-only">
                Message the Career Copilot
              </label>
              <input
                id="copilot-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your skills, gaps or next step..."
                className="flex-1 rounded-md border border-line px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-ink focus:outline-none focus:ring-2 focus:ring-[#0B0B0C]/20"
              />
              <Button type="submit" disabled={busy || !input.trim()}>
                <Send size={15} aria-hidden />
                <span className="sr-only sm:not-sr-only">Send</span>
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
