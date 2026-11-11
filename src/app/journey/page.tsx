import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight, Compass, Info, Map, Target } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { ensureRoadmapForUser, getRoadmapForUser, loadRoadmapForUser } from "@/lib/services/roadmap-service";
import { listCareerSummaries } from "@/lib/services/career-service";
import { RoadmapWorkspace } from "@/components/journey/RoadmapWorkspace";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My journey",
  description: "Your career roadmap, milestone by milestone.",
};

export default async function JourneyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/journey");

  let roadmap = null;
  let weeklyHours = 5;
  let failure: string | null = null;
  let careers: Awaited<ReturnType<typeof listCareerSummaries>> = [];

  try {
    const db = await getDb();
    const [record] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    weeklyHours = record?.weeklyHours ?? 5;

    roadmap = await getRoadmapForUser(user.id);

    // Repair path: a target exists but the roadmap was never created (e.g. an
    // account created before the journey feature shipped).
    if (!roadmap && record?.targetCareerId) {
      await ensureRoadmapForUser(user.id, record.targetCareerId, {
        hoursPerWeek: weeklyHours,
      });
      // Fresh read: this request just created the roadmap.
      roadmap = await loadRoadmapForUser(user.id);
    }

    if (!roadmap) careers = (await listCareerSummaries()).slice(0, 4);
  } catch (error) {
    console.error("[journey] failed to load", error);
    failure = "Your roadmap could not be loaded right now. Your data is safe — please retry.";
  }

  if (roadmap) {
    return (
      <main id="main-content">
        <RoadmapWorkspace initialRoadmap={roadmap} weeklyHours={weeklyHours} />
      </main>
    );
  }

  return (
    <main id="main-content" className="app-page">
      {failure ? (
        <>
          <p className="eyebrow mb-3">My journey</p>
          <h1 className="display-md">
            We could not load your journey.
          </h1>
          <div className="mt-6">
            <ErrorState message={failure} />
          </div>
        </>
      ) : (
        <>
          <div className="animate-rise max-w-3xl">
            <p className="eyebrow">My journey</p>
            <h1 className="display-lg mt-3">A path needs a destination.</h1>
            <p className="lede mt-5">
              Choose the career you want to work toward. Human Bridge will build a roadmap from that
              role&apos;s real requirements — not a generic course list — and adapt it to the skills
              you can already evidence.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <ButtonLink href="/careers" size="lg">
                <Compass size={17} aria-hidden />
                Explore careers
              </ButtonLink>
              <ButtonLink href="/profile" variant="secondary" size="lg">
                Set weekly availability
              </ButtonLink>
            </div>
          </div>

          <div className="stagger app-section grid grid-cols-1 gap-4 sm:grid-cols-2">
            {careers.map((career) => (
              <Link
                key={career.id}
                href={`/careers/${career.slug}`}
                className="hb-card hb-card-interactive group flex items-center justify-between gap-4 p-6"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">{career.trackName ?? "Career"}</p>
                  <p className="mt-2 text-xl font-semibold leading-tight tracking-[-0.02em] text-ink">{career.name}</p>
                  <p className="mt-1.5 text-sm text-muted">
                    {career.skillCount} skills · {career.essentialCount} essential
                  </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-graphite transition-[background-color,color] duration-500 ease-out-expo group-hover:bg-accent group-hover:text-white">
                  <ArrowRight size={16} aria-hidden />
                </span>
              </Link>
            ))}
          </div>

          <div className="app-section flex items-start gap-3.5 rounded-lg bg-paper-3/70 p-5">
            <Info size={17} className="mt-0.5 shrink-0 text-muted" aria-hidden />
            <p className="max-w-2xl text-sm leading-relaxed text-muted">
              You can change your career goal later. Rebuilding a roadmap preserves your planner
              tasks and portfolio — only the plan structure changes.
            </p>
          </div>
        </>
      )}
    </main>
  );
}
