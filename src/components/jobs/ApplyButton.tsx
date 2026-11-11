"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

/**
 * Applying always sends the candidate's current evidence. Ineligible candidates
 * may still apply — we surface the gap rather than silently blocking them.
 */
export function ApplyButton({ jobId, eligible }: { jobId: number; eligible: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    setState("sending");
    setError(null);
    try {
      await apiFetch("/api/jobs/apply", { method: "POST", json: { jobId } });
      setState("done");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not submit your application.");
      setState("idle");
    }
  };

  return (
    <div>
      <Button size="lg" onClick={() => void apply()} disabled={state !== "idle"}>
        {state === "done" && <Check size={17} aria-hidden />}
        {state === "sending" && <Loader2 size={17} className="animate-spin" aria-hidden />}
        {state === "done"
          ? "Application sent"
          : state === "sending"
            ? "Sending…"
            : "Apply with my evidence"}
      </Button>
      {!eligible && state === "idle" && (
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ochre">
          You do not currently meet every essential requirement. You can still apply — the employer
          sees your real evidence and the same gaps you do.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-rust">
          {error}
        </p>
      )}
    </div>
  );
}
