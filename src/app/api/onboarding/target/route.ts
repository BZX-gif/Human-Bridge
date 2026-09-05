import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { careers, users } from "@/db/schema";
import { ApiError, handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { refreshPassport } from "@/lib/services/skill-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ careerId: z.number().int().positive() });

/** Set the signed-in candidate's target career. */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { careerId } = schema.parse(await request.json());
    const db = await getDb();

    const [career] = await db
      .select({ id: careers.id })
      .from(careers)
      .where(eq(careers.id, careerId))
      .limit(1);
    if (!career) throw new ApiError("NOT_FOUND", "Career not found.");

    await db
      .update(users)
      .set({ targetCareerId: career.id, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await refreshPassport(user.id);
    return ok({ targetCareerId: career.id });
  });
}
