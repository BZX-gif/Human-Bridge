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
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <Link href="/skills" className="text-xs font-semibold text-[#1a56ff] hover:underline">
            ← All skills
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">{data.name}</h1>
              <p className="mt-3 leading-relaxed text-slate-600">{data.description}</p>
              {data.whyEmployersWant && (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  <strong className="font-semibold text-slate-700">Why employers want it:</strong>{" "}
                  {data.whyEmployersWant}
                </p>
              )}
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#1a56ff]">
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
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold tabular-nums text-slate-900">
                    {data.candidate.score || "—"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Your measured evidence</p>
                    <p className="text-xs text-slate-500">
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
              <p className="mt-3 text-[11px] text-slate-400">
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

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {/* Tracks this skill belongs to */}
        {data.tracks.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <Layers size={15} className="text-[#1a56ff]" aria-hidden />
              Career tracks that use this skill
            </h2>
            <ul className="flex flex-wrap gap-2">
              {data.tracks.map((track) => (
                <li key={track.id}>
                  <Link
                    href={`/skills/${track.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[#1a56ff]/40 hover:text-[#1a56ff]"
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
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <ClipboardList size={15} className="text-[#1a56ff]" aria-hidden />
              Sub-skills
            </h2>
            <p className="mb-5 text-xs text-slate-500">
              What this skill decomposes into — each can be assessed separately.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.subSkills.map((sub) => (
                <li key={sub.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{sub.name}</p>
                  {sub.description && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{sub.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Level progression */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
            <Gauge size={15} className="text-[#1a56ff]" aria-hidden />
            Level progression
          </h2>
          <p className="mb-5 text-xs text-slate-500">
            Levels are earned with evidence, not courses. Higher levels require practical evidence
            (and a defense round for expert).
          </p>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {levelProgression.map((level) => (
              <li key={level.level} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-sm font-bold text-slate-900">{SKILL_LEVEL_LABELS[level.level]}</p>
                <p className="mt-1 text-xs text-slate-600">Score ≥ {level.minScore}</p>
                <p className="mt-1 text-[11px] text-slate-400">
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
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <BrainCircuit size={15} className="text-[#1a56ff]" aria-hidden />
              How this skill is really measured
            </h2>
            <p className="mb-5 text-xs text-slate-500">
              Six capability dimensions — knowledge alone never determines job readiness.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.capabilities.map((cap) => (
                <li key={cap.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <Badge variant="blue" size="sm">
                    {CAPABILITY_LABELS[cap.dimension] ?? cap.dimension}
                  </Badge>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{cap.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{cap.description}</p>
                  {cap.definition && typeof cap.definition.task === "string" && (
                    <p className="mt-2 rounded-lg bg-white p-2.5 text-[11px] leading-relaxed text-slate-600">
                      <strong className="font-semibold">Task:</strong> {cap.definition.task}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Learning resources */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
            <BookOpen size={15} className="text-[#1a56ff]" aria-hidden />
            Learning resources
          </h2>
          <p className="mb-5 text-xs text-slate-500">
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
                <li key={resource.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
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
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
            <Award size={15} className="text-[#1a56ff]" aria-hidden />
            Assessment readiness
          </h2>
          <p className="mb-5 text-xs text-slate-500">
            {data.assessmentReadiness > 0
              ? "This skill is attached to at least one assessment blueprint."
              : "No assessment blueprint is attached yet. The skill can still receive evidence from projects and human verification."}
          </p>
          {data.assessments.length > 0 ? (
            <ul className="space-y-2">
              {data.assessments.map((assessment) => (
                <li
                  key={assessment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{assessment.title}</p>
                    <p className="text-xs text-slate-500">
                      v{assessment.version} · {assessment.assessmentType.replace("_", " ")} ·{" "}
                      {assessment.difficulty}
                    </p>
                  </div>
                  <Link
                    href={`/assessments/${assessment.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a56ff] hover:underline"
                  >
                    <CheckCircle2 size={14} aria-hidden />
                    View assessment
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 p-4">
              <p className="text-sm text-slate-500">
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
