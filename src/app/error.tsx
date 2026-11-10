"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error", error);
  }, [error]);

  return (
    <main id="main-content" className="app-page flex min-h-[60vh] flex-col justify-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 max-w-2xl font-display text-[clamp(2rem,4.4vw,3rem)] leading-[1.05] tracking-[-0.02em]">
        This page could not be shown.
      </h1>
      <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-muted">
        Your saved plan, tasks and evidence are unaffected. Try the page again, or return to your
        workspace.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-4 text-[12.5px] font-medium text-paper transition-colors hover:bg-graphite"
        >
          <RotateCcw size={13} aria-hidden />
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center rounded-md border border-line px-4 text-[12.5px] font-medium text-graphite transition-colors hover:border-line-strong"
        >
          Back to workspace
        </Link>
      </div>
    </main>
  );
}
