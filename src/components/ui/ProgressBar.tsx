"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: "blue" | "green" | "yellow" | "red" | "auto";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

function getAutoColor(value: number): string {
  if (value >= 75) return "green";
  if (value >= 50) return "yellow";
  return "red";
}

const colorClasses: Record<string, string> = {
  blue: "bg-[#1a56ff]",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

const sizeClasses: Record<string, string> = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

export function ProgressBar({
  value,
  max = 100,
  color = "blue",
  size = "md",
  showLabel = false,
  animate = true,
  className,
}: ProgressBarProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : value);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const resolvedColor = color === "auto" ? getAutoColor(percentage) : color;

  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setDisplayed(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage, animate]);

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("w-full bg-slate-100 rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colorClasses[resolvedColor])}
          style={{ width: animate ? `${displayed}%` : `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 mt-1 block text-right">{Math.round(percentage)}%</span>
      )}
    </div>
  );
}
