import { sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import { isAiConfigured } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = isDatabaseConfigured();
  let databaseReachable = false;

  if (databaseConfigured) {
    // Bounded probe: a wedged database must report 503 fast, never hang the
    // health check (and through it, the load balancer) indefinitely.
    try {
      const db = await getDb();
      await Promise.race([
        db.execute(sql`select 1`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("health probe timed out")), 5000),
        ),
      ]);
      databaseReachable = true;
    } catch {
      databaseReachable = false;
    }
  }

  return Response.json(
    {
      success: true,
      data: {
        ok: databaseReachable,
        databaseConfigured,
        databaseReachable,
        // Reported honestly so the UI never claims AI evaluation it cannot do.
        aiEvaluationAvailable: isAiConfigured(),
      },
    },
    { status: databaseReachable ? 200 : 503 },
  );
}
