import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { Button } from "./Button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-20 text-muted"
    >
      <Loader2 size={19} className="animate-spin" aria-hidden />
      <p className="text-[12.5px]">{label}</p>
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
      className="flex flex-col items-start gap-3 rounded-lg border border-rust/20 bg-rust-soft/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-rust" aria-hidden />
        <div>
          <p className="text-[13px] font-medium text-ink">{title}</p>
          <p className="mt-1 max-w-lg text-[12.5px] leading-relaxed text-graphite">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
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
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-line-strong bg-paper px-6 py-16 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-paper-2 text-faint">
        {icon ?? <Inbox size={18} aria-hidden />}
      </span>
      <div>
        <p className="font-display text-[22px] leading-tight text-ink">{title}</p>
        <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted">{message}</p>
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
    <div className="rounded-lg border border-line bg-paper p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-6 w-2/3" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <Skeleton className="mt-5 h-1.5 w-full" />
    </div>
  );
}
