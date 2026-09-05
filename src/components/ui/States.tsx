import type { ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { Button } from "./Button";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500"
    >
      <Loader2 size={22} className="animate-spin" aria-hidden />
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
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 py-12 px-6 text-center"
    >
      <AlertCircle size={22} className="text-red-500" aria-hidden />
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-1 max-w-md text-sm text-slate-600">{message}</p>
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
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 py-14 px-6 text-center">
      <Inbox size={22} className="text-slate-400" aria-hidden />
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
      </div>
      {action}
    </div>
  );
}
