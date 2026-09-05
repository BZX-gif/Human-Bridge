"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Target } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

/** Set this career as the candidate's target so gaps and matching are scoped to it. */
export function SelectCareerButton({
  careerId,
  careerName,
}: {
  careerId: number;
  careerName: string;
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
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not set your target role.");
      setState("idle");
    }
  };

  return (
    <div>
      <Button variant="secondary" onClick={() => void select()} disabled={state !== "idle"}>
        {state === "done" ? <Check size={15} aria-hidden /> : <Target size={15} aria-hidden />}
        {state === "done"
          ? `${careerName} is your target`
          : state === "saving"
            ? "Saving..."
            : "Set as my target role"}
      </Button>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
