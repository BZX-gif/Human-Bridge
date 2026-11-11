import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "./Button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade flex flex-col items-center justify-center gap-3 py-24 text-muted"
    >
      <Loader2 size={20} className="animate-spin" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-lg bg-rust-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rust" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-graphite">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="bg-paper hover:bg-paper-2">
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string;
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="hb-empty flex flex-col items-center justify-center gap-5 px-6 py-12 text-center sm:py-14">
      <span className="hb-empty-icon flex h-12 w-12 items-center justify-center rounded-full">
        {icon ?? <Inbox size={20} strokeWidth={1.6} aria-hidden />}
      </span>
      <div>
        <p className="text-xl font-semibold leading-tight tracking-[-0.02em] text-ink">{title}</p>
        <p className="mx-auto mt-2 max-w-sm text-md leading-relaxed text-muted">{message}</p>
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? "h-4 w-full"}`} aria-hidden />;
}

export function SkeletonCard() {
  return (
    <div className="hb-card p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-6 w-2/3" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <Skeleton className="mt-5 h-1.5 w-full" />
    </div>
  );
}
