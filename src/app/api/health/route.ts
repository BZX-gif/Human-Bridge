import { sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/db";
import { isAiConfigured } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseConfigured = isDatabaseConfigured();
  let databaseReachable = false;

  if (databaseConfigured) {
    try {
      const db = await getDb();
      await db.execute(sql`select 1`);
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
