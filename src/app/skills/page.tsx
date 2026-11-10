import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { ArrowRight, ArrowUpRight, Layers, ShieldCheck } from "lucide-react";
import { getDb, isDatabaseConfigured } from "@/db";
import { skillCategories, skills } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserSkills } from "@/lib/services/skill-service";
import { listCareerTracks } from "@/lib/services/taxonomy-service";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { ConfidenceBadge, VerificationBadge } from "@/components/assessment/EvidenceBadges";

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
      <header className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Skills</p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3rem)] leading-[1.02] tracking-[-0.02em]">
            What can you actually do?
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
            Every career here is built from measurable skills. A score or level appears only when you
            produce evidence — an assessment, a practical task or recorded project work. Claiming a
            skill is not the same as demonstrating it.
          </p>
        </div>
        {!user ? (
          <ButtonLink href="/signup" size="md">
            Track your evidence
            <ArrowRight size={14} aria-hidden />
          </ButtonLink>
        ) : (
          <ButtonLink href="/assessments" variant="secondary" size="md">
            <ShieldCheck size={14} aria-hidden />
            Prove a skill
          </ButtonLink>
        )}
      </header>

      {user && (
        <section className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          <div className="bg-paper p-4">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">Verified skills</p>
            <p className="mt-1 font-display text-[26px] leading-none tabular text-moss">{verified.length}</p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted">Assessment or employer evidence.</p>
          </div>
          <div className="bg-paper p-4">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">Self-reported</p>
            <p className="mt-1 font-display text-[26px] leading-none tabular text-graphite">{selfReported.length}</p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted">Recorded claims, never counted as verified.</p>
          </div>
          <div className="bg-paper p-4">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">Catalogue</p>
            <p className="mt-1 font-display text-[26px] leading-none tabular text-ink">{rows.length}</p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted">Measurable skills across {tracks.length} tracks.</p>
          </div>
        </section>
      )}

      <section className="app-section">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Career tracks</h2>
            <p className="mt-1 text-[11.5px] text-muted">
              A track is a family of roles that share a skill base. Start with the track, then narrow to a role.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.12em] text-faint">{tracks.length} tracks</span>
        </div>

        {tracks.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No tracks loaded"
              message="The skill taxonomy has not been seeded. Run the seed command to populate it."
            />
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track) => (
              <li key={track.id}>
                  <Link
                    href={`/skills/${track.slug}`}
                    className="group flex h-full flex-col rounded-lg border border-line bg-paper p-4 transition-colors hover:border-line-strong"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[13px] font-semibold text-ink">{track.name}</h3>
                      <ArrowUpRight
                        size={13}
                        className="mt-0.5 shrink-0 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                        aria-hidden
                      />
                    </div>
                    {track.description && (
                      <p className="mt-1.5 line-clamp-2 flex-1 text-[11px] leading-relaxed text-muted">
                        {track.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
                      <span className="inline-flex items-center gap-1 text-[9.5px] text-graphite">
                        <Layers size={9} aria-hidden />
                        {track.skillCount} skills
                      </span>
                      {track.difficultyLevels.slice(0, 2).map((level) => (
                        <span key={level} className="rounded-[3px] bg-paper-3 px-1.5 py-0.5 text-[9px] capitalize text-graphite">
                          {level}
                        </span>
                      ))}
                    </div>
                  </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[10px] text-faint">Skills are shared across tracks; counts are per track.</p>
      </section>

      <section className="app-section">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Skill catalogue</h2>
            <p className="mt-1 text-[11.5px] text-muted">
              Grouped by category. Open a skill to see what it means and where you stand.
            </p>
          </div>
          <ButtonLink href="/careers" variant="ghost" size="sm">
            Browse careers
            <ArrowRight size={12} aria-hidden />
          </ButtonLink>
        </div>

        {rows.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No skills loaded" message="The skill catalogue is empty." />
          </div>
        ) : (
          <div className="mt-4 divide-y divide-line border-y border-line">
            {Array.from(byCategory.entries()).map(([category, items], index) => (
              <details key={category} open={index === 0} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 marker:content-none">
                  <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
                    <span className="text-[10px] text-faint transition-transform group-open:rotate-90">▸</span>
                    {category}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.1em] text-faint">{items.length} skills</span>
                </summary>
                {/*
                  Compact rows: the catalogue holds 100+ skills, so the list
                  renders names + evidence state only (~1/5 of the old bytes).
                  Descriptions live on the skill detail page.
                */}
                <ul className="grid gap-x-6 pb-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((skill) => {
                    const evidence = mineBySlug.get(skill.slug);
                    return (
                      <li key={skill.id} className="border-b border-line/70 last:border-0">
                        <Link
                          href={`/skills/${skill.slug}`}
                          className="group flex items-center gap-2.5 py-2.5"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12.5px] font-medium text-ink group-hover:underline group-hover:underline-offset-4">
                              {skill.name}
                            </span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-faint">
                              <span className="capitalize">{skill.skillType.replace("_", " ")}</span>
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
                            <span className="shrink-0 text-[13px] font-medium tabular text-graphite">
                              {evidence.score}
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] text-faint transition-transform group-hover:translate-x-0.5" aria-hidden>
                              →
                            </span>
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

      <section className="mt-8 flex flex-col gap-4 rounded-lg border border-line bg-paper-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-graphite" aria-hidden />
          <div>
            <p className="text-[12.5px] font-medium text-ink">A score has to be earned.</p>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted">
              Self-reported skills stay labelled. Only an assessment or employer review can create a
              verified level, and project completion never marks a skill verified on its own.
            </p>
          </div>
        </div>
        <ButtonLink href="/assessments" variant="secondary" size="sm" className="shrink-0">
          Work simulations
          <ArrowRight size={12} aria-hidden />
        </ButtonLink>
      </section>
    </main>
  );
}
