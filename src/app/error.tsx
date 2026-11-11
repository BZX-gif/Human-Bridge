"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";

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
      <p className="eyebrow animate-rise">Something went wrong</p>
      <h1 className="display-md animate-rise mt-3 max-w-2xl [animation-delay:60ms]">
        This page could not be shown.
      </h1>
      <p className="animate-rise mt-4 max-w-xl text-base leading-relaxed text-muted [animation-delay:120ms]">
        Your saved plan, tasks and evidence are unaffected. Try the page again, or return to your
        workspace.
      </p>
      <div className="animate-rise mt-8 flex flex-wrap gap-2.5 [animation-delay:180ms]">
        <Button type="button" onClick={reset}>
          <RotateCcw size={15} aria-hidden />
          Try again
        </Button>
        <ButtonLink href="/dashboard" variant="secondary">
          Back to workspace
        </ButtonLink>
      </div>
    </main>
  );
}
