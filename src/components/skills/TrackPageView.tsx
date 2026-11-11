import Link from "next/link";
import { Briefcase, ChevronLeft, ChevronRight, Layers, ListChecks, Target, Wrench } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Panel, SectionHeader } from "@/components/ui/AppPage";
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
    <main id="main-content" className="app-page">
      <Link href="/skills" className="hb-link animate-rise text-sm">
        <ChevronLeft size={15} strokeWidth={2.2} aria-hidden />
        All skills
      </Link>

      <section className="hb-tile hb-tile-white animate-rise mt-4 p-6 sm:p-9">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            {track.category && <p className="eyebrow">{track.category}</p>}
            <h1 className="display-md mt-2 text-ink">{track.name}</h1>
            {track.description && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-graphite">{track.description}</p>
            )}
          </div>
          {track.icon && (
            <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-link sm:flex">
              <Layers size={28} strokeWidth={1.6} aria-hidden />
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

        <div className="mt-8 flex flex-wrap gap-2.5">
          <ButtonLink href="/assessments" size="lg">
            Prove a skill
          </ButtonLink>
          {track.roles.length > 0 && (
            <ButtonLink href="/careers" variant="secondary" size="lg">
              See roles in this track
            </ButtonLink>
          )}
        </div>
      </section>

      {/* Capability metadata strip */}
      <section className="stagger mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-4" aria-label="Track summary">
        {[
          { label: "Skills", value: skills.length, icon: Target },
          { label: "Capability definitions", value: capabilityCount, icon: ListChecks },
          { label: "Sub-skills", value: subSkillCount, icon: Wrench },
          { label: "Real-world tasks", value: realWorldTasks.length, icon: Briefcase },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="hb-card flex items-center gap-4 p-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-2 text-ink">
              <Icon size={18} strokeWidth={1.7} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="stat-value">{value}</p>
              <p className="mt-1 text-xs font-medium text-muted">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-4 space-y-4 sm:mt-5 lg:space-y-5">
        {/* Skills by entry difficulty */}
        <Panel>
          <SectionHeader
            title="Skills in this track"
            description={
              readiness
                ? `Your measured score is shown against ${assessedCount} of ${skills.length} track skills.`
                : "Sign in to see your own scores against this track."
            }
          />

          {skills.length === 0 ? (
            <div className="mt-5">
              <EmptyState title="No skills yet" message="Run npm run db:seed to load the taxonomy." />
            </div>
          ) : (
            DIFFICULTY_ORDER.map((difficulty) => {
              const list = byDifficulty.get(difficulty) ?? [];
              if (list.length === 0) return null;
              return (
                <div key={difficulty} className="mt-7">
                  <h3 className="mb-3 text-sm font-semibold capitalize text-ink">{difficulty}</h3>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {list.map((skill) => (
                      <li key={skill.id} className="rounded-md bg-paper-2 p-5 transition-colors duration-200 hover:bg-paper-3">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/skills/${skill.slug}`}
                            className="text-base font-semibold text-ink transition-colors duration-200 hover:text-link"
                          >
                            {skill.name}
                          </Link>
                          <LevelBadge level={skill.requiredLevel} />
                        </div>
                        {skill.description && (
                          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{skill.description}</p>
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
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-4">
                            <div className="h-full rounded-full bg-moss" style={{ width: `${skill.candidateScore}%` }} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </Panel>

        {/* Real-world capability model */}
        {realWorldTasks.length > 0 && (
          <Panel>
            <SectionHeader
              title="Real-world tasks this track measures"
              description="Practical, evidence-based tasks — the kind of work that produces a real skill score."
            />
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {realWorldTasks.slice(0, 8).map((task) => (
                <li key={`${task.skillSlug}-${task.dimension}`} className="rounded-md bg-paper-2 p-5">
                  <p className="text-base font-semibold text-ink">{task.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{task.description}</p>
                  <Link href={`/skills/${task.skillSlug}`} className="hb-link mt-3 text-sm">
                    {task.skillName}
                    <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* Roles in this track */}
        {track.roles.length > 0 && (
          <Panel>
            <SectionHeader title="Roles in this track" />
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {track.roles.map((role) => (
                <li key={role.slug}>
                  <Link
                    href={`/careers/${role.slug}`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-paper-2 pl-4 pr-3 text-md font-medium text-ink transition-[background-color,color] duration-200 ease-apple hover:bg-accent-soft hover:text-link"
                  >
                    {role.name}
                    <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <p className="px-1 text-sm leading-relaxed text-muted">
          Scores and levels are evidence-derived. A course, certificate or self-reported claim never
          produces a verified level without assessed or verified evidence.
        </p>
      </div>
    </main>
  );
}
