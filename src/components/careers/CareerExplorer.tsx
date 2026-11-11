"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ArrowUpRight, ChevronRight, Search, X } from "lucide-react";
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative flex w-full items-center lg:max-w-[340px]">
          <Search size={17} className="pointer-events-none absolute left-4 text-muted" aria-hidden />
          <span className="sr-only">Search careers</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a role, skill or field"
            className="hb-input rounded-full border-transparent pl-11 pr-10 shadow-xs hover:border-line-strong"
            type="search"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-paper-3 hover:text-ink"
              aria-label="Clear search"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </label>

        <div
          className="hb-scroll-x -mx-[22px] flex items-center gap-2 px-[22px] sm:mx-0 sm:px-0"
          role="group"
          aria-label="Filter by field"
        >
          <FilterChip active={track === "all"} onClick={() => setTrack("all")}>
            All fields
          </FilterChip>
          {tracks.map(([slug, name]) => (
            <FilterChip key={slug} active={track === slug} onClick={() => setTrack(slug)}>
              {name}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-xs text-muted" aria-live="polite">
          {filtered.length} of {careers.length} career path{careers.length === 1 ? "" : "s"}
        </p>
        <p className="hidden text-xs text-muted sm:block">
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
        <ul className="stagger mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {filtered.map((career) => {
            const demand = DEMAND[career.demandLevel ?? "medium"] ?? DEMAND.medium;
            const isTarget = targetCareerId === career.id;
            return (
              <li key={career.id}>
                <Link
                  href={`/careers/${career.slug}`}
                  className="hb-tile hb-tile-white hb-tile-lift group flex h-full flex-col p-7"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="pt-2 text-xs font-medium text-muted">{career.trackName ?? "Career"}</p>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-graphite transition-[background-color,color] duration-500 ease-out-expo group-hover:bg-accent group-hover:text-white">
                      <ArrowUpRight size={16} aria-hidden />
                    </span>
                  </div>
                  <h3 className="display-sm mt-4 text-ink">{career.name}</h3>
                  <p className="mt-2 flex-1 text-md leading-relaxed text-muted">
                    {career.tagline ?? career.description}
                  </p>

                  {isTarget && (
                    <span className="mt-5 inline-flex w-fit items-center rounded-full bg-accent-soft px-2.5 py-1 text-2xs font-medium text-link">
                      Your current goal
                    </span>
                  )}

                  <dl className="mt-6 space-y-2 border-t border-line pt-5 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted">Requirements</dt>
                      <dd className="text-right text-ink">
                        {career.skillCount} skills · {career.essentialCount} essential
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted">Demand signal</dt>
                      <dd className={cn("text-right font-medium", demand.className)}>{demand.label}</dd>
                    </div>
                    {career.salaryMin !== null && career.salaryMax !== null && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted">Indicative range</dt>
                        <dd className="text-right text-ink">
                          {career.salaryMin}–{career.salaryMax} {career.salaryUnit ?? "LPA"}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {signedIn && (
                    <p className="mt-5 inline-flex items-center gap-0.5 text-sm text-link">
                      {isTarget ? "Open your journey" : "See the skills and start a plan"}
                      <ChevronRight
                        size={14}
                        strokeWidth={2.2}
                        className="transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5"
                        aria-hidden
                      />
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
        "h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-200 ease-apple active:scale-[0.97]",
        active ? "bg-ink text-paper" : "bg-paper text-graphite shadow-xs hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
