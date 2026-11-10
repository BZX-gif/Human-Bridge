"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpRight, Search, SlidersHorizontal, X } from "lucide-react";
import type { CareerSummary } from "@/lib/services/career-service";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";

const DEMAND: Record<string, { label: string; className: string }> = {
  very_high: { label: "Very high demand", className: "text-moss" },
  high: { label: "High demand", className: "text-ink" },
  medium: { label: "Moderate demand", className: "text-ochre" },
  low: { label: "Steady demand", className: "text-muted" },
};

export function CareerExplorer({
  careers,
  signedIn,
  targetCareerId,
}: {
  careers: CareerSummary[];
  signedIn: boolean;
  targetCareerId: number | null;
}) {
  const [query, setQuery] = useState("");
  const [track, setTrack] = useState<string>("all");
  const deferredQuery = useDeferredValue(query);

  const tracks = useMemo(() => {
    const map = new Map<string, string>();
    for (const career of careers) {
      if (career.trackName && career.trackSlug) map.set(career.trackSlug, career.trackName);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [careers]);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return careers.filter((career) => {
      if (track !== "all" && career.trackSlug !== track) return false;
      if (!needle) return true;
      return (
        career.name.toLowerCase().includes(needle) ||
        (career.tagline ?? "").toLowerCase().includes(needle) ||
        (career.description ?? "").toLowerCase().includes(needle) ||
        (career.trackName ?? "").toLowerCase().includes(needle)
      );
    });
  }, [careers, deferredQuery, track]);

  return (
    <div>
      <div className="flex flex-col gap-4 border-y border-line py-5 md:flex-row md:items-center md:justify-between">
        <label className="relative flex w-full items-center md:max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 text-faint" aria-hidden />
          <span className="sr-only">Search careers</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a role, skill or field"
            className="hb-input pl-9 pr-9"
            type="search"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-paper-3 hover:text-ink"
              aria-label="Clear search"
            >
              <X size={13} aria-hidden />
            </button>
          )}
        </label>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="hidden shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint sm:flex">
            <SlidersHorizontal size={12} aria-hidden />
            Field
          </span>
          <FilterChip active={track === "all"} onClick={() => setTrack("all")}>
            All
          </FilterChip>
          {tracks.map(([slug, name]) => (
            <FilterChip key={slug} active={track === slug} onClick={() => setTrack(slug)}>
              {name}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-[11.5px] text-muted">
          {filtered.length} of {careers.length} career path{careers.length === 1 ? "" : "s"}
        </p>
        <p className="hidden text-[11px] text-faint sm:block">
          Demand and salary are indicative context, not predictions.
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No careers match that search"
            message="Try a broader term, or clear the filters to see every path."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setTrack("all");
                }}
              >
                Reset filters
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="stagger mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((career) => {
            const demand = DEMAND[career.demandLevel ?? "medium"] ?? DEMAND.medium;
            const isTarget = targetCareerId === career.id;
            return (
              <li key={career.id} className="bg-paper">
                <Link
                  href={`/careers/${career.slug}`}
                  className="group flex h-full flex-col p-5 transition-colors hover:bg-paper-2 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                      {career.trackName ?? "Career"}
                    </p>
                    <ArrowUpRight
                      size={15}
                      className="text-faint transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-3 font-display text-[25px] leading-[1.08] text-ink">
                    {career.name}
                  </h3>
                  <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-muted">
                    {career.tagline ?? career.description}
                  </p>

                  {isTarget && (
                    <span className="mt-4 inline-flex w-fit items-center rounded-[3px] bg-ink px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-paper">
                      Your current goal
                    </span>
                  )}

                  <dl className="mt-5 space-y-1.5 border-t border-line pt-4 text-[11.5px]">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-faint">Requirements</dt>
                      <dd className="text-graphite">
                        {career.skillCount} skills · {career.essentialCount} essential
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-faint">Demand signal</dt>
                      <dd className={demand.className}>{demand.label}</dd>
                    </div>
                    {career.salaryMin !== null && career.salaryMax !== null && (
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-faint">Indicative range</dt>
                        <dd className="text-graphite">
                          {career.salaryMin}–{career.salaryMax} {career.salaryUnit ?? "LPA"}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {signedIn && (
                    <p className="mt-4 text-[11px] font-medium text-ink">
                      {isTarget ? "Open your journey" : "See the skills and start a plan"} →
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-[4px] border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line bg-paper text-graphite hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
