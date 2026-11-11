import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getPlannerData } from "@/lib/services/planner-service";
import { PlannerWorkspace } from "@/components/planner/PlannerWorkspace";
import { ErrorState } from "@/components/ui/States";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Planner",
  description: "Connect your career roadmap to the work you can do today.",
};

export default async function PlannerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/planner");

  let loaded: { data: Awaited<ReturnType<typeof getPlannerData>>; weeklyHours: number } | null = null;
  try {
    const db = await getDb();
    // Availability and planner data are independent — one wave.
    const [records, data] = await Promise.all([
      db.select().from(users).where(eq(users.id, user.id)).limit(1),
      getPlannerData(user.id),
    ]);
    loaded = { data, weeklyHours: records[0]?.weeklyHours ?? 5 };
  } catch (error) {
    console.error("[planner] failed to load", error);
  }

  if (!loaded) {
    return (
      <main id="main-content" className="app-page">
        <p className="eyebrow mb-3">Planner</p>
        <h1 className="display-md">
          The planner is temporarily unavailable.
        </h1>
        <p className="mt-2 max-w-xl text-md leading-relaxed text-muted">
          Your saved tasks are unchanged. Please retry in a moment.
        </p>
        <div className="mt-6">
          <ErrorState message="We could not load your plan." />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content">
      <PlannerWorkspace initialData={loaded.data} weeklyHours={loaded.weeklyHours} />
    </main>
  );
}
