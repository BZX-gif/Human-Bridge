import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { learningResources } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getCareerReadinessForTrack,
  getCareerTrackBySlug,
  getSkillBySlug,
} from "@/lib/services/taxonomy-service";
import { SkillPageView } from "@/components/skills/SkillPageView";
import { TrackPageView } from "@/components/skills/TrackPageView";

export const dynamic = "force-dynamic";

/**
 * /skills/[slug] resolves to either a career track or a skill.
 * The taxonomy lives in the database, so a single catch-all route decides
 * which view to render by looking up the slug — the UI never hardcodes tracks.
 */
type SlugParams = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: SlugParams): Promise<Metadata> {
  const { slug } = await params;
  const [value] = slug;
  if (!value || slug.length !== 1) return { title: "Not found — Human Bridge" };

  try {
    const { track } = await getCareerTrackBySlug(value);
    return { title: `${track.name} — Skills | Human Bridge`, description: track.description ?? undefined };
  } catch {
    /* fall through to skill */
  }
  try {
    const skill = await getSkillBySlug(value);
    return { title: `${skill.name} — Skill | Human Bridge`, description: skill.description ?? undefined };
  } catch {
    return { title: "Not found — Human Bridge" };
  }
}

export default async function SkillsSlugPage({ params }: SlugParams) {
  const { slug } = await params;
  const [value] = slug;
  if (!value || slug.length !== 1) notFound();

  const user = await getCurrentUser();

  // Track takes precedence for lookup, then skill — both are DB-driven.
  let trackData: Awaited<ReturnType<typeof getCareerTrackBySlug>> | null = null;
  let skillData: Awaited<ReturnType<typeof getSkillBySlug>> | null = null;

  try {
    trackData = await getCareerTrackBySlug(value, user?.id);
  } catch {
    /* not a track */
  }
  if (!trackData) {
    try {
      skillData = await getSkillBySlug(value, user?.id);
    } catch {
      /* not a skill */
    }
  }
  if (!trackData && !skillData) notFound();

  if (trackData) {
    const readiness = user ? await getCareerReadinessForTrack(value, user.id) : null;
    return <TrackPageView track={trackData.track} skills={trackData.skills} readiness={readiness} />;
  }

  const db = await getDb();
  const resources = await db
    .select()
    .from(learningResources)
    .where(eq(learningResources.skillId, skillData!.id))
    .orderBy(learningResources.level);
  return <SkillPageView data={skillData!} resources={resources} />;
}
