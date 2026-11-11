import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * Renders inside whichever shell the visitor is in: the public site, or the
 * signed-in workspace when a record such as a job or an assessment is missing.
 * It paints no surface of its own, so it sits on the shell's background, and
 * its main action leads back to that shell's starting point.
 */
export default async function NotFound() {
  // Request-memoised: the root layout has already resolved the session.
  const user = await getCurrentUser();
  const home = !user
    ? { href: "/", label: "Back to home" }
    : { href: user.role === "employer" ? "/employers/dashboard" : "/dashboard", label: "Back to workspace" };

  return (
    <main
      id="main-content"
      className="relative isolate flex min-h-[72dvh] items-center justify-center overflow-clip px-5 py-24"
    >
      <div className="hb-aurora -top-[20%] bottom-[20%] opacity-50" aria-hidden />
      <div className="mx-auto max-w-xl text-center">
        <p className="animate-rise tabular text-sm font-semibold text-muted">404</p>
        <h1 className="display-lg animate-focus-in mt-4 [animation-delay:60ms]">
          This page took a different path.
        </h1>
        <p className="lede animate-rise mx-auto mt-5 max-w-md [animation-delay:160ms]">
          The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back on track.
        </p>
        <div className="animate-rise mt-9 flex flex-col items-center justify-center gap-x-8 gap-y-5 sm:flex-row [animation-delay:240ms]">
          <ButtonLink href={home.href} size="lg">
            {home.label}
          </ButtonLink>
          <Link href="/careers" className="hb-link text-base sm:text-lg">
            Explore careers
            <ChevronRight size={17} strokeWidth={2.2} aria-hidden />
          </Link>
        </div>
      </div>
    </main>
  );
}
