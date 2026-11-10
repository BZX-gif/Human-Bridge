import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/safe-next";
import { LoginForm } from "@/components/auth/AuthForm";
import { Logo } from "@/components/layout/Logo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) {
    const fallback = user.role === "employer" ? "/employers/dashboard" : "/dashboard";
    redirect(safeNextPath(next, fallback));
  }

  return (
    <main id="main-content" className="min-h-[calc(100vh-64px)] bg-paper-2">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex items-center justify-center px-5 py-12 sm:px-8 lg:justify-start lg:px-14">
          <div className="w-full max-w-[400px]">
            <Logo />
            <h1 className="mt-9 font-display text-[clamp(2rem,4vw,2.7rem)] leading-[1.04] tracking-[-0.02em] text-ink">
              Welcome back.
            </h1>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              Sign in to continue to the plan you were building.
            </p>
            <div className="mt-7">
              <LoginForm nextPath={next} />
            </div>
          </div>
        </div>

        <aside className="hidden bg-ink p-10 text-paper lg:flex lg:flex-col lg:justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-paper/40">
            Career-building operating system
          </p>
          <div>
            <p className="font-display text-[30px] leading-[1.12] tracking-[-0.015em]">
              A direction, a plan, and evidence you can show.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "Roadmaps built from real role requirements",
                "A planner sized to the hours you actually have",
                "Portfolio evidence, with claims and proof kept separate",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[11.5px] leading-relaxed text-paper/65">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-paper/50" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[10px] leading-relaxed text-paper/35">
            No guaranteed outcomes. No invented statistics. Your portfolio stays private until you
            choose otherwise.
          </p>
        </aside>
      </div>
    </main>
  );
}
