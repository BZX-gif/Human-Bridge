import type { ReactNode } from "react";
import { answerRouteVerdict } from "@/lib/auth/route-verdict";

/**
 * Throws the route gate's 404 for an unknown skill or track.
 *
 * It has to come from this layout: ahead of `loading.tsx`, so the status is a
 * real 404, and below the root layout, so the 404 page has a boundary to
 * render in. See `lib/auth/route-verdict`.
 */
export default async function Layout({ children }: { children: ReactNode }) {
  await answerRouteVerdict();
  return children;
}
