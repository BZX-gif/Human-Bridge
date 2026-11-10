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
    <ul className="space-y-2">
      {skills.map((skill) => {
        const expanded = open === skill.slug;
        return (
          <li key={skill.slug} className="overflow-hidden rounded-lg border border-line bg-paper">
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : skill.slug)}
              aria-expanded={expanded}
              className="flex w-full flex-wrap items-center gap-2.5 p-4 text-left transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink"
            >
              <span className="min-w-[120px] flex-1 text-[12.5px] font-medium text-ink">
                {skill.name}
              </span>
              <span className="w-9 text-right text-[15px] font-medium tabular text-ink">
                {skill.score}
              </span>
              <LevelBadge level={skill.level} />
              <ConfidenceBadge confidence={skill.confidence} />
              <VerificationBadge status={skill.verificationStatus} />
              <ChevronDown
                size={16}
                className={cn(
                  "shrink-0 text-faint transition-transform",
                  expanded && "rotate-180",
                )}
                aria-hidden
              />
            </button>

            {expanded && (
              <div className="border-t border-line bg-paper-2 p-4">
                <p className="mb-3 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                  Why Human Bridge believes this ({skill.evidenceCount} pieces of evidence)
                </p>
                {skill.evidence.length === 0 ? (
                  <p className="text-[11px] text-muted">No evidence recorded yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {skill.evidence.map((evidence, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-line bg-paper p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[11.5px] font-medium text-graphite">{evidence.label}</p>
                          {evidence.detail && (
                            <p className="mt-0.5 text-[10.5px] text-muted">{evidence.detail}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {evidence.score !== null && (
                            <span className="text-[11px] font-medium tabular text-graphite">
                              {evidence.score}
                            </span>
                          )}
                          <VerificationBadge
                            status={evidence.source.toLowerCase()}
                            className="text-[10px]"
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {skill.lastVerifiedAt && (
                  <p className="mt-3 text-[10px] text-faint">
                    Last verified {new Date(skill.lastVerifiedAt).toLocaleDateString()}
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
