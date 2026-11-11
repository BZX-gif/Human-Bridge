import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import "./globals.css";
import { inter, interExt } from "./fonts";
import Navigation from "@/components/layout/Navigation";
import { safeNextPath } from "@/lib/auth/safe-next";
import { publishRouteVerdict, type RouteVerdict } from "@/lib/auth/route-verdict";
import { getCurrentUser } from "@/lib/auth/session";
import { getBlueprint } from "@/lib/services/assessment-service";
import { getCareerBySlug } from "@/lib/services/career-service";
import { assertJobOwnership, getCompanyForUser } from "@/lib/services/employer-service";
import { getJob } from "@/lib/services/job-service";
import { getPublicPassport } from "@/lib/services/passport-service";
import { getPublicPortfolio } from "@/lib/services/portfolio-service";
import { getCareerTrackBySlug, getSkillBySlug } from "@/lib/services/taxonomy-service";

export const metadata: Metadata = {
  title: {
    default: "Human Bridge — Your ambition deserves a direction",
    template: "%s — Human Bridge",
  },
  description:
    "Human Bridge helps you discover career possibilities, understand what they actually require, build a realistic plan, and produce evidence of your work.",
  keywords:
    "career planning, career roadmap, skills, projects, portfolio, skill gap, career development",
  openGraph: {
    title: "Human Bridge — Your ambition deserves a direction",
    description:
      "Discover a career direction, build a roadmap, plan the work and prove what you can do.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

/**
 * Candidate pages that require a signed-in user. Mirrors the page-level
 * `redirect("/login?next=...")` guards — those stay in place as backstops.
 * NOTE: `/passport` is exact-match only; `/passport/[publicId]` is public.
 */
const AUTH_PAGES = new Set([
  "/dashboard",
  "/journey",
  "/planner",
  "/portfolio",
  "/passport",
  "/mentor",
  "/profile",
  "/projects",
  "/ai-copilot",
  "/onboarding",
]);

const CANDIDATES_RE = /^\/employers\/jobs\/([^/]+)\/candidates$/;
const ATTEMPT_RE = /^\/assessments\/attempt\/([^/]+)\/(defense|result)$/;
const JOB_RE = /^\/jobs\/([^/]+)$/;
const CAREER_RE = /^\/careers\/([^/]+)$/;
const PASSPORT_RE = /^\/passport\/([^/]+)$/;
const ASSESSMENT_RE = /^\/assessments\/([^/]+)$/;
const WORKSPACE_RE = /^\/assessments\/([^/]+)\/workspace$/;
const SKILL_RE = /^\/skills\/([^/]+)$/;

function isEmployerOnly(pathname: string): boolean {
  return pathname === "/employers/dashboard" || CANDIDATES_RE.test(pathname);
}

function isAuthRoute(pathname: string): boolean {
  if (AUTH_PAGES.has(pathname) || isEmployerOnly(pathname)) return true;
  if (ATTEMPT_RE.test(pathname)) return true;
  return /^\/assessments\/[^/]+\/workspace$/.test(pathname);
}

/**
 * Same expression the pages use (`Number.isInteger(Number(seg))`), so the
 * gate can never disagree with a page backstop about what is an integer.
 */
function isIntegerSegment(seg: string): boolean {
  return Number.isInteger(Number(seg));
}

/**
 * Central auth/role gate. It MUST live here, not in the pages: a `redirect()`
 * thrown in a page wrapped by `loading.tsx` fires after the shell has already
 * streamed, so the response stays `200` with an empty shell instead of a
 * clean `307`. The root layout runs before anything streams, so redirects
 * thrown here always produce a real redirect status.
 *
 * Reads the path from the `x-pathname` header set by the proxy
 * (`src/proxy.ts`) — server components have no other way to know the current
 * path. All reads are request-deduped with the page below, so the gate adds
 * zero queries.
 *
 * Redirects are thrown here. A missing page is RETURNED as "not-found" and
 * thrown by the `layout.tsx` of the segment concerned (see
 * `lib/auth/route-verdict`): `notFound()` cannot render anything from the root
 * layout, which is above the root not-found boundary. Every rule below that
 * returns "not-found" therefore needs that segment layout; without one the
 * page's own `notFound()` still shows the 404 page, but with a 200 status.
 * `tests/route-gate-layouts.test.ts` pins the list of those layouts.
 */
async function enforceRouteGate(): Promise<RouteVerdict> {
  const raw = (await headers()).get("x-pathname");
  if (!raw) return "ok"; // Proxy didn't run — page-level backstops still apply.
  const [path, search = ""] = raw.split("?");
  const pathname = path.length > 1 ? path.replace(/\/+$/, "") : path;

  if (pathname === "/login" || pathname === "/signup") {
    const user = await getCurrentUser();
    if (user) {
      const fallback = user.role === "employer" ? "/employers/dashboard" : "/dashboard";
      redirect(safeNextPath(new URLSearchParams(search).get("next"), fallback));
    }
    return "ok";
  }

  // The session resolves here (deduped with Navigation below — zero extra
  // cost) because the skills existence check below takes the user id, exactly
  // like the page does.
  const user = await getCurrentUser();

  // URL-pure validity checks for PUBLIC pages: the pages call notFound() for
  // these with no auth precondition, and under loading.tsx that 404 status is
  // swallowed to 200 — so the gate rules on them before anything streams.
  const jobSeg = JOB_RE.exec(pathname)?.[1];
  if (jobSeg !== undefined && !isIntegerSegment(jobSeg)) return "not-found";
  if (pathname.startsWith("/skills/") && pathname.slice("/skills/".length).includes("/")) {
    return "not-found";
  }
  // Existence checks for PUBLIC detail pages. Each mirrors the page's own
  // `notFound()` call exactly (same function, same args, same null/throw
  // semantics), so the gate can never disagree with the page. All readers
  // are request-memoized with the page and its metadata — zero extra queries.
  if (jobSeg !== undefined) {
    const data = await getJob(Number(jobSeg)).catch(() => null);
    if (!data) return "not-found";
  }
  const careerSeg = CAREER_RE.exec(pathname)?.[1];
  if (careerSeg !== undefined) {
    const data = await getCareerBySlug(careerSeg).catch(() => null);
    if (!data) return "not-found";
  }
  const passportSeg = PASSPORT_RE.exec(pathname)?.[1];
  if (passportSeg !== undefined) {
    try {
      await Promise.all([getPublicPassport(passportSeg), getPublicPortfolio(passportSeg)]);
    } catch {
      return "not-found";
    }
  }
  const assessmentSeg = ASSESSMENT_RE.exec(pathname)?.[1];
  if (assessmentSeg !== undefined) {
    const blueprint = await getBlueprint(assessmentSeg).catch(() => null);
    if (!blueprint) return "not-found";
  }
  const skillSeg = SKILL_RE.exec(pathname)?.[1];
  if (skillSeg !== undefined) {
    const [trackData, skillData] = await Promise.all([
      getCareerTrackBySlug(skillSeg, user?.id).catch(() => null),
      getSkillBySlug(skillSeg, user?.id).catch(() => null),
    ]);
    if (!trackData && !skillData) return "not-found";
  }

  if (!isAuthRoute(pathname)) return "ok";

  if (!user) redirect(`/login?next=${pathname}`);

  // Attempt pages redirect non-integer ids to /assessments (after the auth
  // check, for every role) — mirrored here for a clean 307.
  const attemptSeg = ATTEMPT_RE.exec(pathname)?.[1];
  if (attemptSeg !== undefined && !isIntegerSegment(attemptSeg)) redirect("/assessments");

  // Workspace checks the blueprint after auth — same order here.
  const workspaceSeg = WORKSPACE_RE.exec(pathname)?.[1];
  if (workspaceSeg !== undefined) {
    try {
      await getBlueprint(workspaceSeg);
    } catch {
      return "not-found";
    }
  }

  if (isEmployerOnly(pathname)) {
    if (user.role !== "employer") redirect("/dashboard");
    // Page order is role → integer → company → ownership; keep it.
    const candSeg = CANDIDATES_RE.exec(pathname)?.[1];
    if (candSeg !== undefined && !isIntegerSegment(candSeg)) return "not-found";
    const company = await getCompanyForUser(user.id);
    if (!company) redirect("/employers");
    if (candSeg !== undefined) {
      try {
        await assertJobOwnership(Number(candSeg), company.id);
      } catch {
        return "not-found";
      }
    }
    return "ok";
  }

  if (pathname === "/dashboard") {
    if (user.role === "employer") redirect("/employers/dashboard");
    // getCurrentUser inner-joins users, so a missing row already yields null
    // above (→ /login?next=/dashboard, equivalent to the page's /login).
    if (!user.onboardingComplete) redirect("/onboarding");
  }
  return "ok";
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Published before the first await: segment layouts render alongside this
  // one and pick the pending verdict up from the request slot.
  const gate = enforceRouteGate();
  publishRouteVerdict(gate);
  await gate;
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${inter.variable} ${interExt.variable}`} data-scroll-behavior="smooth">
      <body className="bg-paper text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-paper focus:shadow-lg"
        >
          Skip to content
        </a>
        <Navigation user={user}>{children}</Navigation>
      </body>
    </html>
  );
}
