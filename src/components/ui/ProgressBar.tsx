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
  label?: string;
}

function getAutoColor(value: number): string {
  if (value >= 75) return "green";
  if (value >= 40) return "yellow";
  return "red";
}

const colorClasses: Record<string, string> = {
  blue: "bg-accent",
  green: "bg-moss",
  yellow: "bg-ochre",
  red: "bg-rust",
};

const sizeClasses: Record<string, string> = {
  sm: "h-1",
  md: "h-1.5",
  lg: "h-2.5",
};

export function ProgressBar({
  value,
  max = 100,
  color = "blue",
  size = "md",
  showLabel = false,
  animate = true,
  className,
  label,
}: ProgressBarProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : value);
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const resolvedColor = color === "auto" ? getAutoColor(percentage) : color;

  useEffect(() => {
    if (!animate) return;
    const timer = setTimeout(() => setDisplayed(percentage), 80);
    return () => clearTimeout(timer);
  }, [percentage, animate]);

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn("w-full overflow-hidden rounded-full bg-paper-3", sizeClasses[size])}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-[1100ms] ease-out-expo",
            colorClasses[resolvedColor],
          )}
          style={{ width: animate ? `${displayed}%` : `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="mt-1.5 block text-right text-2xs tabular-nums text-muted">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}
