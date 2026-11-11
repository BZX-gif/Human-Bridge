import { cache } from "react";
import { notFound } from "next/navigation";

/**
 * Hand-off between the route gate in the root layout and the segment layouts
 * that answer a 404 on its behalf.
 *
 * The gate decides in the root layout because that is the one place that runs
 * before anything streams, so its status codes are real. It cannot call
 * `notFound()` there itself, though: the root layout sits above the root
 * `not-found.tsx` boundary, so a 404 thrown from it has nothing to render
 * into. Production serves a blank document and development reports
 * "notFound() is not allowed to use in root layout".
 *
 * Thrown one level down, from the layout of the segment that is missing, the
 * same 404 is still ahead of every `loading.tsx` boundary (the status stays
 * 404) and it is inside the root boundary (the 404 page renders in the normal
 * shell). So the gate returns a verdict, the root layout publishes it, and the
 * segment layout throws.
 *
 * The verdict is held per request by React's `cache`. Segment layouts start
 * rendering alongside the root layout rather than after it, which is why the
 * pending promise is shared and not a settled value.
 */
export type RouteVerdict = "ok" | "not-found";

const requestSlot = cache((): { verdict: Promise<RouteVerdict> | null } => ({ verdict: null }));

/**
 * Root layout only. Call it before the first `await`, so the promise is in
 * place by the time a segment layout looks for it.
 */
export function publishRouteVerdict(verdict: Promise<RouteVerdict>): void {
  requestSlot().verdict = verdict;
}

/**
 * Segment layouts call this once. It throws `notFound()` when the gate ruled
 * the URL missing.
 *
 * It never runs the gate. On a client-side navigation or a prefetch the root
 * layout is not part of the render, nothing has been published, and this
 * returns at once without a query; the page's own `notFound()` covers those.
 */
export async function answerRouteVerdict(): Promise<void> {
  const pending = requestSlot().verdict;
  if (pending && (await pending) === "not-found") notFound();
}
