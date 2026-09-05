/**
 * Migration runner, importable from both the CLI script and the test suite.
 *
 * Drizzle emits `--> statement-breakpoint` between statements. Some drivers
 * (notably PGlite) only accept one statement per execute, so we run them
 * individually rather than sending the whole file.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const MIGRATIONS_DIR = path.join(process.cwd(), "src", "db", "migrations");

export async function runMigrations(options: { quiet?: boolean } = {}): Promise<number> {
  const log = (message: string) => {
    if (!options.quiet) process.stdout.write(message);
  };

  const { getDb } = await import("../src/db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();

  await db.execute(
    sql`create table if not exists __migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`,
  );

  const applied = await db.execute(sql`select name from __migrations`);
  const appliedNames = new Set((applied.rows as { name: string }[]).map((r) => r.name));

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();

  let count = 0;
  for (const file of files) {
    if (appliedNames.has(file)) continue;
    const contents = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    log(`Applying ${file}... `);
    const statements = contents
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await db.execute(sql.raw(statement));
    }
    await db.execute(sql`insert into __migrations (name) values (${file})`);
    log("done\n");
    count += 1;
  }

  return count;
}
