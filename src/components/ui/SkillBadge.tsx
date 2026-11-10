import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { Importance as SkillImportance } from "@/lib/services/matching-service";

interface SkillBadgeProps {
  name: string;
  importance?: SkillImportance;
  verified?: boolean;
  proficiency?: number;
  className?: string;
}

const importanceStyles: Record<SkillImportance, string> = {
  essential: "bg-ink text-paper border-ink",
  important: "bg-paper-2 text-graphite border-line",
  helpful: "bg-paper text-muted border-line",
};

export function SkillBadge({
  name,
  importance = "important",
  verified = false,
  proficiency,
  className,
}: SkillBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-[11.5px] font-medium",
        importanceStyles[importance],
        className,
      )}
    >
      {name}
      {verified && (
        <Check
          size={11}
          strokeWidth={2.4}
          className={importance === "essential" ? "text-paper" : "text-moss"}
          aria-label="Verified"
        />
      )}
      {proficiency !== undefined && (
        <span className={importance === "essential" ? "text-paper/60" : "text-faint"}>
          {proficiency}%
        </span>
      )}
    </span>
  );
}
