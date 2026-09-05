/**
 * Skill extraction is deterministic and runs against the seeded skill
 * catalogue, so these tests use the embedded PGlite database.
 */
import { beforeAll, describe, expect, it } from "vitest";

process.env.HB_DB_DRIVER = "pglite";
process.env.HB_PGLITE_DIR = ".pglite-test";

let extract: typeof import("@/lib/services/skill-extraction").extractSkillsFromDescription;

beforeAll(async () => {
  const { runMigrations } = await import("../scripts/migrate-lib");
  await runMigrations({ quiet: true });
  const { seedDatabase } = await import("@/lib/seed/seed");
  await seedDatabase();
  ({ extractSkillsFromDescription: extract } = await import(
    "@/lib/services/skill-extraction"
  ));
});

const JD = [
  "You must have strong SQL and advanced data analysis.",
  "Proficient in Excel is required.",
  "Power BI is a plus.",
  "Familiarity with Python is nice to have.",
  "Strong communication with stakeholders is essential.",
].join(" ");

describe("extractSkillsFromDescription", () => {
  it("does not let a nice-to-have in one sentence downgrade a requirement in another", async () => {
    const found = await extract(JD, "Data Analyst");
    const bySlug = Object.fromEntries(found.map((s) => [s.slug, s]));

    expect(bySlug.sql.importance).toBe("essential");
    expect(bySlug["data-analysis"].importance).toBe("essential");
    expect(bySlug.excel.importance).toBe("essential");
    expect(bySlug["power-bi"].importance).toBe("helpful");
    expect(bySlug.python.importance).toBe("helpful");
  });

  it("never assigns an advanced bar to a helpful skill by default", async () => {
    const found = await extract(JD, "Data Analyst");
    for (const skill of found.filter((s) => s.importance === "helpful")) {
      expect(skill.requiredScore).toBeLessThanOrEqual(45);
      expect(skill.requiredLevel).toBe("beginner");
    }
  });

  it("reads the level from the wording around the skill", async () => {
    const found = await extract(JD, "Data Analyst");
    const sql = found.find((s) => s.slug === "sql");
    expect(sql?.requiredLevel).toBe("advanced");
  });

  it("always reports the phrase that produced each suggestion", async () => {
    const found = await extract(JD, "Data Analyst");
    expect(found.length).toBeGreaterThan(0);
    for (const skill of found) {
      expect(skill.matchedPhrase).toBeTruthy();
      expect(JD.toLowerCase()).toContain(skill.matchedPhrase);
    }
  });

  it("returns nothing for a description with no recognisable skills", async () => {
    const found = await extract("We are looking for a friendly, motivated teammate.", "Intern");
    expect(found).toHaveLength(0);
  });

  it("sorts essential requirements first", async () => {
    const found = await extract(JD, "Data Analyst");
    const importances = found.map((s) => s.importance);
    expect(importances.indexOf("essential")).toBeLessThan(importances.indexOf("helpful"));
  });
});
