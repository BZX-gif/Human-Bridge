import { fail, handleRoute, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { seedDatabase } from "@/lib/seed/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Seed the reference catalogue and assessment blueprints.
 *
 * Guarded: in production this requires either an admin session or a matching
 * SEED_SECRET, so a public POST can never rewrite catalogue data.
 * The seed itself is idempotent and never touches user-owned tables.
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    if (process.env.NODE_ENV === "production") {
      const user = await getCurrentUser();
      const secret = request.headers.get("x-seed-secret");
      const expected = process.env.SEED_SECRET;
      const authorised =
        user?.role === "admin" || (Boolean(expected) && secret === expected);
      if (!authorised) {
        return fail("FORBIDDEN", "Seeding is not permitted.");
      }
    }

    const counts = await seedDatabase();
    return ok({
      message: "Catalogue and assessment blueprints seeded. Existing user data was not modified.",
      counts,
    });
  });
}
