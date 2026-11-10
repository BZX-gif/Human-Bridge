import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldQuestion, BadgeCheck } from "lucide-react";

const VERIFICATION_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof ShieldCheck }
> = {
  self_reported: {
    label: "Self-reported",
    className: "bg-paper-2 text-muted border-line",
    icon: ShieldQuestion,
  },
  assessed: {
    label: "Assessed",
    className: "bg-paper-3 text-graphite border-line",
    icon: ShieldCheck,
  },
  project_verified: {
    label: "Project verified",
    className: "bg-moss-soft text-moss border-moss/20",
    icon: BadgeCheck,
  },
  employer_verified: {
    label: "Employer verified",
    className: "bg-paper-3 text-graphite border-violet-200",
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
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        config.className,
        className,
      )}
    >
      <Icon size={12} aria-hidden />
      {config.label}
    </span>
  );
}

const CONFIDENCE_CONFIG: Record<string, string> = {
  high: "bg-moss-soft text-moss border-moss/20",
  medium: "bg-ochre-soft text-ochre border-ochre/20",
  low: "bg-paper-2 text-muted border-line",
};

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize",
        CONFIDENCE_CONFIG[confidence] ?? CONFIDENCE_CONFIG.low,
      )}
      title="Confidence reflects how much evidence supports this score, not the score itself."
    >
      {confidence} confidence
    </span>
  );
}

const LEVEL_CONFIG: Record<string, string> = {
  Expert: "bg-paper-3 text-graphite border-violet-200",
  Advanced: "bg-paper-3 text-graphite border-line",
  Intermediate: "bg-ochre-soft text-ochre border-ochre/20",
  Beginner: "bg-paper-2 text-muted border-line",
  "Not Evaluated": "bg-paper-2 text-faint border-line",
};

export function LevelBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        LEVEL_CONFIG[level] ?? LEVEL_CONFIG.Beginner,
      )}
    >
      {level}
    </span>
  );
}

export function IntegrityBadge({ status }: { status: string }) {
  if (status === "normal") return null;
  const config =
    status === "flagged"
      ? { label: "Held for integrity review", className: "bg-rust-soft text-rust border-rust/20" }
      : { label: "Flagged for review", className: "bg-ochre-soft text-ochre border-ochre/20" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        config.className,
      )}
    >
      <ShieldAlert size={12} aria-hidden />
      {config.label}
    </span>
  );
}
