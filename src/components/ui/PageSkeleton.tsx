/** Shared route-level loading state. Neutral shapes, no layout shift. */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="app-page animate-fade" aria-busy="true" aria-label="Loading">
      <div className="border-b border-line pb-7">
        <div className="skeleton h-2.5 w-20" />
        <div className="skeleton mt-4 h-9 w-[min(420px,80%)]" />
        <div className="skeleton mt-3 h-3 w-[min(560px,92%)]" />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-line bg-paper p-4">
            <div className="skeleton h-2 w-16" />
            <div className="skeleton mt-3 h-6 w-12" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="rounded-lg border border-line bg-paper p-5">
              <div className="skeleton h-3 w-2/5" />
              <div className="skeleton mt-3 h-2.5 w-full" />
              <div className="skeleton mt-2 h-2.5 w-4/5" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-line bg-paper p-5">
            <div className="skeleton h-2.5 w-24" />
            <div className="skeleton mt-4 h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
