import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { fail, handleRoute, ok } from "@/lib/api/response";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const limit = rateLimit(clientKey(request, "login"), 10, 300);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "Too many attempts. Please try again shortly.");
    }

    const body = loginSchema.parse(await request.json());
    const db = await getDb();

    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);

    // Identical error for unknown email and wrong password — no user enumeration.
    const invalid = fail("UNAUTHENTICATED", "Incorrect email or password.");
    if (!user) return invalid;
    if (!(await verifyPassword(body.password, user.passwordHash))) return invalid;

    await createSession(user.id);
    return ok({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });
}
