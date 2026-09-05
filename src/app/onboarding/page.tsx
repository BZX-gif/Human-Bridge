import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/db";
import { skills } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { listCareers } from "@/lib/services/career-service";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Get started — Human Bridge" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/onboarding");

  const db = await getDb();
  const careers = await listCareers();
  const skillRows = await db
    .select({ slug: skills.slug, name: skills.name })
    .from(skills)
    .orderBy(skills.name);

  return (
    <OnboardingWizard
      careers={careers.map((c) => ({ id: c.id, slug: c.slug, name: c.name, tagline: c.tagline }))}
      skills={skillRows}
    />
  );
}
