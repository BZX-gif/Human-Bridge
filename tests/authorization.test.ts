/**
 * Authorization tests run against the embedded PGlite database so they exercise
 * the real query paths, not mocks.
 */
import { beforeAll, describe, expect, it } from "vitest";

process.env.HB_DB_DRIVER = "pglite";
process.env.HB_PGLITE_DIR = ".pglite-test";

let getDb: typeof import("@/db").getDb;
let schema: typeof import("@/db/schema");
let getOwnedAttempt: typeof import("@/lib/services/assessment-service").getOwnedAttempt;
let assertJobOwnership: typeof import("@/lib/services/employer-service").assertJobOwnership;
let listJobCandidates: typeof import("@/lib/services/employer-service").listJobCandidates;

let userA = 0;
let userB = 0;
let attemptA = 0;
let companyA = 0;
let companyB = 0;
let jobA = 0;

beforeAll(async () => {
  const { runMigrations } = await import("../scripts/migrate-lib");
  await runMigrations({ quiet: true });
  const { seedDatabase } = await import("@/lib/seed/seed");
  await seedDatabase();

  ({ getDb } = await import("@/db"));
  schema = await import("@/db/schema");
  ({ getOwnedAttempt } = await import("@/lib/services/assessment-service"));
  ({ assertJobOwnership, listJobCandidates } = await import(
    "@/lib/services/employer-service"
  ));

  const db = await getDb();
  const stamp = Date.now();

  const [a] = await db
    .insert(schema.users)
    .values({ name: "Candidate A", email: `a${stamp}@test.local`, passwordHash: "x" })
    .returning();
  const [b] = await db
    .insert(schema.users)
    .values({ name: "Candidate B", email: `b${stamp}@test.local`, passwordHash: "x" })
    .returning();
  userA = a.id;
  userB = b.id;

  const [ca] = await db
    .insert(schema.companies)
    .values({ name: `Company A ${stamp}`, slug: `company-a-${stamp}` })
    .returning();
  const [cb] = await db
    .insert(schema.companies)
    .values({ name: `Company B ${stamp}`, slug: `company-b-${stamp}` })
    .returning();
  companyA = ca.id;
  companyB = cb.id;

  const [job] = await db
    .insert(schema.jobs)
    .values({ companyId: companyA, title: "Data Analyst", workType: "hybrid" })
    .returning();
  jobA = job.id;

  const [bp] = await db
    .select()
    .from(schema.assessmentBlueprints)
    .limit(1);

  const [attempt] = await db
    .insert(schema.assessmentAttempts)
    .values({
      userId: userA,
      blueprintId: bp.id,
      blueprintVersion: bp.version,
      attemptNumber: 1,
      status: "in_progress",
    })
    .returning();
  attemptA = attempt.id;
});

describe("attempt ownership", () => {
  it("returns the attempt to its owner", async () => {
    const attempt = await getOwnedAttempt(attemptA, userA);
    expect(attempt.id).toBe(attemptA);
  });

  it("refuses another user's attempt", async () => {
    await expect(getOwnedAttempt(attemptA, userB)).rejects.toThrow();
  });

  it("does not leak the existence of another user's attempt", async () => {
    // The error must be identical to a genuinely missing attempt.
    const foreign = await getOwnedAttempt(attemptA, userB).catch((e: Error) => e.message);
    const missing = await getOwnedAttempt(999_999, userB).catch((e: Error) => e.message);
    expect(foreign).toBe(missing);
  });
});

describe("employer job ownership", () => {
  it("allows the owning company", async () => {
    const job = await assertJobOwnership(jobA, companyA);
    expect(job.id).toBe(jobA);
  });

  it("refuses another company", async () => {
    await expect(assertJobOwnership(jobA, companyB)).rejects.toThrow();
  });

  it("blocks cross-company candidate listing", async () => {
    await expect(listJobCandidates(jobA, companyB)).rejects.toThrow();
    await expect(listJobCandidates(jobA, companyA)).resolves.toBeInstanceOf(Array);
  });
});
