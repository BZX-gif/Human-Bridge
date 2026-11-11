import type { ReactNode } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Gauge,
  GraduationCap,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Panel, SectionHeader } from "@/components/ui/AppPage";
import { EmptyState } from "@/components/ui/States";
import {
  ConfidenceBadge,
  LevelBadge,
  VerificationBadge,
} from "@/components/assessment/EvidenceBadges";
import { DEFAULT_LEVEL_THRESHOLDS, SKILL_LEVEL_LABELS } from "@/lib/assessment/skill-level";
import type { SkillDetailView } from "@/lib/services/taxonomy-service";
import { formatSlug } from "@/lib/utils";

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
  signedIn = false,
}: {
  data: SkillDetailView;
  resources: LearningResourceView[];
  /** Whether a visitor is signed in. Decides what the "no evidence yet" action offers. */
  signedIn?: boolean;
}) {
  // Thresholds are stored highest first for resolution; a progression reads upward.
  const levelProgression = [...DEFAULT_LEVEL_THRESHOLDS].reverse();

  return (
    <main id="main-content" className="app-page">
      <Link href="/skills" className="hb-link animate-rise text-sm">
        <ChevronLeft size={15} strokeWidth={2.2} aria-hidden />
        All skills
      </Link>

      <section className="hb-tile hb-tile-white animate-rise mt-4 p-6 sm:p-9">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 max-w-2xl">
            {data.categoryName && <p className="eyebrow">{data.categoryName}</p>}
            <h1 className="display-md mt-2 text-ink">{data.name}</h1>
            <p className="mt-3 text-base leading-relaxed text-graphite">{data.description}</p>
          </div>
          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-link sm:flex">
            {data.skillType === "ai_fluency" ? (
              <Sparkles size={28} strokeWidth={1.6} aria-hidden />
            ) : (
              <GraduationCap size={28} strokeWidth={1.6} aria-hidden />
            )}
          </div>
        </div>

        {data.whyEmployersWant && (
          <p className="mt-5 max-w-2xl rounded-md bg-paper-2 px-4 py-3.5 text-md leading-relaxed text-graphite">
            <strong className="font-semibold text-ink">Why employers want it:</strong> {data.whyEmployersWant}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="blue">{formatSlug(data.skillType)}</Badge>
          <Badge variant="outline" className="capitalize">
            {data.difficulty}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {data.importance}
          </Badge>
          <Badge variant="outline" className="capitalize">
            market: {data.marketRelevance.replace("_", " ")}
          </Badge>
        </div>

        {data.candidate ? (
          <div className="mt-8 rounded-lg bg-paper-2 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="tabular text-6xl font-semibold leading-none tracking-[-0.03em] text-ink">
                  {data.candidate.score || "—"}
                </span>
                <div>
                  <p className="text-base font-semibold text-ink">Your measured evidence</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {data.candidate.evidenceCount} evidence · {data.candidate.assessmentCount} assessed
                    {data.candidate.lastAssessedAt
                      ? ` · last assessed ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(data.candidate.lastAssessedAt))}`
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
            <p className="mt-4 text-xs leading-relaxed text-muted">
              Level comes from score AND evidence kind — practical work and a defense round are
              required for advanced/expert. A self-reported claim is never a verified level.
            </p>
          </div>
        ) : signedIn ? (
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <ButtonLink href="/assessments" size="lg">
              Build verified evidence for this skill
            </ButtonLink>
            <p className="text-sm text-muted">No evidence recorded for this skill yet.</p>
          </div>
        ) : (
          <div className="mt-8">
            <ButtonLink href="/signup" size="lg">
              Sign up to build verified evidence for this skill
            </ButtonLink>
          </div>
        )}
      </section>

      <div className="mt-4 space-y-4 sm:mt-5 lg:space-y-5">
        {/* Tracks this skill belongs to */}
        {data.tracks.length > 0 && (
          <Panel>
            <SectionHeader title={<SectionTitle icon={Layers}>Career tracks that use this skill</SectionTitle>} />
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {data.tracks.map((track) => (
                <li key={track.id}>
                  <Link
                    href={`/skills/${track.slug}`}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-paper-2 pl-4 pr-3 text-md font-medium text-ink transition-[background-color,color] duration-200 ease-apple hover:bg-accent-soft hover:text-link"
                  >
                    {track.name}
                    <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* Sub-skills */}
        {data.subSkills.length > 0 && (
          <Panel>
            <SectionHeader
              title={<SectionTitle icon={ClipboardList}>Sub-skills</SectionTitle>}
              description="What this skill decomposes into — each can be assessed separately."
            />
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.subSkills.map((sub) => (
                <li key={sub.id} className="rounded-md bg-paper-2 p-5">
                  <p className="text-base font-semibold text-ink">{sub.name}</p>
                  {sub.description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{sub.description}</p>}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* Level progression */}
        <Panel>
          <SectionHeader
            title={<SectionTitle icon={Gauge}>Level progression</SectionTitle>}
            description="Levels are earned with evidence, not courses. Higher levels require practical evidence (and a defense round for expert)."
          />
          <ol className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {levelProgression.map((level) => (
              <li key={level.level} className="rounded-md bg-paper-2 p-5">
                <p className="text-base font-semibold text-ink">{SKILL_LEVEL_LABELS[level.level]}</p>
                <p className="tabular mt-1 text-sm font-medium text-link">Score {level.minScore} or higher</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {level.requiresEvidence.length === 0
                    ? "Any evaluated evidence"
                    : level.requiresEvidence.length === 1
                      ? `Requires ${level.requiresEvidence[0].replace("_", " ")} evidence`
                      : `Requires ${level.requiresEvidence.join(" + ").replace(/_/g, " ")} evidence`}
                </p>
              </li>
            ))}
          </ol>
        </Panel>

        {/* Capability model */}
        {data.capabilities.length > 0 && (
          <Panel>
            <SectionHeader
              title={<SectionTitle icon={BrainCircuit}>How this skill is really measured</SectionTitle>}
              description="Six capability dimensions — knowledge alone never determines job readiness."
            />
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {data.capabilities.map((cap) => (
                <li key={cap.id} className="rounded-md bg-paper-2 p-5">
                  <Badge variant="blue" size="sm">
                    {CAPABILITY_LABELS[cap.dimension] ?? cap.dimension}
                  </Badge>
                  <p className="mt-3 text-base font-semibold text-ink">{cap.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{cap.description}</p>
                  {cap.definition && typeof cap.definition.task === "string" && (
                    <p className="mt-3 rounded-sm bg-paper px-3.5 py-3 text-sm leading-relaxed text-graphite shadow-xs">
                      <strong className="font-semibold text-ink">Task:</strong> {cap.definition.task}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* Learning resources */}
        <Panel>
          <SectionHeader
            title={<SectionTitle icon={BookOpen}>Learning resources</SectionTitle>}
            description="Learning is preparation. It is never evidence of capability."
          />
          {resources.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="No curated resources yet"
                message="This is a placeholder for the learning library. More resources will be added."
              />
            </div>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {resources.map((resource) => (
                <li key={resource.id} className="rounded-md bg-paper-2 p-5">
                  <p className="text-base font-semibold text-ink">{resource.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {resource.provider ?? "Human Bridge"} · {resource.type ?? "Resource"}
                    {resource.duration ? ` · ${resource.duration}` : ""}
                  </p>
                  <Badge variant="outline" size="sm" className="mt-3 capitalize">
                    {resource.level === "not_evaluated" ? "beginner" : resource.level}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Assessment */}
        <Panel>
          <SectionHeader
            title={<SectionTitle icon={Award}>Assessment readiness</SectionTitle>}
            description={
              data.assessmentReadiness > 0
                ? "This skill is attached to at least one assessment blueprint."
                : "No assessment blueprint is attached yet. The skill can still receive evidence from projects and human verification."
            }
          />
          {data.assessments.length > 0 ? (
            <ul className="mt-5 space-y-2.5">
              {data.assessments.map((assessment) => (
                <li
                  key={assessment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-paper-2 p-5"
                >
                  <div>
                    <p className="text-base font-semibold text-ink">{assessment.title}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      v{assessment.version} · {formatSlug(assessment.assessmentType)} · {formatSlug(assessment.difficulty)}
                    </p>
                  </div>
                  <Link href={`/assessments/${assessment.slug}`} className="hb-link text-md">
                    View assessment
                    <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md bg-paper-2 p-5">
              <p className="text-md text-muted">Practice and assessment content for this skill is coming next.</p>
              <ButtonLink href="/assessments" variant="secondary" size="sm" className="bg-paper hover:bg-paper-3">
                Explore current assessments
              </ButtonLink>
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <Icon size={20} strokeWidth={1.8} className="shrink-0 text-link" aria-hidden />
      {children}
    </span>
  );
}
