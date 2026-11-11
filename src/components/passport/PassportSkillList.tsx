"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ConfidenceBadge,
  LevelBadge,
  VerificationBadge,
} from "@/components/assessment/EvidenceBadges";
import type { PassportSkillView } from "@/lib/services/passport-service";

/** Expandable skill rows. Every score can be traced to its evidence. */
export function PassportSkillList({ skills }: { skills: PassportSkillView[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ul className="@container space-y-2.5">
      {skills.map((skill) => {
        const expanded = open === skill.slug;
        return (
          <li key={skill.slug} className="overflow-clip rounded-md bg-paper-2">
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : skill.slug)}
              aria-expanded={expanded}
              className="flex w-full flex-wrap items-center gap-2.5 p-4 text-left transition-colors duration-200 hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent @[620px]:grid @[620px]:grid-cols-[minmax(0,1fr)_2.5rem_6.25rem_8.75rem_8.5rem_auto] @[620px]:gap-x-3"
            >
              <span className="min-w-[120px] flex-1 text-md font-medium text-ink @[620px]:min-w-0">{skill.name}</span>
              <span className="tabular w-9 text-right text-base font-semibold text-ink @[620px]:w-auto">{skill.score}</span>
              <span className="flex">
                <LevelBadge level={skill.level} />
              </span>
              <span className="flex">
                <ConfidenceBadge confidence={skill.confidence} />
              </span>
              <span className="flex">
                <VerificationBadge status={skill.verificationStatus} />
              </span>
              <ChevronDown
                size={17}
                className={cn(
                  "shrink-0 text-muted transition-transform duration-500 ease-out-expo",
                  expanded && "rotate-180",
                )}
                aria-hidden
              />
            </button>

            {expanded && (
              <div className="hb-swap-in border-t border-line-strong/60 p-4">
                <p className="mb-3 text-sm font-medium text-ink">
                  Why Human Bridge believes this ({skill.evidenceCount} pieces of evidence)
                </p>
                {skill.evidence.length === 0 ? (
                  <p className="text-sm text-muted">No evidence recorded yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {skill.evidence.map((evidence, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-start justify-between gap-2 rounded-sm bg-paper p-3.5 shadow-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink">{evidence.label}</p>
                          {evidence.detail && <p className="mt-0.5 text-xs text-muted">{evidence.detail}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-2.5">
                          {evidence.score !== null && (
                            <span className="tabular text-sm font-semibold text-ink">{evidence.score}</span>
                          )}
                          <VerificationBadge status={evidence.source.toLowerCase()} className="text-2xs" />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {skill.lastVerifiedAt && (
                  <p className="mt-3 text-xs text-muted">
                    Last verified{" "}
                    {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
                      new Date(skill.lastVerifiedAt),
                    )}
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
