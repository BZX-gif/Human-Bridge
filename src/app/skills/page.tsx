import Link from "next/link";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { BookOpen } from "lucide-react";
import { getDb, isDatabaseConfigured } from "@/db";
import { skillCategories, skills } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserSkills } from "@/lib/services/skill-service";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { ConfidenceBadge, VerificationBadge } from "@/components/assessment/EvidenceBadges";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skills — Human Bridge",
  description:
    "The skill catalogue behind every career and job on Human Bridge, and where your own evidence stands.",
};

export default async function SkillsPage() {
  if (!isDatabaseConfigured()) {
    return (
      <main className="min-h-screen bg-[#f8fafc] pt-16">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <EmptyState
            title="Database not configured"
            message="Set DATABASE_URL and run npm run db:seed to load the skill catalogue."
          />
        </div>
      </main>
    );
  }

  const db = await getDb();
  const rows = await db
    .select({
      id: skills.id,
      name: skills.name,
      slug: skills.slug,
      description: skills.description,
      whyEmployersWant: skills.whyEmployersWant,
      categoryName: skillCategories.name,
    })
    .from(skills)
    .leftJoin(skillCategories, eq(skillCategories.id, skills.categoryId))
    .orderBy(skills.name);

  const user = await getCurrentUser();
  const mine = user ? await getUserSkills(user.id) : [];
  const mineBySlug = new Map(mine.map((s) => [s.slug, s]));

  const byCategory = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.categoryName ?? "Other";
    byCategory.set(key, [...(byCategory.get(key) ?? []), row]);
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#1a56ff]">
            Skill catalogue
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900">
            Every role here is built from these skills.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Careers, jobs and assessments all reference the same canonical skills, so a score you
            earn once is understood everywhere on the platform.
          </p>
          {!user && (
            <div className="mt-6">
              <ButtonLink href="/signup">Sign up to track your evidence</ButtonLink>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {rows.length === 0 ? (
          <EmptyState title="No skills loaded" message="Run npm run db:seed to populate the catalogue." />
        ) : (
          Array.from(byCategory.entries()).map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
                <BookOpen size={15} className="text-[#1a56ff]" aria-hidden />
                {category}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((skill) => {
                  const evidence = mineBySlug.get(skill.slug);
                  return (
                    <li
                      key={skill.id}
                      className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="font-bold text-slate-900">{skill.name}</h3>
                        {evidence && evidence.score > 0 && (
                          <span className="shrink-0 text-lg font-bold tabular-nums text-slate-900">
                            {evidence.score}
                          </span>
                        )}
                      </div>
                      {skill.description && (
                        <p className="mb-3 flex-1 text-sm leading-relaxed text-slate-600">
                          {skill.description}
                        </p>
                      )}
                      {skill.whyEmployersWant && (
                        <p className="mb-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                          <strong className="font-semibold text-slate-700">
                            Why employers want it:
                          </strong>{" "}
                          {skill.whyEmployersWant}
                        </p>
                      )}
                      {evidence ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <VerificationBadge status={evidence.verificationStatus} />
                          <ConfidenceBadge confidence={evidence.confidence} />
                          <span className="text-[11px] text-slate-400">
                            {evidence.evidenceCount} evidence
                          </span>
                        </div>
                      ) : (
                        user && (
                          <p className="text-[11px] text-slate-400">No evidence yet</p>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-600">
            A skill only gets a score and a level once you produce evidence for it.
          </p>
          <div className="mt-4">
            <Link href="/assessments" className="text-sm font-semibold text-[#1a56ff] hover:underline">
              Prove a skill with a work simulation →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
