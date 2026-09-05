import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { companies, users } from "@/db/schema";
import { fail, handleRoute, ok } from "@/lib/api/response";
import { clientKey, rateLimit } from "@/lib/api/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { refreshPassport } from "@/lib/services/skill-service";
import { signupSchema } from "@/lib/validation/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const limit = rateLimit(clientKey(request, "signup"), 5, 300);
    if (!limit.allowed) {
      return fail("RATE_LIMITED", "Too many signup attempts. Please try again shortly.");
    }

    const body = signupSchema.parse(await request.json());
    const db = await getDb();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);
    if (existing.length > 0) {
      return fail("CONFLICT", "An account with this email already exists.");
    }

    let companyId: number | null = null;
    if (body.role === "employer") {
      const name = body.companyName?.trim() || `${body.name}'s Company`;
      const slug = `${slugify(name)}-${Date.now().toString(36)}`;
      const [company] = await db
        .insert(companies)
        .values({
          name,
          slug,
          logoInitials: initials(name),
          logoColor: "bg-slate-700",
          isDemo: false,
        })
        .returning();
      companyId = company.id;
    }

    const [user] = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
        passwordHash: await hashPassword(body.password),
        role: body.role,
        companyId,
        avatarInitials: initials(body.name),
        avatarColor: "bg-[#1a56ff]",
      })
      .returning();

    if (body.role === "candidate") await refreshPassport(user.id);
    await createSession(user.id);

    return ok({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, 201);
  });
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
