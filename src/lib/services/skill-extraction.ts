import { getDb } from "@/db";
import { skills } from "@/db/schema";

export interface ExtractedSkill {
  slug: string;
  name: string;
  importance: "essential" | "important" | "helpful";
  requiredLevel: "beginner" | "intermediate" | "advanced" | "expert";
  requiredScore: number;
  /** The phrase in the source text that triggered this suggestion. */
  matchedPhrase: string;
  confidence: "low" | "medium" | "high";
}

/** Words that signal a hard requirement vs a nice-to-have. */
const ESSENTIAL_MARKERS = ["must have", "required", "essential", "mandatory", "strong", "expert in", "proficient in"];
const HELPFUL_MARKERS = ["nice to have", "bonus", "plus", "preferred", "familiarity", "exposure", "a plus", "good to have"];

const LEVEL_MARKERS: { level: ExtractedSkill["requiredLevel"]; score: number; terms: string[] }[] = [
  { level: "expert", score: 90, terms: ["expert", "deep expertise", "mastery", "10+ years"] },
  { level: "advanced", score: 78, terms: ["advanced", "strong", "extensive", "senior", "5+ years"] },
  { level: "intermediate", score: 60, terms: ["solid", "proficient", "good working knowledge", "2+ years", "hands-on"] },
  { level: "beginner", score: 35, terms: ["basic", "familiarity", "exposure", "willingness to learn", "entry"] },
];

/** Extra aliases so real job-ad phrasing maps onto our canonical skills. */
const ALIASES: Record<string, string[]> = {
  sql: ["sql", "postgres", "postgresql", "mysql", "queries", "t-sql", "bigquery"],
  excel: ["excel", "spreadsheet", "google sheets", "pivot table", "vlookup"],
  "power-bi": ["power bi", "powerbi", "dax", "power query"],
  tableau: ["tableau"],
  python: ["python", "pandas", "numpy", "jupyter"],
  statistics: ["statistics", "statistical", "hypothesis testing", "a/b test", "ab testing", "regression"],
  "data-analysis": ["data analysis", "data analytics", "analytics", "analysing data", "analyzing data", "eda"],
  communication: ["communication", "stakeholder", "presenting", "storytelling", "written and verbal"],
  "problem-solving": ["problem solving", "problem-solving", "analytical thinking"],
  "critical-thinking": ["critical thinking", "attention to detail", "rigor", "rigour"],
};

/**
 * Deterministic skill extraction from a job description.
 *
 * This is intentionally rule-based and transparent — the employer always sees
 * which phrase produced which requirement, and can edit every field before the
 * job is saved. An AI provider can refine this later, but never silently.
 */
export async function extractSkillsFromDescription(
  description: string,
  title = "",
): Promise<ExtractedSkill[]> {
  const db = await getDb();
  const allSkills = await db.select().from(skills);
  const haystack = `${title}\n${description}`.toLowerCase();

  const found: ExtractedSkill[] = [];

  for (const skill of allSkills) {
    const terms = new Set<string>([
      skill.name.toLowerCase(),
      skill.slug.replace(/-/g, " "),
      ...(ALIASES[skill.slug] ?? []),
    ]);

    let matchedPhrase = "";
    let index = -1;
    for (const term of terms) {
      const at = haystack.indexOf(term);
      if (at !== -1 && (index === -1 || at < index)) {
        index = at;
        matchedPhrase = term;
      }
    }
    if (index === -1) continue;

    // Scope inference to the SENTENCE containing the mention. A wide character
    // window bleeds markers across sentences, so "Python is nice to have" would
    // wrongly downgrade the SQL requirement next to it.
    const context = sentenceAround(haystack, index);

    // Whichever marker sits closest to the skill mention wins, so a sentence
    // containing both "required" and "a plus" resolves by proximity, not order.
    const essentialAt = nearestMarker(context, ESSENTIAL_MARKERS, matchedPhrase);
    const helpfulAt = nearestMarker(context, HELPFUL_MARKERS, matchedPhrase);

    let importance: ExtractedSkill["importance"] = "important";
    if (helpfulAt !== null && (essentialAt === null || helpfulAt < essentialAt)) {
      importance = "helpful";
    } else if (essentialAt !== null) {
      importance = "essential";
    }

    let requiredLevel: ExtractedSkill["requiredLevel"] = "intermediate";
    let requiredScore = 60;
    for (const marker of LEVEL_MARKERS) {
      if (marker.terms.some((t) => context.includes(t))) {
        requiredLevel = marker.level;
        requiredScore = marker.score;
        break;
      }
    }

    // A helpful skill should never carry an advanced/expert bar by default.
    if (importance === "helpful" && requiredScore > 45) {
      requiredLevel = "beginner";
      requiredScore = 35;
    }

    const explicit = essentialAt !== null || helpfulAt !== null;

    found.push({
      slug: skill.slug,
      name: skill.name,
      importance,
      requiredLevel,
      requiredScore,
      matchedPhrase,
      confidence: explicit ? "high" : matchedPhrase.length > 4 ? "medium" : "low",
    });
  }

  const rank = { essential: 0, important: 1, helpful: 2 };
  return found.sort((a, b) => rank[a.importance] - rank[b.importance]);
}

/** The sentence (or bullet line) containing `index`. */
function sentenceAround(text: string, index: number): string {
  const boundary = /[.!?\n;•]/;
  let start = index;
  while (start > 0 && !boundary.test(text[start - 1])) start -= 1;
  let end = index;
  while (end < text.length && !boundary.test(text[end])) end += 1;
  return text.slice(start, end + 1).trim();
}

/**
 * Character distance from the skill mention to the closest of `markers`.
 * Returns null when no marker appears in the context.
 */
function nearestMarker(
  context: string,
  markers: string[],
  matchedPhrase: string,
): number | null {
  const anchor = context.indexOf(matchedPhrase);
  if (anchor === -1) return null;
  let best: number | null = null;
  for (const marker of markers) {
    let from = 0;
    for (;;) {
      const at = context.indexOf(marker, from);
      if (at === -1) break;
      const distance = Math.abs(at - anchor);
      if (best === null || distance < best) best = distance;
      from = at + 1;
    }
  }
  return best;
}

export interface ResumeAnalysis {
  detectedSkills: { slug: string; name: string; matchedPhrase: string }[];
  experienceSignals: string[];
  projectSignals: string[];
  missingEvidence: { slug: string; name: string; reason: string }[];
  targetRoleAlignment: {
    careerSlug: string;
    matched: string[];
    missing: string[];
    note: string;
  } | null;
  disclaimer: string;
}

const RESUME_DISCLAIMER =
  "Everything detected here is SELF-REPORTED. A resume claim is never converted into a verified skill level — take the relevant assessment to turn a claim into evidence.";

/** Deterministic resume analysis. Claims are classified, never verified. */
export async function analyzeResume(
  text: string,
  targetCareerSlug?: string,
): Promise<ResumeAnalysis> {
  const db = await getDb();
  const allSkills = await db.select().from(skills);
  const lower = text.toLowerCase();

  const detected: ResumeAnalysis["detectedSkills"] = [];
  for (const skill of allSkills) {
    const terms = [skill.name.toLowerCase(), skill.slug.replace(/-/g, " "), ...(ALIASES[skill.slug] ?? [])];
    const hit = terms.find((t) => lower.includes(t));
    if (hit) detected.push({ slug: skill.slug, name: skill.name, matchedPhrase: hit });
  }

  const experienceSignals: string[] = [];
  const yearMatches = lower.match(/(\d+)\+?\s*years?/g) ?? [];
  for (const m of yearMatches.slice(0, 5)) experienceSignals.push(`Mentions ${m} of experience`);
  if (/intern(ship)?/.test(lower)) experienceSignals.push("Internship experience mentioned");
  if (/freelanc|contract/.test(lower)) experienceSignals.push("Freelance or contract work mentioned");

  const projectSignals: string[] = [];
  if (/github\.com\/[\w-]+/.test(lower)) projectSignals.push("GitHub profile linked");
  if (/portfolio|personal project|side project/.test(lower)) projectSignals.push("Portfolio or personal projects mentioned");
  if (/dashboard|deployed|published/.test(lower)) projectSignals.push("Shipped or deployed work mentioned");

  const missingEvidence = detected.map((d) => ({
    slug: d.slug,
    name: d.name,
    reason: `Claimed in your resume but not yet backed by assessment or project evidence on Human Bridge.`,
  }));

  let targetRoleAlignment: ResumeAnalysis["targetRoleAlignment"] = null;
  if (targetCareerSlug) {
    const { getCareerBySlug } = await import("./career-service");
    try {
      const { requiredSkills } = await getCareerBySlug(targetCareerSlug);
      const detectedSlugs = new Set(detected.map((d) => d.slug));
      const matched = requiredSkills.filter((r) => detectedSlugs.has(r.slug)).map((r) => r.name);
      const missing = requiredSkills.filter((r) => !detectedSlugs.has(r.slug)).map((r) => r.name);
      targetRoleAlignment = {
        careerSlug: targetCareerSlug,
        matched,
        missing,
        note: `Your resume mentions ${matched.length} of ${requiredSkills.length} skills this role tracks. Mentioning a skill is not the same as proving it.`,
      };
    } catch {
      targetRoleAlignment = null;
    }
  }

  return {
    detectedSkills: detected,
    experienceSignals,
    projectSignals,
    missingEvidence,
    targetRoleAlignment,
    disclaimer: RESUME_DISCLAIMER,
  };
}
