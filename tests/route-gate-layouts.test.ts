import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The route gate in `src/app/layout.tsx` rules a URL missing and the layout of
 * the segment concerned throws the 404 (see `src/lib/auth/route-verdict.ts`).
 * That only yields a real 404 status while two things hold, and neither is
 * visible from the gate itself, so they are pinned here:
 *
 *  1. every segment the gate can rule missing has a layout that answers, and
 *  2. no `loading.tsx` sits above that layout. A Suspense boundary there would
 *     let the response start as 200 before the 404 is thrown. This is why the
 *     list pages keep their `loading.tsx` inside an `(index)` route group.
 */
const APP_DIR = path.resolve(__dirname, "../src/app");

const GATED_SEGMENTS = [
  "jobs/[id]",
  "skills/[...slug]",
  "careers/[slug]",
  "passport/[publicId]",
  "assessments/[slug]",
  "employers/jobs/[id]/candidates",
];

describe("route gate 404s", () => {
  it.each(GATED_SEGMENTS)("%s has a layout that answers the gate", (segment) => {
    const layout = path.join(APP_DIR, segment, "layout.tsx");
    expect(existsSync(layout)).toBe(true);
    expect(readFileSync(layout, "utf8")).toContain("await answerRouteVerdict()");
  });

  it.each(GATED_SEGMENTS)("%s has no loading boundary above its layout", (segment) => {
    const parts = segment.split("/");
    const ancestors = parts.map((_, depth) => path.join(APP_DIR, ...parts.slice(0, depth)));
    for (const dir of ancestors) {
      expect(existsSync(path.join(dir, "loading.tsx")), `${path.relative(APP_DIR, dir) || "app"}/loading.tsx`).toBe(false);
    }
  });

  it("the root layout publishes a verdict instead of calling notFound()", () => {
    const source = readFileSync(path.join(APP_DIR, "layout.tsx"), "utf8");
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(code).toContain("publishRouteVerdict(");
    expect(code).not.toContain("notFound(");
  });
});
