import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config. Credentials come from the environment only — never
 * committed. `npm run db:generate` produces SQL into src/db/migrations.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/human_bridge",
  },
});
