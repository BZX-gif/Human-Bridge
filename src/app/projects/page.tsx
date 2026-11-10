import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { careers, users } from "@/db/schema";
import { getPortfolioForUser, listProjectCatalogue } from "@/lib/services/portfolio-service";
import { ProjectsWorkspace } from "@/components/projects/ProjectsWorkspace";
import { ErrorState } from "@/components/ui/States";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description: "Build practical work that demonstrates the skills a role requires.",
};

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/projects");

  let view: {
    projects: Awaited<ReturnType<typeof getPortfolioForUser>>["projects"];
    catalogue: Awaited<ReturnType<typeof listProjectCatalogue>>;
    careerName: string | null;
  } | null = null;

  try {
    const db = await getDb();
    const [record] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);

    let careerName: string | null = null;
    if (record?.targetCareerId) {
      const [career] = await db
        .select({ name: careers.name })
        .from(careers)
        .where(eq(careers.id, record.targetCareerId))
        .limit(1);
      careerName = career?.name ?? null;
    }

    const portfolio = await getPortfolioForUser(user.id);
    const catalogue = await listProjectCatalogue(record?.targetCareerId ?? undefined);
    view = { projects: portfolio.projects, catalogue, careerName };
  } catch (error) {
    console.error("[projects] failed to load", error);
  }

  if (!view) {
    return (
      <main id="main-content" className="app-page">
        <p className="eyebrow mb-3">Projects</p>
        <h1 className="font-display text-[clamp(2rem,4vw,2.9rem)] leading-tight">
          The project library is unavailable.
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
          Your saved projects are safe. Please retry in a moment.
        </p>
        <div className="mt-6">
          <ErrorState message="We could not load your projects." />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content">
      <ProjectsWorkspace
        initialProjects={view.projects}
        initialCatalogue={view.catalogue}
        targetCareer={view.careerName}
      />
    </main>
  );
}
