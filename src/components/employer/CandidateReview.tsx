"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronLeft, Scale, ShieldCheck, Users } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Panel, SectionHeader } from "@/components/ui/AppPage";
import { EmptyState } from "@/components/ui/States";
import { cn, formatSlug } from "@/lib/utils";
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
    <main id="main-content" className="app-page">
      <Link href="/employers/dashboard" className="hb-link animate-rise text-sm">
        <ChevronLeft size={15} strokeWidth={2.2} aria-hidden />
        Hiring dashboard
      </Link>

      <header className="animate-rise mt-4">
        <p className="eyebrow">Candidates for</p>
        <h1 className="display-md mt-2.5 text-ink">{jobTitle}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          Ranked by verified evidence against your requirements. Candidates who have hidden their
          passport from employers are not shown.
        </p>
      </header>

      {error && (
        <p role="alert" className="mt-5 rounded-md bg-rust-soft px-4 py-3 text-sm text-rust">
          {error}
        </p>
      )}

      {candidates.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            title="No applications yet"
            message="Candidates appear here once they apply and their evidence is matched against your requirements."
            icon={<Users size={20} aria-hidden />}
          />
        </div>
      ) : (
        <div className="mt-7">
          {comparing.length >= 2 && (
            <Panel className="hb-swap-in mb-4 lg:mb-5">
              <SectionHeader
                title={
                  <span className="flex items-center gap-2.5">
                    <Scale size={20} className="text-link" aria-hidden />
                    Side-by-side comparison
                  </span>
                }
                action={
                  <button type="button" onClick={() => setSelected([])} className="hb-link text-sm">
                    Clear
                  </button>
                }
              />
              <div className="hb-scroll-x mt-4">
                <table className="w-full min-w-[520px] text-md">
                  <caption className="sr-only">Candidate comparison on required skills</caption>
                  <thead>
                    <tr className="border-b border-line-strong text-left text-sm text-muted">
                      <th scope="col" className="pb-2.5 pr-4 font-medium">
                        Skill
                      </th>
                      {comparing.map((c) => (
                        <th key={c.userId} scope="col" className="pb-2.5 pr-4 font-semibold text-ink">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    <tr>
                      <th scope="row" className="py-3 pr-4 text-left font-semibold text-ink">
                        Match
                      </th>
                      {comparing.map((c) => (
                        <td
                          key={c.userId}
                          className={cn(
                            "tabular py-3 pr-4 text-lg font-semibold",
                            c.match.eligible ? "text-moss" : "text-ochre",
                          )}
                        >
                          {c.match.score}%
                        </td>
                      ))}
                    </tr>
                    {Array.from(new Set(comparing.flatMap((c) => c.skills.map((s) => s.slug)))).map((slug) => (
                      <tr key={slug}>
                        <th scope="row" className="py-3 pr-4 text-left font-normal text-graphite">
                          {comparing.flatMap((c) => c.skills).find((x) => x.slug === slug)?.name ?? formatSlug(slug)}
                        </th>
                        {comparing.map((c) => {
                          const s = c.skills.find((x) => x.slug === slug);
                          return (
                            <td key={c.userId} className="tabular py-3 pr-4 text-ink">
                              {s ? `${s.score} · ${s.level}` : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          <ul className="space-y-4 lg:space-y-5">
            {candidates.map((candidate) => {
              const checked = selected.includes(candidate.userId);
              return (
                <li
                  key={candidate.applicationId}
                  className={cn(
                    "hb-card p-5 transition-shadow duration-300 ease-apple sm:p-7",
                    checked && "ring-2 ring-accent",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className="hb-avatar h-11 w-11 shrink-0 text-base sm:h-12 sm:w-12" aria-hidden>
                        {initials(candidate.name)}
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-xl font-semibold leading-snug tracking-[-0.02em] text-ink">
                          {candidate.name}
                        </h2>
                        <p className="tabular mt-0.5 text-sm text-muted">
                          Applied {formatDate(candidate.appliedAt)} · readiness{" "}
                          {candidate.readiness}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "tabular text-4xl font-semibold leading-none tracking-[-0.035em] sm:text-5xl",
                          candidate.match.eligible ? "text-moss" : "text-ochre",
                        )}
                      >
                        {candidate.match.score}%
                      </p>
                      <p className="mt-1.5 text-xs font-medium text-muted">Match</p>
                    </div>
                  </div>

                  <p className="mt-5 text-base leading-relaxed text-graphite">{candidate.match.summary}</p>

                  {candidate.match.blockingReasons.length > 0 && (
                    <ul className="mt-4 space-y-2 rounded-md bg-ochre-soft p-4">
                      {candidate.match.blockingReasons.map((reason) => (
                        <li key={reason} className="flex gap-2.5 text-sm leading-relaxed text-ochre">
                          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Evidence */}
                  {candidate.skills.length > 0 && (
                    <div className="@container mt-4 space-y-2">
                      {candidate.skills.map((skill) => (
                        <div
                          key={skill.slug}
                          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md bg-paper-2 px-4 py-3 @[760px]:grid @[760px]:grid-cols-[minmax(0,1fr)_2.5rem_6.5rem_8.75rem_8.75rem_5.5rem]"
                        >
                          <span className="min-w-[110px] flex-1 text-md font-medium text-ink @[760px]:min-w-0">
                            {skill.name}
                          </span>
                          <span className="tabular text-right text-base font-semibold text-ink">{skill.score}</span>
                          <span className="text-sm capitalize text-graphite">{skill.level}</span>
                          <span className="flex">
                            <ConfidenceBadge confidence={skill.confidence} />
                          </span>
                          <span className="flex">
                            <VerificationBadge status={skill.verificationStatus} />
                          </span>
                          <span className="tabular text-xs text-muted @[760px]:text-right">
                            {skill.evidenceCount} evidence
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {candidate.evidenceSummary.length > 0 && (
                    <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted">
                      <ShieldCheck size={16} className="mt-0.5 shrink-0 text-moss" aria-hidden />
                      {candidate.evidenceSummary.join(" · ")}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line pt-5">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="mr-1 text-sm font-medium text-muted">Status</span>
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={busy === candidate.applicationId}
                          aria-pressed={candidate.status === status}
                          onClick={() => void setStatus(candidate.applicationId, status)}
                          className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium capitalize transition-[background-color,color,transform] duration-200 ease-apple active:scale-[0.97] disabled:opacity-50",
                            candidate.status === status
                              ? status === "rejected"
                                ? "bg-rust text-white"
                                : "bg-accent text-white"
                              : "bg-paper-3 text-graphite hover:bg-paper-4 hover:text-ink",
                          )}
                        >
                          {candidate.status === status && <Check size={14} strokeWidth={2.6} aria-hidden />}
                          {status}
                        </button>
                      ))}
                    </div>
                    <label className="flex shrink-0 cursor-pointer items-center gap-2.5 text-sm font-medium text-graphite">
                      <input
                        type="checkbox"
                        aria-label={`Compare ${candidate.name}`}
                        checked={checked}
                        onChange={(e) =>
                          setSelected((prev) =>
                            e.target.checked
                              ? [...prev, candidate.userId]
                              : prev.filter((id) => id !== candidate.userId),
                          )
                        }
                      />
                      Compare
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>

          {selected.length === 1 && (
            <p className="mt-5 text-center text-sm text-muted">
              Select one more candidate to compare side by side.
            </p>
          )}
          {selected.length > 0 && (
            <div className="mt-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
                Clear comparison
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

/**
 * Fixed locale and time zone: the server render and the browser must produce
 * the same text, whatever the viewer's own locale is.
 */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(iso: string | Date): string {
  return DATE_FORMAT.format(new Date(iso));
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
