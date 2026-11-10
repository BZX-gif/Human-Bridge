import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Gauge,
  GraduationCap,
  Layers,
  Sparkles,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import {
  ConfidenceBadge,
  LevelBadge,
  VerificationBadge,
} from "@/components/assessment/EvidenceBadges";
import { DEFAULT_LEVEL_THRESHOLDS, SKILL_LEVEL_LABELS } from "@/lib/assessment/skill-level";
import type { SkillDetailView } from "@/lib/services/taxonomy-service";

const CAPABILITY_LABELS: Record<string, string> = {
  knowledge: "Knowledge",
  practical_capability: "Practical capability",
  real_world_task: "Real-world task",
  reasoning: "Reasoning",
  communication: "Communication",
  verification: "Verification",
};

export interface LearningResourceView {
  id: number;
  title: string;
  provider: string | null;
  type: string | null;
  duration: string | null;
  level: string;
  description: string | null;
}

export function SkillPageView({
  data,
  resources,
}: {
  data: SkillDetailView;
  resources: LearningResourceView[];
}) {
  const levelProgression = DEFAULT_LEVEL_THRESHOLDS;

  return (
    <main className="min-h-full bg-paper-2">
      <div className="border-b border-line bg-paper">
        <div className="mx-auto max-w-[1180px] px-4 pb-8 pt-8 sm:px-7 sm:pt-10 lg:px-10">
          <Link href="/skills" className="text-xs font-semibold text-ink hover:underline">
            ← All skills
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="font-display text-[clamp(2.1rem,4.5vw,3rem)] leading-[1.02] tracking-[-0.02em] text-ink">{data.name}</h1>
              <p className="mt-3 leading-relaxed text-graphite">{data.description}</p>
              {data.whyEmployersWant && (
                <p className="mt-3 rounded-md bg-paper-2 p-3 text-sm text-graphite">
                  <strong className="font-semibold text-graphite">Why employers want it:</strong>{" "}
                  {data.whyEmployersWant}
                </p>
              )}
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-paper-2 text-ink">
              {data.skillType === "ai_fluency" ? (
                <Sparkles size={26} aria-hidden />
              ) : (
                <GraduationCap size={26} aria-hidden />
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="blue" className="capitalize">
              {data.skillType.replace("_", " ")}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {data.difficulty}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {data.importance}
            </Badge>
            <Badge variant="outline" className="capitalize">
              market: {data.marketRelevance.replace("_", " ")}
            </Badge>
            {data.categoryName && <Badge variant="outline">{data.categoryName}</Badge>}
          </div>

          {data.candidate ? (
            <div className="mt-8 rounded-lg border border-line bg-paper p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold tabular-nums text-ink">
                    {data.candidate.score || "—"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">Your measured evidence</p>
                    <p className="text-xs text-muted">
                      {data.candidate.evidenceCount} evidence · {data.candidate.assessmentCount}{" "}
                      assessed
                      {data.candidate.lastAssessedAt
                        ? ` · last assessed ${new Date(data.candidate.lastAssessedAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <LevelBadge level={SKILL_LEVEL_LABELS[data.candidate.level] ?? "Not Evaluated"} />
                  <VerificationBadge status={data.candidate.verificationStatus} />
                  <ConfidenceBadge confidence={data.candidate.confidence} />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-faint">
                Level comes from score AND evidence kind — practical work and a defense round are
                required for advanced/expert. A self-reported claim is never a verified level.
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <ButtonLink href="/signup">
                Sign up to build verified evidence for this skill
              </ButtonLink>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] space-y-6 px-4 py-7 sm:px-7 lg:px-10">
        {/* Tracks this skill belongs to */}
        {data.tracks.length > 0 && (
          <section className="rounded-lg border border-line bg-paper p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
              <Layers size={15} className="text-ink" aria-hidden />
              Career tracks that use this skill
            </h2>
            <ul className="flex flex-wrap gap-2">
              {data.tracks.map((track) => (
                <li key={track.id}>
                  <Link
                    href={`/skills/${track.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-3 py-2 text-sm font-semibold text-graphite transition-colors hover:border-ink/40 hover:text-ink"
                  >
                    {track.name}
                    <ArrowRight size={13} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sub-skills */}
        {data.subSkills.length > 0 && (
          <section className="rounded-lg border border-line bg-paper p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
              <ClipboardList size={15} className="text-ink" aria-hidden />
              Sub-skills
            </h2>
            <p className="mb-5 text-xs text-muted">
              What this skill decomposes into — each can be assessed separately.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.subSkills.map((sub) => (
                <li key={sub.id} className="rounded-lg border border-line bg-paper-2/50 p-4">
                  <p className="text-sm font-semibold text-ink">{sub.name}</p>
                  {sub.description && (
                    <p className="mt-1 text-xs leading-relaxed text-muted">{sub.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Level progression */}
        <section className="rounded-lg border border-line bg-paper p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
            <Gauge size={15} className="text-ink" aria-hidden />
            Level progression
          </h2>
          <p className="mb-5 text-xs text-muted">
            Levels are earned with evidence, not courses. Higher levels require practical evidence
            (and a defense round for expert).
          </p>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {levelProgression.map((level) => (
              <li key={level.level} className="rounded-lg border border-line bg-paper-2/50 p-4">
                <p className="text-sm font-bold text-ink">{SKILL_LEVEL_LABELS[level.level]}</p>
                <p className="mt-1 text-xs text-graphite">Score ≥ {level.minScore}</p>
                <p className="mt-1 text-[11px] text-faint">
                  {level.requiresEvidence.length === 0
                    ? "Any evaluated evidence"
                    : level.requiresEvidence.length === 1
                      ? `Requires ${level.requiresEvidence[0].replace("_", " ")} evidence`
                      : `Requires ${level.requiresEvidence.join(" + ").replace(/_/g, " ")} evidence`}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Capability model */}
        {data.capabilities.length > 0 && (
          <section className="rounded-lg border border-line bg-paper p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
              <BrainCircuit size={15} className="text-ink" aria-hidden />
              How this skill is really measured
            </h2>
            <p className="mb-5 text-xs text-muted">
              Six capability dimensions — knowledge alone never determines job readiness.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.capabilities.map((cap) => (
                <li key={cap.id} className="rounded-lg border border-line bg-paper-2/50 p-4">
                  <Badge variant="blue" size="sm">
                    {CAPABILITY_LABELS[cap.dimension] ?? cap.dimension}
                  </Badge>
                  <p className="mt-2 text-sm font-semibold text-ink">{cap.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{cap.description}</p>
                  {cap.definition && typeof cap.definition.task === "string" && (
                    <p className="mt-2 rounded-lg bg-paper p-2.5 text-[11px] leading-relaxed text-graphite">
                      <strong className="font-semibold">Task:</strong> {cap.definition.task}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Learning resources */}
        <section className="rounded-lg border border-line bg-paper p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
            <BookOpen size={15} className="text-ink" aria-hidden />
            Learning resources
          </h2>
          <p className="mb-5 text-xs text-muted">
            Learning is preparation. It is never evidence of capability.
          </p>
          {resources.length === 0 ? (
            <EmptyState
              title="No curated resources yet"
              message="This is a placeholder for the learning library. More resources will be added."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {resources.map((resource) => (
                <li key={resource.id} className="rounded-lg border border-line bg-paper-2/50 p-4">
                  <p className="text-sm font-semibold text-ink">{resource.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {resource.provider ?? "Human Bridge"} · {resource.type ?? "Resource"}
                    {resource.duration ? ` · ${resource.duration}` : ""}
                  </p>
                  <Badge variant="outline" size="sm" className="mt-2 capitalize">
                    {resource.level === "not_evaluated" ? "beginner" : resource.level}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Assessment */}
        <section className="rounded-lg border border-line bg-paper p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
            <Award size={15} className="text-ink" aria-hidden />
            Assessment readiness
          </h2>
          <p className="mb-5 text-xs text-muted">
            {data.assessmentReadiness > 0
              ? "This skill is attached to at least one assessment blueprint."
              : "No assessment blueprint is attached yet. The skill can still receive evidence from projects and human verification."}
          </p>
          {data.assessments.length > 0 ? (
            <ul className="space-y-2">
              {data.assessments.map((assessment) => (
                <li
                  key={assessment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper-2/50 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{assessment.title}</p>
                    <p className="text-xs text-muted">
                      v{assessment.version} · {assessment.assessmentType.replace("_", " ")} ·{" "}
                      {assessment.difficulty}
                    </p>
                  </div>
                  <Link
                    href={`/assessments/${assessment.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline"
                  >
                    <CheckCircle2 size={14} aria-hidden />
                    View assessment
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-line p-4">
              <p className="text-sm text-muted">
                Practice and assessment content for this skill is coming next.
              </p>
              <ButtonLink href="/assessments" variant="secondary" size="sm">
                Explore current assessments
              </ButtonLink>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
