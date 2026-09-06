/**
 * Skills & Assessments framework tests.
 *
 * Runs against the embedded PGlite database so the real schema, migrations,
 * seed data and query paths are exercised — no mocks.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

process.env.HB_DB_DRIVER = "pglite";
process.env.HB_PGLITE_DIR = ".pglite-taxonomy-test";

let getDb: typeof import("@/db").getDb;
let schema: typeof import("@/db/schema");
let seedDatabase: typeof import("@/lib/seed/seed").seedDatabase;
let taxonomy: typeof import("@/lib/services/taxonomy-service");
let skillService: typeof import("@/lib/services/skill-service");
let requireAdmin: typeof import("@/lib/auth/session").requireAdmin;
let createSkillRoute: typeof import("@/app/api/admin/skills/route").POST;

beforeAll(async () => {
  const { runMigrations } = await import("../scripts/migrate-lib");
  await runMigrations({ quiet: true });
  ({ seedDatabase } = await import("@/lib/seed/seed"));
  await seedDatabase();

  ({ getDb } = await import("@/db"));
  schema = await import("@/db/schema");
  taxonomy = await import("@/lib/services/taxonomy-service");
  skillService = await import("@/lib/services/skill-service");
  ({ requireAdmin } = await import("@/lib/auth/session"));
  ({ POST: createSkillRoute } = await import("@/app/api/admin/skills/route"));
});

describe("skills taxonomy seed", () => {
  it("creates exactly 12 career tracks with unique slugs", async () => {
    const tracks = await taxonomy.listCareerTracks();
    expect(tracks).toHaveLength(12);
    const slugs = tracks.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(12);
    expect(slugs).toContain("software-engineering");
    expect(slugs).toContain("data-analytics");
    expect(slugs).toContain("ai-ml");
    expect(slugs).toContain("customer-success-support");
  });

  it("links track skills through relationships (track → skills)", async () => {
    const { skills } = await taxonomy.getCareerTrackBySlug("data-analytics");
    const slugs = skills.map((s) => s.slug);
    expect(slugs).toContain("sql");
    expect(slugs).toContain("power-bi");
    // SQL is required at advanced level for data analytics.
    const sql = skills.find((s) => s.slug === "sql");
    expect(sql?.requiredLevel).toBe("advanced");
  });

  it("attaches AI fluency capabilities to multiple tracks", async () => {
    const aiSkill = await taxonomy.getSkillBySlug("ai-output-verification");
    expect(aiSkill.skillType).toBe("ai_fluency");
    const trackSlugs = aiSkill.tracks.map((t) => t.slug);
    expect(trackSlugs.length).toBeGreaterThan(1);
    expect(trackSlugs).toContain("data-analytics");
    expect(trackSlugs).toContain("software-engineering");
  });

  it("seeds sub-skills under skills (SQL → joins, window functions…)", async () => {
    const sql = await taxonomy.getSkillBySlug("sql");
    const subSlugs = sql.subSkills.map((s) => s.slug);
    expect(subSlugs).toContain("joins");
    expect(subSlugs).toContain("window-functions");
    expect(new Set(subSlugs).size).toBe(subSlugs.length);
  });

  it("seeds the six-dimension real-world capability model for key skills", async () => {
    const sql = await taxonomy.getSkillBySlug("sql");
    const dimensions = sql.capabilities.map((c) => c.dimension);
    expect(dimensions).toContain("knowledge");
    expect(dimensions).toContain("practical_capability");
    expect(dimensions).toContain("real_world_task");
    expect(dimensions).toContain("reasoning");
    expect(dimensions).toContain("communication");
    expect(dimensions).toContain("verification");
  });
});

const STAMP = `${Date.now()}`;
const TEST_SKILL_SLUG = `test-skill-${STAMP}`;
const TEST_ASSESSMENT_SLUG = `test-assessment-${STAMP}`;

describe("skill admin service", () => {
  it("creates a skill and reads it back", async () => {
    const created = await taxonomy.createSkill({
      name: "Test Skill",
      slug: TEST_SKILL_SLUG,
      description: "A skill created by the test suite.",
      skillType: "domain",
    });
    expect(created.slug).toBe(TEST_SKILL_SLUG);

    const fetched = await taxonomy.getSkillBySlug(TEST_SKILL_SLUG);
    expect(fetched.name).toBe("Test Skill");
    expect(fetched.skillType).toBe("domain");
  });

  it("prevents duplicate skill slugs", async () => {
    await expect(
      taxonomy.createSkill({ name: "SQL Again", slug: "sql" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("links a skill to a track and prevents duplicate links", async () => {
    const track = (await taxonomy.listCareerTracks()).find((t) => t.slug === "cybersecurity");
    const skill = await taxonomy.getSkillBySlug(TEST_SKILL_SLUG);
    if (!track || !skill) throw new Error("Fixture missing");

    await taxonomy.linkSkillToTrack(track.id, skill.id, { importance: "helpful" });
    // Upsert is idempotent — linking twice must not error.
    await taxonomy.linkSkillToTrack(track.id, skill.id, { importance: "essential" });

    const trackSkills = await taxonomy.getTrackSkills(track.slug);
    const linked = trackSkills.find((s) => s.slug === TEST_SKILL_SLUG);
    expect(linked?.importance).toBe("essential");
  });

  it("creates sub-skills and rejects duplicate slugs within a skill", async () => {
    const skill = await taxonomy.getSkillBySlug(TEST_SKILL_SLUG);
    const subSlug = `example-${STAMP}`;
    await taxonomy.createSubSkill(skill.id, { name: "Example", slug: subSlug });
    await expect(
      taxonomy.createSubSkill(skill.id, { name: "Example 2", slug: subSlug }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const fetched = await taxonomy.getSkillBySlug(TEST_SKILL_SLUG);
    expect(fetched.subSkills.map((s) => s.slug)).toContain(subSlug);
  });

  it("updates skill difficulty/importance/status (admin management)", async () => {
    const skill = await taxonomy.getSkillBySlug(TEST_SKILL_SLUG);
    const updated = await taxonomy.updateSkill(skill.id, {
      difficulty: "advanced",
      importance: "essential",
      marketRelevance: "very_high",
      status: "disabled",
    });
    expect(updated.difficulty).toBe("advanced");
    expect(updated.status).toBe("disabled");
  });
});

describe("assessment ↔ skill relationships", () => {
  it("exposes seeded blueprint skill links through the skill detail view", async () => {
    const db = await getDb();
    const links = await db
      .select()
      .from(schema.assessmentBlueprintSkills)
      .innerJoin(schema.skills, eq(schema.skills.id, schema.assessmentBlueprintSkills.skillId))
      .limit(100);
    expect(links.length).toBeGreaterThan(0);

    const sql = await taxonomy.getSkillBySlug("sql");
    expect(sql.assessments.length).toBeGreaterThan(0);
    expect(sql.assessments[0].assessmentType).toBe("data_analysis");
  });

  it("creates an assessment draft with skill attachments via the admin service", async () => {
    const created = await taxonomy.createAssessment({
      slug: TEST_ASSESSMENT_SLUG,
      title: "Test Assessment",
      description: "A draft assessment from the test suite.",
      skillSlugs: ["sql", "python"],
      assessmentType: "practical_task",
      status: "draft",
    });
    expect(created.slug).toBe(TEST_ASSESSMENT_SLUG);
    expect(created.status).toBe("draft");

    const db = await getDb();
    const links = await db
      .select()
      .from(schema.assessmentBlueprintSkills)
      .where(eq(schema.assessmentBlueprintSkills.blueprintId, created.id));
    expect(links.length).toBe(2);
  });
});

describe("candidate skill results (evidence → score → level)", () => {
  it("computes score, level, assessment count and last assessed from ASSESSED evidence", async () => {
    const db = await getDb();
    const stamp = Date.now();
    const [user] = await db
      .insert(schema.users)
      .values({ name: "Candidate", email: `tax-cand-${stamp}@test.local`, passwordHash: "x" })
      .returning();

    // Self-reported evidence must never produce a level from a score alone.
    await skillService.addEvidence({
      userId: user.id,
      skillSlug: "sql",
      source: "SELF_REPORTED",
      label: "Resume claim",
      score: 95,
    });

    let mine = await skillService.getUserSkills(user.id);
    const selfReported = mine.find((s) => s.slug === "sql");
    expect(selfReported?.score ?? 0).toBe(0);
    expect(selfReported?.level).toBe("not_evaluated");
    expect(selfReported?.verificationStatus).toBe("self_reported");

    // Assessed evidence (knowledge + practical) produces measured outcome.
    await skillService.addEvidence({
      userId: user.id,
      skillSlug: "sql",
      source: "ASSESSED",
      label: "SQL Fundamentals — Knowledge check",
      score: 80,
      weight: 60,
    });
    await skillService.addEvidence({
      userId: user.id,
      skillSlug: "sql",
      source: "ASSESSED",
      label: "SQL Fundamentals — Practical work",
      score: 90,
      weight: 140,
    });

    mine = await skillService.getUserSkills(user.id);
    const sql = mine.find((s) => s.slug === "sql");
    expect(sql).toBeDefined();
    expect(sql!.score).toBeGreaterThan(80);
    expect(sql!.assessmentCount).toBe(2);
    expect(sql!.lastAssessedAt).toBeInstanceOf(Date);
    expect(sql!.verificationStatus).toBe("assessed");

    const skillView = await taxonomy.getSkillBySlug("sql", user.id);
    expect(skillView.candidate?.assessmentCount).toBe(2);
    expect(skillView.candidate?.score).toBe(sql!.score);
  });
});

describe("API authorization", () => {
  it("requireAdmin rejects anonymous callers", async () => {
    await expect(requireAdmin()).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("admin skill creation route returns 401 without a session", async () => {
    const response = await createSkillRoute(
      new Request("http://localhost/api/admin/skills", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Blocked", slug: "blocked-skill" }),
      }),
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });
});
