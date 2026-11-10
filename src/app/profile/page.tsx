import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { careers, users } from "@/db/schema";
import { getPortfolioForUser } from "@/lib/services/portfolio-service";
import { ProfileWorkspace } from "@/components/profile/ProfileWorkspace";
import { ErrorState } from "@/components/ui/States";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your professional identity, direction and availability.",
};

export default async function ProfilePage() {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/login?next=/profile");

  let view: {
    email: string;
    career: { name: string; slug: string } | null;
    publicId: string | null;
    isPublic: boolean;
    initial: {
      name: string;
      headline: string;
      about: string;
      location: string;
      links: { label: string; url: string }[];
      weeklyHours: number;
      currentLevel: "beginner" | "some_experience" | "intermediate";
    };
  } | null = null;

  try {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (user) {
      // Career name and portfolio are independent — one wave.
      const [careerRows, portfolio] = await Promise.all([
        user.targetCareerId
          ? db
              .select({ name: careers.name, slug: careers.slug })
              .from(careers)
              .where(eq(careers.id, user.targetCareerId))
              .limit(1)
          : Promise.resolve([]),
        getPortfolioForUser(user.id),
      ]);
      const career: { name: string; slug: string } | null = careerRows[0] ?? null;
      view = {
        email: user.email,
        career,
        publicId: portfolio.publicId,
        isPublic: portfolio.isPublic,
        initial: {
          name: user.name,
          headline: user.headline ?? "",
          about: user.about ?? "",
          location: user.location ?? "",
          links: Array.isArray(user.links) ? (user.links as { label: string; url: string }[]) : [],
          weeklyHours: user.weeklyHours,
          currentLevel: (user.currentLevel as "beginner" | "some_experience" | "intermediate") ?? "beginner",
        },
      };
    }
  } catch (error) {
    console.error("[profile] failed to load", error);
  }

  if (!view) {
    return (
      <main id="main-content" className="app-page">
        <p className="eyebrow mb-3">Profile</p>
        <h1 className="font-display text-[clamp(2rem,4vw,2.9rem)] leading-tight">
          Your profile could not be loaded.
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
          Your saved details are unchanged. Please retry in a moment.
        </p>
        <div className="mt-6">
          <ErrorState message="We could not load your profile." />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content">
      <ProfileWorkspace
        email={view.email}
        career={view.career}
        publicId={view.publicId}
        isPublic={view.isPublic}
        initial={view.initial}
      />
    </main>
  );
}
