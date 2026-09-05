/**
 * Apply SQL migrations, then optionally seed.
 *
 *   npm run db:migrate      apply migrations
 *   npm run db:seed         apply migrations + seed catalogue/blueprints
 *
 * Works against a real Postgres (DATABASE_URL) or the embedded PGlite database
 * used for local development and CI.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const shouldSeed = process.argv.includes("--seed");
  const { runMigrations } = await import("./migrate-lib");

  const count = await runMigrations();
  console.log(count === 0 ? "No pending migrations." : `Applied ${count} migration(s).`);

  if (shouldSeed) {
    const { seedDatabase } = await import("../src/lib/seed/seed");
    const counts = await seedDatabase();
    console.log("Seeded:", counts);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
