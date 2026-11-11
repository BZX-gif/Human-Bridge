import { cn } from "@/lib/utils";

type SkeletonVariant = "workspace" | "detail" | "focus" | "public";

/**
 * Shared route-level loading state.
 *
 * Each variant mirrors the frame of the screens that use it, so content
 * arrives into the same shapes instead of pushing the layout around.
 *
 * A `loading.tsx` also covers every route nested beneath it, and on a direct
 * visit the outermost one is what the browser paints first. Index pages
 * therefore keep theirs inside an `(index)` route group, so a detail page is
 * never introduced by the skeleton of the list above it.
 */
export function PageSkeleton({
  rows = 3,
  variant = "workspace",
  wide = false,
}: {
  rows?: number;
  variant?: SkeletonVariant;
  /** Detail pages that use the full workspace width rather than the reading column. */
  wide?: boolean;
}) {
  if (variant === "focus") {
    return (
      <div
        className="animate-fade flex min-h-[calc(100dvh-52px)] flex-col items-center justify-center px-5 py-12"
        role="status"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="w-full max-w-[440px]">
          <div className="skeleton mx-auto h-9 w-3/5 rounded-md" />
          <div className="skeleton mx-auto mt-4 h-3.5 w-4/5" />
          <div className="mt-8 rounded-2xl bg-paper p-6 shadow-lg ring-1 ring-black/[0.05] sm:p-8">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton mt-2.5 h-11 w-full rounded-md" />
            <div className="skeleton mt-5 h-3 w-24" />
            <div className="skeleton mt-2.5 h-11 w-full rounded-md" />
            <div className="skeleton mt-7 h-12 w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "public") {
    return (
      <div className="hb-container animate-fade py-14 sm:py-20" role="status" aria-busy="true" aria-label="Loading">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton mt-5 h-12 w-[min(560px,86%)] rounded-md" />
        <div className="skeleton mt-5 h-4 w-[min(620px,94%)]" />
        <div className="skeleton mt-2.5 h-4 w-[min(440px,70%)]" />
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} className={index > 2 ? "max-sm:hidden" : undefined} tall />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div
        className={cn("app-page animate-fade", !wide && "app-page-narrow")}
        role="status"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="skeleton h-3 w-28" />
        <div className="hb-tile hb-tile-white mt-4 p-6 sm:p-10">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-4 h-10 w-[min(460px,84%)] rounded-md" />
          <div className="skeleton mt-4 h-3.5 w-[min(520px,92%)]" />
          <div className="skeleton mt-2.5 h-3.5 w-[min(380px,66%)]" />
          <div className="skeleton mt-8 h-12 w-48 rounded-full" />
        </div>
        <div className="mt-4 space-y-4 sm:mt-5 lg:space-y-5">
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-page animate-fade" role="status" aria-busy="true" aria-label="Loading">
      <div>
        <div className="skeleton h-3 w-20" />
        <div className="skeleton mt-4 h-10 w-[min(420px,80%)] rounded-md" />
        <div className="skeleton mt-4 h-3.5 w-[min(560px,92%)]" />
      </div>
      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="hb-card p-5 sm:p-6">
            <div className="skeleton h-2.5 w-16" />
            <div className="skeleton mt-3.5 h-8 w-14 rounded-md" />
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <div className="space-y-4 lg:space-y-5">
          <div className="hb-card p-6">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton mt-4 h-24 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard({ className, tall = false }: { className?: string; tall?: boolean }) {
  return (
    <div className={cn("hb-card p-6 sm:p-7", className)}>
      <div className="skeleton h-4 w-2/5" />
      <div className="skeleton mt-4 h-3 w-full" />
      <div className="skeleton mt-2.5 h-3 w-4/5" />
      {tall && <div className="skeleton mt-6 h-3 w-1/3" />}
    </div>
  );
}
