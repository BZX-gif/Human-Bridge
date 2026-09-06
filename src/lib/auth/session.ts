import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { ApiError } from "@/lib/api/response";
import type { SessionUser } from "@/lib/auth/types";

export type { SessionUser };
export const SESSION_COOKIE = "hb_session";
const SESSION_DAYS = 30;

export async function createSession(userId: number): Promise<string> {
  const db = await getDb();
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id, userId, expiresAt });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return id;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    try {
      const db = await getDb();
      await db.delete(sessions).where(eq(sessions.id, id));
    } catch {
      // Session cleanup is best-effort; the cookie is cleared regardless.
    }
  }
  jar.delete(SESSION_COOKIE);
}

/** Returns the signed-in user, or null. Never throws for anonymous visitors. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  let sessionId: string | undefined;
  try {
    const jar = await cookies();
    sessionId = jar.get(SESSION_COOKIE)?.value;
  } catch {
    return null;
  }
  if (!sessionId) return null;

  try {
    const db = await getDb();
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        companyId: users.companyId,
        targetCareerId: users.targetCareerId,
        onboardingComplete: users.onboardingComplete,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Require any authenticated user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError("UNAUTHENTICATED", "You must be signed in to do this.");
  return user;
}

/** Require an admin account (skill/track/assessment catalogue management). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new ApiError("FORBIDDEN", "This action requires an admin account.");
  }
  return user;
}

/** Require an employer (or admin) with a company attached. */
export async function requireEmployer(): Promise<SessionUser & { companyId: number }> {
  const user = await requireUser();
  if (user.role !== "employer" && user.role !== "admin") {
    throw new ApiError("FORBIDDEN", "This action requires an employer account.");
  }
  if (user.companyId === null) {
    throw new ApiError("FORBIDDEN", "Create a company profile before doing this.");
  }
  return { ...user, companyId: user.companyId };
}
