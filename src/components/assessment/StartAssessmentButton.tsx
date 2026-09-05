"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

export function StartAssessmentButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch<{ attemptId: number }>("/api/assessments/start", {
        method: "POST",
        json: { blueprint: slug },
      });
      router.push(`/assessments/${slug}/workspace`);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not start the assessment.");
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={() => void start()} disabled={loading}>
        {loading ? "Preparing your workspace..." : "Start work simulation"}
        {!loading && <ArrowRight size={15} aria-hidden />}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
