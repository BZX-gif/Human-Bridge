import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min: number, max: number, unit: string = "LPA", currency: string = "₹"): string {
  return `${currency}${min}–${max} ${unit}`;
}

export function formatExperience(min: number, max?: number): string {
  if (max === undefined || max === 0) return `${min}+ years`;
  if (min === 0) return `0–${max} years`;
  return `${min}–${max} years`;
}

export function getWorkTypeLabel(workType: string): string {
  const labels: Record<string, string> = {
    remote: "Remote",
    hybrid: "Hybrid",
    onsite: "On-site",
  };
  return labels[workType] || workType;
}

export function getImportanceLabel(importance: string): string {
  const labels: Record<string, string> = {
    essential: "Essential",
    important: "Important",
    helpful: "Helpful",
  };
  return labels[importance] || importance;
}

export function getPostedLabel(daysAgo: number): string {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 14) return "1 week ago";
  return `${Math.floor(daysAgo / 7)} weeks ago`;
}

export function getProficiencyLabel(proficiency: number): string {
  if (proficiency >= 85) return "Expert";
  if (proficiency >= 70) return "Proficient";
  if (proficiency >= 50) return "Intermediate";
  if (proficiency >= 25) return "Beginner";
  return "No Experience";
}
