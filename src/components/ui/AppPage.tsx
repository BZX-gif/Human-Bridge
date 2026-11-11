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
    <header
      className={cn(
        "animate-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
        <h1 className="display-md text-ink">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{description}</p>
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
    <div className={cn("flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2 sm:flex-nowrap", className)}>
      <div className="min-w-0">
        <h2 className="text-xl font-semibold leading-snug tracking-[-0.02em] text-ink">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
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
    <div className="hb-card p-5 sm:p-6">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={cn("stat-value mt-2", accentClass)}>{value}</p>
      {hint && <p className="mt-1.5 text-2xs leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

export function Panel({
  children,
  className,
  padded = true,
  id,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={cn("hb-card", padded && "p-5 sm:p-7", className)}>
      {children}
    </section>
  );
}
