import Link from "next/link";
import { ArrowRight, Briefcase, Layers, ListChecks, Target, Wrench } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { LevelBadge } from "@/components/assessment/EvidenceBadges";
import type {
  TrackSkillView,
  TrackView,
} from "@/lib/services/taxonomy-service";

const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"] as const;

export function TrackPageView({
  track,
  skills,
  readiness,
}: {
  track: TrackView;
  skills: TrackSkillView[];
  readiness: { readiness: number | null } | null;
}) {
  const realWorldTasks = skills.flatMap((s) =>
    s.capabilities
      .filter((c) => c.dimension === "real_world_task")
      .map((c) => ({ skillSlug: s.slug, skillName: s.name, ...c })),
  );
  const capabilityCount = skills.reduce((sum, s) => sum + s.capabilities.length, 0);
  const subSkillCount = skills.reduce((sum, s) => sum + s.subSkills.length, 0);
  const assessedCount = skills.filter((s) => s.candidateScore !== null).length;

  const byDifficulty = new Map<string, TrackSkillView[]>(DIFFICULTY_ORDER.map((d) => [d, []]));
  for (const skill of skills) {
    const list = byDifficulty.get(skill.difficulty) ?? [];
    list.push(skill);
    byDifficulty.set(skill.difficulty, list);
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Link href="/skills" className="text-xs font-semibold text-[#1a56ff] hover:underline">
            ← All skills
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">{track.name}</h1>
              {track.category && (
                <p className="mt-2 text-sm font-medium text-[#1a56ff]">{track.category}</p>
              )}
              {track.description && (
                <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">{track.description}</p>
              )}
            </div>
            {track.icon && (
              <div className="hidden rounded-2xl bg-[#eef3ff] p-4 text-[#1a56ff] sm:block">
                <Layers size={28} aria-hidden />
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {track.difficultyLevels.map((level) => (
              <Badge key={level} variant="outline" className="capitalize">
                {level}
              </Badge>
            ))}
            <Badge variant="blue">{skills.length} skills</Badge>
            {readiness?.readiness !== null && readiness?.readiness !== undefined && (
              <Badge variant="green">Measured readiness {readiness.readiness}</Badge>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/assessments">
              Prove a skill
              <ArrowRight size={15} aria-hidden />
            </ButtonLink>
            {track.roles.length > 0 && (
              <ButtonLink href="/careers" variant="secondary">
                See roles in this track
              </ButtonLink>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {/* Capability metadata strip */}
        <section className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Skills", value: skills.length, icon: Target },
            { label: "Capability definitions", value: capabilityCount, icon: ListChecks },
            { label: "Sub-skills", value: subSkillCount, icon: Wrench },
            { label: "Real-world tasks", value: realWorldTasks.length, icon: Briefcase },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-[#1a56ff]">
                <Icon size={16} aria-hidden />
              </span>
              <div>
                <p className="text-xl font-bold tabular-nums text-slate-900">{value}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Skills by entry difficulty */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
            <Target size={15} className="text-[#1a56ff]" aria-hidden />
            Skills in this track
          </h2>
          <p className="mb-5 text-xs text-slate-500">
            {readiness
              ? `Your measured score is shown against ${assessedCount} of ${skills.length} track skills.`
              : "Sign in to see your own scores against this track."}
          </p>

          {skills.length === 0 ? (
            <EmptyState title="No skills yet" message="Run npm run db:seed to load the taxonomy." />
          ) : (
            DIFFICULTY_ORDER.map((difficulty) => {
              const list = byDifficulty.get(difficulty) ?? [];
              if (list.length === 0) return null;
              return (
                <div key={difficulty} className="mb-6 last:mb-0">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {difficulty}
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {list.map((skill) => (
                      <li
                        key={skill.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/skills/${skill.slug}`}
                            className="text-sm font-semibold text-slate-900 hover:text-[#1a56ff]"
                          >
                            {skill.name}
                          </Link>
                          <LevelBadge level={skill.requiredLevel} />
                        </div>
                        {skill.description && (
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
                            {skill.description}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {skill.subSkills.length > 0 && (
                            <Badge variant="outline" size="sm">
                              {skill.subSkills.length} sub-skills
                            </Badge>
                          )}
                          {skill.capabilities.length > 0 && (
                            <Badge variant="outline" size="sm">
                              {skill.capabilities.length} capabilities
                            </Badge>
                          )}
                          {skill.candidateScore !== null && (
                            <Badge variant="green" size="sm">
                              Your score: {skill.candidateScore}
                            </Badge>
                          )}
                        </div>
                        {skill.candidateScore !== null && (
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#1a56ff]"
                              style={{ width: `${skill.candidateScore}%` }}
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </section>

        {/* Real-world capability model */}
        {realWorldTasks.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <Briefcase size={15} className="text-[#1a56ff]" aria-hidden />
              Real-world tasks this track measures
            </h2>
            <p className="mb-5 text-xs text-slate-500">
              Practical, evidence-based tasks — the kind of work that produces a real skill score.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {realWorldTasks.slice(0, 8).map((task) => (
                <li
                  key={`${task.skillSlug}-${task.dimension}`}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{task.description}</p>
                  <Link
                    href={`/skills/${task.skillSlug}`}
                    className="mt-2 inline-block text-xs font-semibold text-[#1a56ff] hover:underline"
                  >
                    {task.skillName} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Roles in this track */}
        {track.roles.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <Briefcase size={15} className="text-[#1a56ff]" aria-hidden />
              Roles in this track
            </h2>
            <ul className="flex flex-wrap gap-2">
              {track.roles.map((role) => (
                <li key={role.slug}>
                  <Link
                    href={`/careers/${role.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[#1a56ff]/40 hover:text-[#1a56ff]"
                  >
                    {role.name}
                    <ArrowRight size={13} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs leading-relaxed text-slate-500">
          Scores and levels are evidence-derived. A course, certificate or self-reported claim never
          produces a verified level without assessed or verified evidence.
        </p>
      </div>
    </main>
  );
}
