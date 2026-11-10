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
          <h1 className="font-display text-[clamp(2rem,4vw,2.9rem)] leading-tight">
            We could not load your journey.
          </h1>
          <div className="mt-6">
            <ErrorState message={failure} />
          </div>
        </>
      ) : (
        <>
          <div className="max-w-3xl">
            <p className="eyebrow">My journey</p>
            <h1 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3.1rem)] leading-[1.02] tracking-[-0.02em]">
              A path needs a destination.
            </h1>
            <p className="lede mt-4">
              Choose the career you want to work toward. Human Bridge will build a roadmap from that
              role&apos;s real requirements — not a generic course list — and adapt it to the skills
              you can already evidence.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink href="/careers">
                <Compass size={15} aria-hidden />
                Explore careers
              </ButtonLink>
              <ButtonLink href="/profile" variant="secondary">
                Set weekly availability
              </ButtonLink>
            </div>
          </div>

          <div className="app-section grid gap-4 sm:grid-cols-2">
            {careers.map((career) => (
              <Link
                key={career.id}
                href={`/careers/${career.slug}`}
                className="group flex items-start justify-between gap-4 rounded-lg border border-line bg-paper p-5 transition-colors hover:border-line-strong"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                    {career.trackName ?? "Career"}
                  </p>
                  <p className="mt-2 font-display text-[22px] leading-tight text-ink">{career.name}</p>
                  <p className="mt-1 text-[12px] text-muted">
                    {career.skillCount} skills · {career.essentialCount} essential
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="mt-1 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                  aria-hidden
                />
              </Link>
            ))}
          </div>

          <div className="app-section flex items-start gap-3 rounded-lg border border-line bg-paper-2 p-5">
            <Info size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
            <p className="max-w-2xl text-[12px] leading-relaxed text-muted">
              You can change your career goal later. Rebuilding a roadmap preserves your planner
              tasks and portfolio — only the plan structure changes.
            </p>
          </div>
        </>
      )}
    </main>
  );
}
