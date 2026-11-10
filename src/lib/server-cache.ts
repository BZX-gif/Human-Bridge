import { cache } from "react";

/**
 * Request-scoped memoisation for pure server reads.
 *
 * Next.js renders the layout AND the page (AND generateMetadata) in a single
 * request, and each of them calls the same readers (`getCurrentUser`,
 * `getCareerBySlug`, `getUserSkills`, ...). Without dedupe, one page view
 * issues the same queries 2-4 times — each round-trip multiplied by the
 * database latency. On a hosted Postgres (50-150ms RTT) that is seconds.
 *
 * React's `cache()` collapses identical calls within one request to a single
 * execution. It is only correct for PURE READS: never wrap a function whose
 * result can change within the same request (i.e. never read → write → read
 * the same key). Mutation-adjacent readers keep an uncached `load*` export
 * for post-write refreshes.
 *
 * Under Vitest there is no request boundary (one process, many reads across
 * writes), so dedupe is disabled there and tests exercise the raw logic.
 */
export function requestMemo<T extends (...args: never[]) => unknown>(fn: T): T {
  if (process.env.VITEST) return fn;
  return cache(fn);
}
