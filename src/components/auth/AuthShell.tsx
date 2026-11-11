import type { ReactNode } from "react";
import { Check } from "lucide-react";

const ASSURANCES = [
  "Roadmaps built from real role requirements",
  "A planner sized to the hours you actually have",
  "Portfolio evidence, with claims and proof kept separate",
];

/**
 * Shared frame for sign-in and sign-up: one centred column, one card.
 * The focus header above it already carries the logo and the way home.
 */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main
      id="main-content"
      className="relative isolate flex min-h-[calc(100dvh-52px)] flex-col items-center justify-center overflow-clip bg-paper px-5 py-12 sm:py-16"
    >
      <div className="hb-aurora -top-[12%] bottom-[38%] opacity-60" aria-hidden />

      <div className="w-full max-w-[440px]">
        <div className="animate-rise text-center">
          <h1 className="display-md">{title}</h1>
          <p className="mx-auto mt-3 max-w-[380px] text-md leading-relaxed text-muted">{description}</p>
        </div>

        <div className="animate-rise mt-8 rounded-2xl bg-paper p-6 shadow-lg ring-1 ring-black/[0.05] [animation-delay:90ms] sm:p-8">
          {children}
        </div>

        <ul className="animate-rise mt-8 space-y-2.5 px-2 [animation-delay:180ms]">
          {ASSURANCES.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm leading-snug text-graphite">
              <Check size={15} strokeWidth={2.4} className="mt-0.5 shrink-0 text-moss" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <p className="animate-fade mt-6 px-2 text-2xs leading-relaxed text-muted [animation-delay:320ms]">
          No guaranteed outcomes. No invented statistics. Your portfolio stays private until you
          choose otherwise.
        </p>
      </div>
    </main>
  );
}
