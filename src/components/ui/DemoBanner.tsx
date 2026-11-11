import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-ochre-soft px-4 py-3.5">
      <Info size={16} className="mt-0.5 shrink-0 text-ochre" aria-hidden />
      <p className="text-xs leading-relaxed text-ochre">
        <strong className="font-semibold">Demo data:</strong> All careers, jobs, salaries and skill
        data shown are illustrative only. Real data will be connected via verified APIs and employer
        submissions before launch.
      </p>
    </div>
  );
}
