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
          <li key={skill.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : skill.slug)}
              aria-expanded={expanded}
              className="flex w-full flex-wrap items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a56ff]"
            >
              <span className="min-w-[120px] flex-1 text-sm font-semibold text-slate-900">
                {skill.name}
              </span>
              <span className="w-9 text-right text-lg font-bold tabular-nums text-slate-900">
                {skill.score}
              </span>
              <LevelBadge level={skill.level} />
              <ConfidenceBadge confidence={skill.confidence} />
              <VerificationBadge status={skill.verificationStatus} />
              <ChevronDown
                size={16}
                className={cn(
                  "shrink-0 text-slate-400 transition-transform",
                  expanded && "rotate-180",
                )}
                aria-hidden
              />
            </button>

            {expanded && (
              <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Why Human Bridge believes this ({skill.evidenceCount} pieces of evidence)
                </p>
                {skill.evidence.length === 0 ? (
                  <p className="text-xs text-slate-500">No evidence recorded yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {skill.evidence.map((evidence, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-start justify-between gap-2 rounded-xl bg-white p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-800">{evidence.label}</p>
                          {evidence.detail && (
                            <p className="mt-0.5 text-xs text-slate-500">{evidence.detail}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {evidence.score !== null && (
                            <span className="text-xs font-bold tabular-nums text-slate-700">
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
                  <p className="mt-3 text-[11px] text-slate-400">
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
