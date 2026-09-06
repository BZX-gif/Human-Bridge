import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { careerTracks, skillCategories, skills, trackSkills } from "@/db/schema";
import { handleRoute, ok } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserSkills } from "@/lib/services/skill-service";
import { listSkillsQuerySchema } from "@/lib/validation/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const url = new URL(request.url);
    const query = listSkillsQuerySchema.parse({
      track: url.searchParams.get("track") ?? undefined,
      skillType: url.searchParams.get("skillType") ?? undefined,
    });

    const db = await getDb();
    const rows = await db
      .select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
        description: skills.description,
        whyEmployersWant: skills.whyEmployersWant,
        skillType: skills.skillType,
        difficulty: skills.difficulty,
        importance: skills.importance,
        marketRelevance: skills.marketRelevance,
        status: skills.status,
        categoryName: skillCategories.name,
        categorySlug: skillCategories.slug,
        trackSlug: careerTracks.slug,
        trackName: careerTracks.name,
      })
      .from(skills)
      .leftJoin(skillCategories, eq(skillCategories.id, skills.categoryId))
      .leftJoin(trackSkills, eq(trackSkills.skillId, skills.id))
      .leftJoin(careerTracks, eq(careerTracks.id, trackSkills.trackId))
      .where(eq(skills.status, "active"))
      .orderBy(skills.name);

    const user = await getCurrentUser();
    const mySkills = user ? await getUserSkills(user.id) : [];
    const myBySlug = new Map(mySkills.map((s) => [s.slug, s]));

    const grouped = new Map<number, (typeof rows)[number] & { tracks: { slug: string; name: string }[] }>();
    for (const row of rows) {
      const existing = grouped.get(row.id) ?? { ...row, tracks: [] };
      if (row.trackSlug && row.trackName) {
        if (!existing.tracks.some((t) => t.slug === row.trackSlug)) {
          existing.tracks.push({ slug: row.trackSlug, name: row.trackName });
        }
      }
      grouped.set(row.id, existing);
    }

    const skillsOut = Array.from(grouped.values())
      .filter((s) => !query.track || s.tracks.some((t) => t.slug === query.track))
      .filter((s) => !query.skillType || s.skillType === query.skillType)
      .map((s) => ({
        ...s,
        trackSlug: undefined,
        trackName: undefined,
        tracks: s.tracks,
        myScore: myBySlug.get(s.slug)?.score ?? null,
        myLevel: myBySlug.get(s.slug)?.level ?? null,
        myVerificationStatus: myBySlug.get(s.slug)?.verificationStatus ?? null,
      }));

    return ok({ skills: skillsOut, mySkills });
  });
}
