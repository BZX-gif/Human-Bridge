import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { careers, users } from "@/db/schema";
import { handleRoute, ok } from "@/lib/api/response";
import { requireUser } from "@/lib/auth/session";
import { addEvidence, refreshPassport } from "@/lib/services/skill-service";
import { onboardingSchema } from "@/lib/validation/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = onboardingSchema.parse(await request.json());
    const db = await getDb();

    let targetCareerId: number | null = null;
    if (body.targetCareerSlug) {
      const [career] = await db
        .select({ id: careers.id })
        .from(careers)
        .where(eq(careers.slug, body.targetCareerSlug))
        .limit(1);
      targetCareerId = career?.id ?? null;
    }

    await db
      .update(users)
      .set({
        goal: body.goal ?? null,
        educationBackground: body.educationBackground ?? null,
        experienceSummary: body.experienceSummary ?? null,
        experienceYears: body.experienceYears ?? 0,
        targetCareerId,
        location: body.location ?? null,
        workPreference: body.workPreference ?? null,
        onboardingComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Self-reported skills are recorded as claims ONLY. They never produce a
    // score or a verified level — that requires assessment evidence.
    for (const claim of body.selfReportedSkills ?? []) {
      await addEvidence({
        userId: user.id,
        skillSlug: claim.slug,
        source: "SELF_REPORTED",
        label: "Self-reported during onboarding",
        detail: `Candidate claims ${claim.claimedLevel} level. Not verified.`,
      });
    }

    await refreshPassport(user.id);
    return ok({ onboardingComplete: true, targetCareerId });
  });
}
