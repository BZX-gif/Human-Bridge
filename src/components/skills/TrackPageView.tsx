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
    <main className="min-h-full bg-paper-2">
      <div className="border-b border-line bg-paper">
        <div className="mx-auto max-w-[1180px] px-4 pb-8 pt-8 sm:px-7 sm:pt-10 lg:px-10">
          <Link href="/skills" className="text-xs font-semibold text-ink hover:underline">
            ← All skills
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-[clamp(2.1rem,4.5vw,3rem)] leading-[1.02] tracking-[-0.02em] text-ink">{track.name}</h1>
              {track.category && (
                <p className="mt-2 text-sm font-medium text-ink">{track.category}</p>
              )}
              {track.description && (
                <p className="mt-3 max-w-2xl leading-relaxed text-graphite">{track.description}</p>
              )}
            </div>
            {track.icon && (
              <div className="hidden rounded-lg bg-paper-2 p-4 text-ink sm:block">
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

      <div className="mx-auto max-w-[1180px] space-y-6 px-4 py-7 sm:px-7 lg:px-10">
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
              className="flex items-center gap-3 rounded-lg border border-line bg-paper p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-paper-2 text-ink">
                <Icon size={16} aria-hidden />
              </span>
              <div>
                <p className="text-xl font-bold tabular-nums text-ink">{value}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Skills by entry difficulty */}
        <section className="rounded-lg border border-line bg-paper p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
            <Target size={15} className="text-ink" aria-hidden />
            Skills in this track
          </h2>
          <p className="mb-5 text-xs text-muted">
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
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
                    {difficulty}
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {list.map((skill) => (
                      <li
                        key={skill.id}
                        className="rounded-lg border border-line bg-paper-2/50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/skills/${skill.slug}`}
                            className="text-sm font-semibold text-ink hover:text-ink"
                          >
                            {skill.name}
                          </Link>
                          <LevelBadge level={skill.requiredLevel} />
                        </div>
                        {skill.description && (
                          <p className="mt-1.5 text-xs leading-relaxed text-muted line-clamp-2">
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
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-3">
                            <div
                              className="h-full rounded-full bg-ink"
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
          <section className="rounded-lg border border-line bg-paper p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
              <Briefcase size={15} className="text-ink" aria-hidden />
              Real-world tasks this track measures
            </h2>
            <p className="mb-5 text-xs text-muted">
              Practical, evidence-based tasks — the kind of work that produces a real skill score.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {realWorldTasks.slice(0, 8).map((task) => (
                <li
                  key={`${task.skillSlug}-${task.dimension}`}
                  className="rounded-lg border border-line bg-paper-2/50 p-4"
                >
                  <p className="text-sm font-semibold text-ink">{task.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{task.description}</p>
                  <Link
                    href={`/skills/${task.skillSlug}`}
                    className="mt-2 inline-block text-xs font-semibold text-ink hover:underline"
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
          <section className="rounded-lg border border-line bg-paper p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
              <Briefcase size={15} className="text-ink" aria-hidden />
              Roles in this track
            </h2>
            <ul className="flex flex-wrap gap-2">
              {track.roles.map((role) => (
                <li key={role.slug}>
                  <Link
                    href={`/careers/${role.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-3 py-2 text-sm font-semibold text-graphite transition-colors hover:border-ink/40 hover:text-ink"
                  >
                    {role.name}
                    <ArrowRight size={13} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs leading-relaxed text-muted">
          Scores and levels are evidence-derived. A course, certificate or self-reported claim never
          produces a verified level without assessed or verified evidence.
        </p>
      </div>
    </main>
  );
}
