/**
 * Database access layer.
 *
 * Design goals:
 *  1. NOTHING connects at import time. Pages that never touch the database must
 *     build and render fine without DATABASE_URL. `getDb()` is lazy.
 *  2. Provider agnostic-ish: a real Postgres server (DATABASE_URL) in production,
 *     or an embedded PGlite database for local development / CI when no server is
 *     available (HB_DB_DRIVER=pglite or no DATABASE_URL + HB_ALLOW_EMBEDDED_DB=1).
 *  3. No credentials in source. Everything comes from the environment.
 */
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

export type Database =
  | NodePgDatabase<typeof schema>
  | PgliteDatabase<typeof schema>;

export class DatabaseUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

type GlobalWithDb = typeof globalThis & {
  __humanBridgeDb?: Promise<Database>;
};

const globalForDb = globalThis as GlobalWithDb;

function resolveDriver(): "postgres" | "pglite" {
  const explicit = process.env.HB_DB_DRIVER?.toLowerCase();
  if (explicit === "pglite") return "pglite";
  if (explicit === "postgres") return "postgres";
  if (process.env.DATABASE_URL) return "postgres";
  if (process.env.HB_ALLOW_EMBEDDED_DB === "1" || process.env.NODE_ENV !== "production") {
    return "pglite";
  }
  throw new DatabaseUnavailableError(
    "DATABASE_URL is not configured. Set DATABASE_URL, or set HB_DB_DRIVER=pglite for an embedded development database.",
  );
}

async function createDb(): Promise<Database> {
  const driver = resolveDriver();

  if (driver === "postgres") {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new DatabaseUnavailableError("DATABASE_URL is not configured.");
    }
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: url,
      max: Number(process.env.HB_DB_POOL_MAX ?? 10),
    });
    return drizzle(pool, { schema });
  }

  const { drizzle } = await import("drizzle-orm/pglite");
  const { PGlite } = await import("@electric-sql/pglite");
  // A file-backed embedded database keeps dev data across restarts.
  const dataDir = process.env.HB_PGLITE_DIR ?? ".pglite";
  const client = new PGlite(dataDir);
  return drizzle(client, { schema });
}

/** Lazily create (and memoise) the database handle. Never called at build time. */
export function getDb(): Promise<Database> {
  if (!globalForDb.__humanBridgeDb) {
    globalForDb.__humanBridgeDb = createDb().catch((error) => {
      globalForDb.__humanBridgeDb = undefined;
      throw error;
    });
  }
  return globalForDb.__humanBridgeDb;
}

/** True when a database is at least configured (does not open a connection). */
export function isDatabaseConfigured(): boolean {
  try {
    resolveDriver();
    return true;
  } catch {
    return false;
  }
}

export { schema };
