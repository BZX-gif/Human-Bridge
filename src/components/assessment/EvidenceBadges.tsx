import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldQuestion, BadgeCheck } from "lucide-react";

const VERIFICATION_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof ShieldCheck }
> = {
  self_reported: {
    label: "Self-reported",
    className: "bg-slate-50 text-slate-600 border-slate-200",
    icon: ShieldQuestion,
  },
  assessed: {
    label: "Assessed",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: ShieldCheck,
  },
  project_verified: {
    label: "Project verified",
    className: "bg-green-50 text-green-700 border-green-200",
    icon: BadgeCheck,
  },
  employer_verified: {
    label: "Employer verified",
    className: "bg-violet-50 text-violet-700 border-violet-200",
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
  high: "bg-green-50 text-green-700 border-green-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-500 border-slate-200",
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
  Expert: "bg-violet-50 text-violet-700 border-violet-200",
  Advanced: "bg-blue-50 text-blue-700 border-blue-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Beginner: "bg-slate-50 text-slate-600 border-slate-200",
  "Not Evaluated": "bg-slate-50 text-slate-400 border-slate-200",
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
      ? { label: "Held for integrity review", className: "bg-red-50 text-red-700 border-red-200" }
      : { label: "Flagged for review", className: "bg-amber-50 text-amber-700 border-amber-200" };
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
