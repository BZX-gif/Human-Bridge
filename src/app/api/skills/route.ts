import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { skillCategories, skills } from "@/db/schema";
import { handleRoute, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserSkills } from "@/lib/services/skill-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleRoute(async () => {
    const db = await getDb();
    const rows = await db
      .select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
        description: skills.description,
        whyEmployersWant: skills.whyEmployersWant,
        categoryName: skillCategories.name,
        categorySlug: skillCategories.slug,
      })
      .from(skills)
      .leftJoin(skillCategories, eq(skillCategories.id, skills.categoryId))
      .orderBy(skills.name);

    const user = await getCurrentUser();
    const mySkills = user ? await getUserSkills(user.id) : [];

    return ok({ skills: rows, mySkills });
  });
}
