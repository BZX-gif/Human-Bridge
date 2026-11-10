"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareQuote, Quote } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import type { DefenseQuestionView } from "@/lib/services/evaluation-service";

/** Impure clock reads live at module scope, outside the render path. */
function now(): number {
  return Date.now();
}

function elapsedSeconds(from: number): number {
  return from === 0 ? 0 : Math.floor((now() - from) / 1000);
}

interface Props {
  attemptId: number;
  questions: DefenseQuestionView[];
}

/**
 * The defense round. Questions are generated from the candidate's own
 * submission, so there is nothing to prepare — the point is to check that the
 * work is theirs and that they understand it.
 */
export function DefenseRound({ attemptId, questions }: Props) {
  const router = useRouter();
  const pending = questions.filter((q) => !q.answered);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = now();
  }, [index]);

  const question = pending[index];

  const submit = async () => {
    if (answer.trim().length < 5) {
      setError("Write an answer before continuing.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<{ remaining: number; complete: boolean }>(
        `/api/assessments/${attemptId}/defense`,
        {
          method: "POST",
          json: {
            attemptId,
            questionId: question.id,
            answer,
            timeSpentSeconds: elapsedSeconds(startedAt.current),
          },
        },
      );
      setAnswer("");
      if (result.complete) {
        router.push(`/assessments/attempt/${attemptId}/result`);
      } else {
        setIndex((i) => i + 1);
        setSubmitting(false);
      }
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not save your answer.");
      setSubmitting(false);
    }
  };

  if (!question) {
    return (
      <main className="min-h-full bg-paper-2">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.2rem)] leading-tight tracking-[-0.015em] text-ink">Defense round complete</h1>
          <p className="mt-2 text-sm text-muted">
            Your answers have been scored on the server and folded into your final result.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push(`/assessments/attempt/${attemptId}/result`)}>
              View your result
            </Button>
          </div>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-full bg-paper-2">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink">
            Defense round
          </p>
          <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.2rem)] leading-tight tracking-[-0.015em] text-ink">Explain your own work</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            These questions were generated from what you actually submitted. There is nothing to
            revise — we are checking that you understand and can defend your own decisions.
          </p>
        </header>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={pending.length}>
            {pending.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < index ? "bg-ink" : i === index ? "bg-ink/40" : "bg-paper-4"
                }`}
              />
            ))}
          </div>
          <span className="shrink-0 text-xs text-muted">
            {index + 1} of {pending.length}
          </span>
        </div>

        <article className="rounded-lg border border-line bg-paper p-6">
          {question.sourceExcerpt && (
            <blockquote className="mb-5 rounded-md border-l-2 border-line-strong bg-paper-2 p-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                <Quote size={11} aria-hidden />
                From your submission
              </p>
              <p className="font-mono text-xs leading-relaxed text-muted">
                {question.sourceExcerpt}
              </p>
            </blockquote>
          )}

          <h2 className="flex gap-2 text-base font-semibold leading-relaxed text-ink">
            <MessageSquareQuote size={18} className="mt-0.5 shrink-0 text-ink" aria-hidden />
            {question.question}
          </h2>

          <label htmlFor="defense-answer" className="sr-only">
            Your answer
          </label>
          <textarea
            id="defense-answer"
            rows={9}
            className="mt-5 w-full rounded-md border border-line px-3.5 py-3 text-sm leading-relaxed text-ink placeholder:text-faint focus:border-ink focus:outline-none focus:ring-2 focus:ring-[#0B0B0C]/20"
            placeholder="Answer in your own words. Reference the specifics of what you did."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-faint">
            {answer.trim().split(/\s+/).filter(Boolean).length} words
          </p>

          {error && (
            <p role="alert" className="mt-3 text-xs text-rust">
              {error}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <Button onClick={() => void submit()} disabled={submitting}>
              {submitting
                ? "Saving..."
                : index === pending.length - 1
                  ? "Submit and finish"
                  : "Next question"}
            </Button>
          </div>
        </article>

        <p className="mt-4 text-center text-xs text-faint">
          Answers are scored on the server. You cannot return to a question once submitted.
        </p>
      </div>
    </main>
  );
}

export function DefenseError({ message }: { message: string }) {
  return <ErrorState message={message} />;
}
