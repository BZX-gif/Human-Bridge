import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
      <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800 leading-relaxed">
        <strong>Demo Data:</strong> All careers, jobs, salaries and skill data shown are illustrative only. Real data will be connected via verified APIs and employer submissions before launch.
      </p>
    </div>
  );
}
