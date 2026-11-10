import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Consistent page header for every workspace screen. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-display text-[clamp(2rem,4vw,2.9rem)] leading-[1.02] tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted sm:text-[13.5px]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {description && <p className="mt-1 text-[12.5px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: "default" | "moss" | "ochre" | "rust";
}) {
  const accentClass =
    accent === "moss"
      ? "text-moss"
      : accent === "ochre"
        ? "text-ochre"
        : accent === "rust"
          ? "text-rust"
          : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</p>
      <p className={cn("stat-value mt-2.5", accentClass)}>{value}</p>
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

export function Panel({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-line bg-paper",
        padded && "p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}
