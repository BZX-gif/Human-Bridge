import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Human Bridge wordmark. The mark is two points connected by a bridge — simple
 * enough to read at 20px, and not dependent on an image asset.
 */
export function Logo({
  href = "/",
  inverted = false,
  compact = false,
  className,
}: {
  href?: string;
  inverted?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Human Bridge — home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[6px] border transition-colors",
          inverted
            ? "border-white/20 bg-white text-ink"
            : "border-ink bg-ink text-paper",
        )}
        aria-hidden
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 15.5C3 15.5 3 11.5 6.6 10.4C10.2 9.3 13.6 10.2 16.5 4.5"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          <circle cx="3" cy="15.5" r="1.45" fill="currentColor" />
          <circle cx="16.5" cy="4.5" r="1.45" fill="currentColor" />
        </svg>
      </span>
      {!compact && (
        <span
          className={cn(
            "text-[13px] font-semibold uppercase tracking-[0.16em]",
            inverted ? "text-paper" : "text-ink",
          )}
        >
          Human Bridge
        </span>
      )}
    </Link>
  );
}

export function WordmarkLarge({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-3xl leading-none", className)}>
      Human Bridge
    </span>
  );
}
