import { cn, formatSlug } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldQuestion, BadgeCheck } from "lucide-react";

const VERIFICATION_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof ShieldCheck }
> = {
  self_reported: {
    label: "Self-reported",
    className: "bg-paper-3 text-graphite",
    icon: ShieldQuestion,
  },
  assessed: {
    label: "Assessed",
    className: "bg-accent-soft text-link",
    icon: ShieldCheck,
  },
  project_verified: {
    label: "Project verified",
    className: "bg-moss-soft text-moss",
    icon: BadgeCheck,
  },
  employer_verified: {
    label: "Employer verified",
    className: "bg-ink text-paper",
    icon: BadgeCheck,
  },
};

export function VerificationBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = VERIFICATION_CONFIG[status] ?? VERIFICATION_CONFIG.self_reported;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-2xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon size={13} aria-hidden />
      {config.label}
    </span>
  );
}

const CONFIDENCE_CONFIG: Record<string, string> = {
  high: "bg-moss-soft text-moss",
  medium: "bg-ochre-soft text-ochre",
  low: "bg-paper-3 text-graphite",
};

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-2xs font-medium capitalize",
        CONFIDENCE_CONFIG[confidence] ?? CONFIDENCE_CONFIG.low,
      )}
      title="Confidence reflects how much evidence supports this score, not the score itself."
    >
      {confidence} confidence
    </span>
  );
}

const LEVEL_CONFIG: Record<string, string> = {
  Expert: "bg-ink text-paper",
  Advanced: "bg-accent-soft text-link",
  Intermediate: "bg-paper-3 text-ink",
  Beginner: "bg-paper-3 text-graphite",
  "Not Evaluated": "bg-paper-3 text-muted",
};

/** Accepts a stored level ("not_evaluated") or its label ("Not Evaluated"). */
export function LevelBadge({ level }: { level: string }) {
  const label = formatSlug(level);
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-2xs font-semibold",
        LEVEL_CONFIG[label] ?? LEVEL_CONFIG.Beginner,
      )}
    >
      {label}
    </span>
  );
}

export function IntegrityBadge({ status }: { status: string }) {
  if (status === "normal") return null;
  const config =
    status === "flagged"
      ? { label: "Held for integrity review", className: "bg-rust-soft text-rust" }
      : { label: "Flagged for review", className: "bg-ochre-soft text-ochre" };
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-medium",
        config.className,
      )}
    >
      <ShieldAlert size={15} aria-hidden />
      {config.label}
    </span>
  );
}
