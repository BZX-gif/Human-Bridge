import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Award, ChevronRight, Info, Layers, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getPassportForUser } from "@/lib/services/passport-service";
import { PassportSkillList } from "@/components/passport/PassportSkillList";
import { PassportPrivacyControls } from "@/components/passport/PassportPrivacyControls";
import { Panel, SectionHeader } from "@/components/ui/AppPage";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skill passport",
  description: "Your verified skills, the evidence behind them, and how ready you are for your target role.",
};

const GAP_DOT: Record<string, string> = {
  ready: "bg-moss",
  needs_improvement: "bg-ochre",
  major_gap: "bg-rust",
  not_started: "bg-line-strong",
};

export default async function PassportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/passport");

  const passport = await getPassportForUser(user.id);
  const verified = passport.skills.filter((skill) => skill.verificationStatus !== "self_reported");
  const clamped = Math.min(100, Math.max(0, passport.readiness));
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <main id="main-content" className="app-page">
      <section className="hb-tile hb-tile-white animate-rise p-6 sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-5 sm:gap-6">
            <div className="relative h-[84px] w-[84px] shrink-0">
              <svg viewBox="0 0 72 72" className="h-[84px] w-[84px] -rotate-90" role="img" aria-label={`${clamped}% role readiness`}>
                <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--color-paper-3)" strokeWidth="5" />
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                />
              </svg>
              <span className="tabular absolute inset-0 flex items-center justify-center text-2xl font-semibold tracking-[-0.02em] text-ink">
                {clamped}
              </span>
            </div>
            <div className="min-w-0">
              <p className="eyebrow">Skill passport</p>
              <h1 className="display-md mt-2 text-ink">{passport.ownerName}</h1>
              <p className="mt-2 text-base text-graphite">
                {passport.targetRole ? `Targeting ${passport.targetRole}` : "No target role selected"}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                Readiness is computed only from verified evidence. A score is not a prediction of being hired.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <ButtonLink href="/portfolio" variant="secondary" size="md">
              Portfolio
            </ButtonLink>
            <ButtonLink href="/assessments" size="md">
              Prove a skill
            </ButtonLink>
          </div>
        </div>

        <div className="mt-7 flex items-start gap-2.5 rounded-md bg-paper-2 px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-link" aria-hidden />
          <p className="text-sm leading-relaxed text-graphite">{passport.evidenceDisclaimer}</p>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          <Panel>
            <SectionHeader
              title={
                <span className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-moss" aria-hidden />
                  Evidenced skills
                </span>
              }
              description="Expand any row to see the evidence behind the score. Self-reported work is labelled and does not add to a verified level."
              action={
                <span className="tabular text-sm text-muted">
                  {verified.length} verified · {passport.skills.length} total
                </span>
              }
            />
            <div className="mt-5">
              {passport.skills.length === 0 ? (
                <EmptyState
                  title="No skills evidenced yet"
                  message="Complete a work simulation or link a project to turn what you can do into evidence."
                  action={<ButtonLink href="/assessments" size="md">Prove a skill</ButtonLink>}
                  icon={<ShieldCheck size={20} aria-hidden />}
                />
              ) : (
                <PassportSkillList skills={passport.skills} />
              )}
            </div>
          </Panel>

          {passport.gaps.length > 0 && (
            <Panel>
              <SectionHeader
                title={`Gap to ${passport.targetRole}`}
                description="Required level against your verified score. Missing evidence is not failure; it is the next piece of work."
              />
              <ul className="mt-4 divide-y divide-line">
                {passport.gaps.map((gap) => (
                  <li key={gap.name} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${GAP_DOT[gap.status] ?? GAP_DOT.not_started}`} aria-hidden />
                      <span className="truncate text-md text-ink">{gap.name}</span>
                    </span>
                    <span className="tabular shrink-0 text-sm text-muted">
                      {gap.currentScore} / {gap.requiredScore} required
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/journey" className="hb-link mt-4 text-sm">
                Work on this in your roadmap
                <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
              </Link>
            </Panel>
          )}

          {passport.assessments.length > 0 && (
            <Panel>
              <SectionHeader
                title={
                  <span className="flex items-center gap-2">
                    <Award size={20} className="text-link" aria-hidden />
                    Assessment history
                  </span>
                }
              />
              <ul className="mt-3 divide-y divide-line">
                {passport.assessments.map((assessment, index) => (
                  <li key={index} className="flex flex-wrap items-center justify-between gap-2 py-3.5 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-md font-medium text-ink">{assessment.title}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        v{assessment.version} ·{" "}
                        {assessment.completedAt
                          ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
                              new Date(assessment.completedAt),
                            )
                          : "in progress"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {assessment.readinessScore !== null && (
                        <span className="tabular text-base font-semibold text-ink">{assessment.readinessScore}</span>
                      )}
                      <Badge size="sm" variant={assessment.passed ? "green" : "outline"}>
                        {formatSlug(assessment.status)}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[76px] lg:space-y-5 lg:self-start">
          <div className="hb-card p-6">
            <p className="flex items-center gap-2 text-base font-semibold text-ink">
              <Layers size={16} aria-hidden />
              What this passport is
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A record of evidence you can show. It is not a certificate, a guarantee or a
              replacement for an employer&apos;s own assessment.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5">
              <div>
                <p className="stat-value">{passport.assessments.length}</p>
                <p className="mt-1.5 text-xs text-muted">assessments</p>
              </div>
              <div>
                <p className="stat-value">{passport.skills.length}</p>
                <p className="mt-1.5 text-xs text-muted">skills recorded</p>
              </div>
            </div>
          </div>

          <PassportPrivacyControls
            publicId={passport.publicId}
            isPublic={passport.isPublic}
            visibility={passport.visibility}
          />
        </aside>
      </div>
    </main>
  );
}
