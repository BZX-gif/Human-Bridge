"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Scale, ShieldCheck } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { ConfidenceBadge, VerificationBadge } from "@/components/assessment/EvidenceBadges";
import type { CandidateCard } from "@/lib/services/employer-service";

interface Props {
  jobTitle: string;
  candidates: CandidateCard[];
}

const STATUSES = ["reviewing", "shortlisted", "interviewing", "offered", "hired", "rejected"] as const;

export function CandidateReview({ jobTitle, candidates }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setStatus = async (applicationId: number, status: string) => {
    setBusy(applicationId);
    setError(null);
    try {
      await apiFetch("/api/employer/applications", {
        method: "PATCH",
        json: { applicationId, status },
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not update the application.");
    } finally {
      setBusy(null);
    }
  };

  const comparing = candidates.filter((c) => selected.includes(c.userId));

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="text-sm text-slate-500">Candidates for</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{jobTitle}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ranked by verified evidence against your requirements. Candidates who have hidden their
            passport from employers are not shown.
          </p>
        </header>

        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {candidates.length === 0 ? (
          <EmptyState
            title="No applications yet"
            message="Candidates appear here once they apply and their evidence is matched against your requirements."
          />
        ) : (
          <>
            {comparing.length >= 2 && (
              <section className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
                  <Scale size={15} className="text-[#1a56ff]" aria-hidden />
                  Side-by-side comparison
                </h2>
                <table className="w-full min-w-[520px] text-sm">
                  <caption className="sr-only">Candidate comparison on required skills</caption>
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="pb-2 pr-4 font-medium">Skill</th>
                      {comparing.map((c) => (
                        <th key={c.userId} scope="col" className="pb-2 pr-4 font-medium">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50">
                      <th scope="row" className="py-2.5 pr-4 text-left font-semibold text-slate-700">
                        Match
                      </th>
                      {comparing.map((c) => (
                        <td key={c.userId} className="py-2.5 pr-4 font-bold tabular-nums">
                          {c.match.score}%
                        </td>
                      ))}
                    </tr>
                    {Array.from(
                      new Set(comparing.flatMap((c) => c.skills.map((s) => s.slug))),
                    ).map((slug) => (
                      <tr key={slug} className="border-b border-slate-50">
                        <th
                          scope="row"
                          className="py-2.5 pr-4 text-left font-normal capitalize text-slate-600"
                        >
                          {slug.replace(/-/g, " ")}
                        </th>
                        {comparing.map((c) => {
                          const s = c.skills.find((x) => x.slug === slug);
                          return (
                            <td key={c.userId} className="py-2.5 pr-4 tabular-nums text-slate-800">
                              {s ? `${s.score} · ${s.level}` : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            <ul className="space-y-4">
              {candidates.map((candidate) => (
                <li
                  key={candidate.applicationId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <input
                        type="checkbox"
                        aria-label={`Compare ${candidate.name}`}
                        className="mt-1.5 h-4 w-4 accent-[#1a56ff]"
                        checked={selected.includes(candidate.userId)}
                        onChange={(e) =>
                          setSelected((prev) =>
                            e.target.checked
                              ? [...prev, candidate.userId]
                              : prev.filter((id) => id !== candidate.userId),
                          )
                        }
                      />
                      <div>
                        <h2 className="font-bold text-slate-900">{candidate.name}</h2>
                        <p className="text-xs text-slate-500">
                          Applied {new Date(candidate.appliedAt).toLocaleDateString()} · readiness{" "}
                          {candidate.readiness}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-2xl font-black tabular-nums ${
                          candidate.match.eligible ? "text-green-600" : "text-amber-600"
                        }`}
                      >
                        {candidate.match.score}%
                      </p>
                      <p className="text-[10px] font-medium text-slate-400">MATCH</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">{candidate.match.summary}</p>

                  {candidate.match.blockingReasons.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {candidate.match.blockingReasons.map((reason) => (
                        <li key={reason} className="flex gap-2 text-xs text-amber-700">
                          <AlertTriangle size={12} className="mt-0.5 shrink-0" aria-hidden />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Evidence */}
                  <div className="mt-4 space-y-2">
                    {candidate.skills.map((skill) => (
                      <div
                        key={skill.slug}
                        className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
                      >
                        <span className="min-w-[110px] flex-1 text-sm text-slate-800">
                          {skill.name}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-slate-900">
                          {skill.score}
                        </span>
                        <span className="text-xs text-slate-500">{skill.level}</span>
                        <ConfidenceBadge confidence={skill.confidence} />
                        <VerificationBadge status={skill.verificationStatus} />
                        <span className="text-[11px] text-slate-400">
                          {skill.evidenceCount} evidence
                        </span>
                      </div>
                    ))}
                  </div>

                  {candidate.evidenceSummary.length > 0 && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                      <ShieldCheck size={12} className="text-green-600" aria-hidden />
                      {candidate.evidenceSummary.join(" · ")}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <span className="mr-1 text-xs text-slate-500">Status:</span>
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={busy === candidate.applicationId}
                        onClick={() => void setStatus(candidate.applicationId, status)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize transition-colors disabled:opacity-50 ${
                          candidate.status === status
                            ? "bg-[#1a56ff] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {candidate.status === status && <Check size={11} aria-hidden />}
                        {status}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            {selected.length === 1 && (
              <p className="mt-4 text-center text-xs text-slate-500">
                Select one more candidate to compare side by side.
              </p>
            )}
            {selected.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                  Clear comparison
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
