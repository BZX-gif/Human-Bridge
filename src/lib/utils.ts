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

const SLUG_ACRONYMS = new Set([
  "ai", "api", "aws", "bi", "cd", "ci", "crm", "css", "etl", "gcp", "hr", "html", "kpi", "llm", "ml",
  "nlp", "owasp", "qa", "rag", "rest", "sem", "seo", "sql", "ui", "ux",
]);

const SLUG_WORDS: Record<string, string> = {
  apis: "APIs",
  devops: "DevOps",
  github: "GitHub",
  javascript: "JavaScript",
  nodejs: "Node.js",
  prds: "PRDs",
  typescript: "TypeScript",
};

const SLUG_MINOR_WORDS = new Set(["a", "and", "as", "for", "in", "of", "or", "the", "to", "with"]);

/**
 * Turn a taxonomy slug into a readable label: "power-bi" becomes "Power BI",
 * "statistics-for-ml" becomes "Statistics for ML".
 *
 * For screens that hold a slug but not the stored name. Where the name is
 * available, show the name: a slug cannot recover punctuation ("CI/CD").
 */
export function formatSlug(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (SLUG_ACRONYMS.has(lower)) return lower.toUpperCase();
      if (SLUG_WORDS[lower]) return SLUG_WORDS[lower];
      if (index > 0 && SLUG_MINOR_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Split content text on its one piece of markup: backtick-quoted `code` spans
 * for table, column and file names. Returns the runs in order.
 *
 * A backtick with no partner is not markup; it stays in the text as written.
 */
export function splitInlineCode(text: string): Array<{ text: string; code: boolean }> {
  const parts = text.split("`");
  const runs: Array<{ text: string; code: boolean }> = [];
  const push = (value: string, code: boolean) => {
    if (value === "") return;
    const last = runs[runs.length - 1];
    if (last && !code && !last.code) last.text += value;
    else runs.push({ text: value, code });
  };

  parts.forEach((part, index) => {
    const insideBackticks = index % 2 === 1;
    const closed = index < parts.length - 1;
    if (insideBackticks && closed) push(part, true);
    else push(insideBackticks ? "`" + part : part, false);
  });
  return runs;
}
