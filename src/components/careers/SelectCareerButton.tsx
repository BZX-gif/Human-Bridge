"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Target } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

/**
 * Set the candidate's career goal and build their roadmap. The API creates the
 * plan in the same request, so the next screen is never an empty shell.
 */
export function SelectCareerButton({
  careerId,
  careerName,
  fullWidth = false,
}: {
  careerId: number;
  careerName: string;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const select = async () => {
    setState("saving");
    setError(null);
    try {
      await apiFetch("/api/onboarding/target", {
        method: "POST",
        json: { careerId },
      });
      setState("done");
      router.push("/journey");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not set your career goal.");
      setState("idle");
    }
  };

  return (
    <div className={fullWidth ? "w-full" : undefined}>
      <Button
        onClick={() => void select()}
        disabled={state !== "idle"}
        size="md"
        className={fullWidth ? "w-full" : undefined}
      >
        {state === "done" ? (
          <Check size={15} aria-hidden />
        ) : state === "saving" ? (
          <Loader2 size={15} className="animate-spin" aria-hidden />
        ) : (
          <Target size={15} aria-hidden />
        )}
        {state === "done"
          ? "Journey created"
          : state === "saving"
            ? "Building your roadmap…"
            : `Start my ${careerName} journey`}
        {state === "idle" && <ArrowRight size={15} aria-hidden />}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-[11.5px] leading-relaxed text-rust">
          {error}
        </p>
      )}
    </div>
  );
}
