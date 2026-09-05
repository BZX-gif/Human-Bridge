import { cn } from "@/lib/utils";
import type { Importance as SkillImportance } from "@/lib/services/matching-service";

interface SkillBadgeProps {
  name: string;
  importance?: SkillImportance;
  verified?: boolean;
  proficiency?: number;
  className?: string;
}

const importanceStyles: Record<SkillImportance, string> = {
  essential: "bg-blue-50 text-blue-700 border border-blue-100",
  important: "bg-slate-50 text-slate-700 border border-slate-200",
  helpful: "bg-slate-50 text-slate-500 border border-slate-100",
};

export function SkillBadge({ name, importance = "important", verified = false, proficiency, className }: SkillBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg",
      importanceStyles[importance],
      className
    )}>
      {name}
      {verified && (
        <span className="text-green-500" title="Verified">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path fillRule="evenodd" d="M5 10A5 5 0 1 0 5 0a5 5 0 0 0 0 10zm2.28-6.22a.75.75 0 0 0-1.06-1.06L4 4.94 3.28 4.22a.75.75 0 0 0-1.06 1.06l1 1a.75.75 0 0 0 1.06 0l2.5-2.5z" clipRule="evenodd"/>
          </svg>
        </span>
      )}
      {proficiency !== undefined && (
        <span className="text-slate-400">{proficiency}%</span>
      )}
    </span>
  );
}
