"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, MessageSquareQuote, Quote } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/utils";
import type { DefenseQuestionView } from "@/lib/services/evaluation-service";
import { InlineText } from "@/components/ui/InlineText";

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
      <main id="main-content" className="app-page">
        <div className="mx-auto max-w-xl py-12 text-center sm:py-20">
          <span className="animate-focus-in mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-moss-soft text-moss">
            <CheckCircle2 size={28} strokeWidth={1.8} aria-hidden />
          </span>
          <h1 className="display-md animate-rise mt-6 text-ink">Defense round complete</h1>
          <p className="animate-rise mx-auto mt-3 max-w-md text-base leading-relaxed text-muted">
            Your answers have been scored on the server and folded into your final result.
          </p>
          <div className="animate-rise mt-8">
            <Button size="lg" onClick={() => router.push(`/assessments/attempt/${attemptId}/result`)}>
              View your result
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const words = answer.trim().split(/\s+/).filter(Boolean).length;

  return (
    <main id="main-content" className="app-page">
      <div className="mx-auto max-w-3xl">
        <header className="animate-rise">
          <p className="eyebrow">Defense round</p>
          <h1 className="display-md mt-2.5 text-ink">Explain your own work</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            These questions were generated from what you actually submitted. There is nothing to
            revise — we are checking that you understand and can defend your own decisions.
          </p>
        </header>

        {/* Progress */}
        <div className="mt-7 flex items-center gap-4">
          <div
            className="flex flex-1 gap-1.5"
            role="progressbar"
            aria-label="Defense questions"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={pending.length}
          >
            {pending.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-500 ease-apple",
                  i < index ? "bg-accent" : i === index ? "bg-accent/40" : "bg-paper-4",
                )}
              />
            ))}
          </div>
          <span className="tabular shrink-0 text-sm font-medium text-graphite">
            {index + 1} of {pending.length}
          </span>
        </div>

        <article key={question.id} className="hb-tile hb-tile-white hb-swap-in mt-5 p-6 sm:p-9">
          {question.sourceExcerpt && (
            <blockquote className="mb-6 rounded-md bg-paper-2 p-5">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted">
                <Quote size={13} aria-hidden />
                From your submission
              </p>
              <p className="font-mono text-sm leading-relaxed text-graphite">{question.sourceExcerpt}</p>
            </blockquote>
          )}

          <h2 className="flex gap-3 text-lg font-semibold leading-relaxed tracking-[-0.012em] text-ink">
            <MessageSquareQuote size={22} strokeWidth={1.7} className="mt-1 shrink-0 text-link" aria-hidden />
            <span>
              <InlineText>{question.question}</InlineText>
            </span>
          </h2>

          <label htmlFor="defense-answer" className="sr-only">
            Your answer
          </label>
          <textarea
            id="defense-answer"
            rows={9}
            className="hb-input mt-6 leading-relaxed"
            placeholder="Answer in your own words. Reference the specifics of what you did."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          {error && (
            <p role="alert" className="mt-3 rounded-md bg-rust-soft px-4 py-3 text-sm text-rust">
              {error}
            </p>
          )}

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="tabular text-sm text-muted">
              {words} {words === 1 ? "word" : "words"}
            </p>
            <Button size="lg" onClick={() => void submit()} disabled={submitting}>
              {submitting ? "Saving…" : index === pending.length - 1 ? "Submit and finish" : "Next question"}
              {!submitting && index !== pending.length - 1 && <ChevronRight size={17} aria-hidden />}
            </Button>
          </div>
        </article>

        <p className="mt-5 text-center text-sm text-muted">
          Answers are scored on the server. You cannot return to a question once submitted.
        </p>
      </div>
    </main>
  );
}

export function DefenseError({ message }: { message: string }) {
  return <ErrorState message={message} />;
}
