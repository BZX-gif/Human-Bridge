import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { ChevronRight, Layers, ShieldCheck } from "lucide-react";
import { getDb, isDatabaseConfigured } from "@/db";
import { skillCategories, skills } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserSkills } from "@/lib/services/skill-service";
import { listCareerTracks } from "@/lib/services/taxonomy-service";
import { PageHeader, SectionHeader, Stat } from "@/components/ui/AppPage";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { ConfidenceBadge, VerificationBadge } from "@/components/assessment/EvidenceBadges";
import { formatSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "The measurable skills behind every career on Human Bridge, and where your own evidence stands.",
};

export default async function SkillsPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main id="main-content" className="app-page">
        <EmptyState
          title="Skill catalogue unavailable"
          message="The database is not configured, so the catalogue cannot be loaded. Your account data is unaffected."
        />
      </main>
    );
  }

  const db = await getDb();
  // Catalogue, tracks and session are independent — one wave.
  const [tracks, rows, user] = await Promise.all([
    listCareerTracks(),
    db
      .select({
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
        skillType: skills.skillType,
        difficulty: skills.difficulty,
        categoryName: skillCategories.name,
      })
      .from(skills)
      .leftJoin(skillCategories, eq(skillCategories.id, skills.categoryId))
      .where(eq(skills.status, "active"))
      .orderBy(skills.name),
    getCurrentUser(),
  ]);

  const mine = user ? await getUserSkills(user.id) : [];
  const mineBySlug = new Map(mine.map((skill) => [skill.slug, skill]));
  const verified = mine.filter((skill) => skill.verificationStatus !== "self_reported" && skill.score > 0);
  const selfReported = mine.filter((skill) => skill.verificationStatus === "self_reported");

  const byCategory = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.categoryName ?? "Other";
    byCategory.set(key, [...(byCategory.get(key) ?? []), row]);
  }

  return (
    <main id="main-content" className="app-page">
      <PageHeader
        eyebrow="Skills"
        title="What can you actually do?"
        description="Every career here is built from measurable skills. A score or level appears only when you produce evidence — an assessment, a practical task or recorded project work. Claiming a skill is not the same as demonstrating it."
        actions={
          !user ? (
            <ButtonLink href="/signup" size="md">
              Track your evidence
            </ButtonLink>
          ) : (
            <ButtonLink href="/assessments" size="md">
              <ShieldCheck size={15} aria-hidden />
              Prove a skill
            </ButtonLink>
          )
        }
      />

      {user && (
        <section className="stagger mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4" aria-label="Your skill evidence">
          <Stat label="Verified skills" value={verified.length} hint="Assessment or employer evidence." accent="moss" />
          <Stat label="Self-reported" value={selfReported.length} hint="Recorded claims, never counted as verified." />
          <Stat label="Catalogue" value={rows.length} hint={`Measurable skills across ${tracks.length} tracks.`} />
        </section>
      )}

      <section className="app-section">
        <SectionHeader
          title="Career tracks"
          description="A track is a family of roles that share a skill base. Start with the track, then narrow to a role."
          action={<span className="tabular text-sm text-muted">{tracks.length} tracks</span>}
        />

        {tracks.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No tracks loaded"
              message="The skill taxonomy has not been seeded. Run the seed command to populate it."
            />
          </div>
        ) : (
          <ul className="stagger mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {tracks.map((track) => (
              <li key={track.id}>
                <Link href={`/skills/${track.slug}`} className="hb-card hb-card-interactive group flex h-full flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold leading-snug tracking-[-0.015em] text-ink">{track.name}</h3>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-2 text-graphite transition-[background-color,color] duration-500 ease-out-expo group-hover:bg-accent group-hover:text-white">
                      <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
                    </span>
                  </div>
                  {track.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{track.description}</p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
                      <Layers size={13} aria-hidden />
                      {track.skillCount} skills
                    </span>
                    {track.difficultyLevels.slice(0, 2).map((level) => (
                      <span key={level} className="rounded-full bg-paper-2 px-2 py-0.5 text-2xs capitalize text-graphite">
                        {level}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">Skills are shared across tracks; counts are per track.</p>
      </section>

      <section className="app-section">
        <SectionHeader
          title="Skill catalogue"
          description="Grouped by category. Open a skill to see what it means and where you stand."
          action={
            <Link href="/careers" className="hb-link text-sm">
              Browse careers
              <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
            </Link>
          }
        />

        {rows.length === 0 ? (
          <div className="mt-5">
            <EmptyState title="No skills loaded" message="The skill catalogue is empty." />
          </div>
        ) : (
          <div className="hb-card mt-5 divide-y divide-line overflow-clip">
            {Array.from(byCategory.entries()).map(([category, items], index) => (
              <details key={category} open={index === 0} className="group/cat">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 transition-colors duration-200 marker:content-none hover:bg-paper-2 sm:px-7 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2.5 text-base font-semibold text-ink">
                    <ChevronRight
                      size={16}
                      strokeWidth={2.2}
                      className="text-muted transition-transform duration-300 ease-out-expo group-open/cat:rotate-90"
                      aria-hidden
                    />
                    {category}
                  </span>
                  <span className="tabular text-sm text-muted">{items.length} skills</span>
                </summary>
                {/*
                  Compact rows: the catalogue holds 100+ skills, so the list
                  renders names + evidence state only (~1/5 of the old bytes).
                  Descriptions live on the skill detail page.
                */}
                <ul className="grid grid-cols-1 gap-x-8 px-5 pb-5 sm:grid-cols-2 sm:px-7 lg:grid-cols-3">
                  {items.map((skill) => {
                    const evidence = mineBySlug.get(skill.slug);
                    return (
                      <li key={skill.id} className="border-t border-line">
                        <Link href={`/skills/${skill.slug}`} className="group flex items-center gap-2.5 py-3">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-md font-medium text-ink transition-colors duration-200 group-hover:text-link">
                              {skill.name}
                            </span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                              <span>{formatSlug(skill.skillType)}</span>
                              <span aria-hidden>·</span>
                              <span className="capitalize">{skill.difficulty}</span>
                              {evidence ? (
                                <>
                                  <span aria-hidden>·</span>
                                  <VerificationBadge status={evidence.verificationStatus} />
                                  <ConfidenceBadge confidence={evidence.confidence} />
                                </>
                              ) : user ? (
                                <>
                                  <span aria-hidden>·</span>
                                  <span>No evidence</span>
                                </>
                              ) : null}
                            </span>
                          </span>
                          {evidence && evidence.score > 0 ? (
                            <span className="tabular shrink-0 text-base font-semibold text-ink">{evidence.score}</span>
                          ) : (
                            <ChevronRight
                              size={15}
                              className="shrink-0 text-line-strong transition-[transform,color] duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:text-link"
                              aria-hidden
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="hb-card app-section flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-3.5">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-moss" aria-hidden />
          <div>
            <p className="text-base font-semibold text-ink">A score has to be earned.</p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              Self-reported skills stay labelled. Only an assessment or employer review can create a
              verified level, and project completion never marks a skill verified on its own.
            </p>
          </div>
        </div>
        <ButtonLink href="/assessments" variant="secondary" size="md" className="shrink-0">
          Work simulations
        </ButtonLink>
      </section>
    </main>
  );
}
