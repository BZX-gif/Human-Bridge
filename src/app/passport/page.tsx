import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Award, Info, Layers, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getPassportForUser } from "@/lib/services/passport-service";
import { PassportSkillList } from "@/components/passport/PassportSkillList";
import { PassportPrivacyControls } from "@/components/passport/PassportPrivacyControls";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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
      <header className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative h-[72px] w-[72px] shrink-0">
            <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90" role="img" aria-label={`${clamped}% role readiness`}>
              <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--color-paper-3)" strokeWidth="4" />
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[14px] font-medium tabular text-ink">
              {clamped}
            </span>
          </div>
          <div>
            <p className="eyebrow">Skill passport</p>
            <h1 className="mt-2 font-display text-[clamp(2rem,4.4vw,3rem)] leading-[1.02] tracking-[-0.02em]">
              {passport.ownerName}
            </h1>
            <p className="mt-1 text-[12.5px] text-muted">
              {passport.targetRole ? `Targeting ${passport.targetRole}` : "No target role selected"}
            </p>
            <p className="mt-1.5 text-[10.5px] text-faint">
              Readiness is computed only from verified evidence. A score is not a prediction of being hired.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/portfolio" variant="secondary" size="md">
            Portfolio
            <ArrowRight size={13} aria-hidden />
          </ButtonLink>
          <ButtonLink href="/assessments" size="md">
            Prove a skill
          </ButtonLink>
        </div>
      </header>

      <div className="mt-5 flex items-start gap-2 rounded-md border border-line bg-paper-2 px-3.5 py-2.5">
        <Info size={13} className="mt-0.5 shrink-0 text-muted" aria-hidden />
        <p className="text-[10.5px] leading-relaxed text-muted">{passport.evidenceDisclaimer}</p>
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-7">
          <section>
            <div className="flex items-end justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <ShieldCheck size={15} aria-hidden />
                Evidenced skills
              </h2>
              <span className="text-[10px] uppercase tracking-[0.12em] text-faint">
                {verified.length} verified · {passport.skills.length} total
              </span>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Expand any row to see the evidence behind the score. Self-reported work is labelled and
              does not add to a verified level.
            </p>
            <div className="mt-3">
              {passport.skills.length === 0 ? (
                <EmptyState
                  title="No skills evidenced yet"
                  message="Complete a work simulation or link a project to turn what you can do into evidence."
                  action={<ButtonLink href="/assessments" size="sm">Prove a skill</ButtonLink>}
                  icon={<ShieldCheck size={18} aria-hidden />}
                />
              ) : (
                <PassportSkillList skills={passport.skills} />
              )}
            </div>
          </section>

          {passport.gaps.length > 0 && (
            <section>
              <h2 className="text-[14px] font-semibold text-ink">Gap to {passport.targetRole}</h2>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                Required level against your verified score. Missing evidence is not failure; it is the
                next piece of work.
              </p>
              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
                {passport.gaps.map((gap) => (
                  <li key={gap.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${GAP_DOT[gap.status] ?? GAP_DOT.not_started}`} aria-hidden />
                      <span className="truncate text-[12px] text-graphite">{gap.name}</span>
                    </span>
                    <span className="shrink-0 text-[10.5px] tabular text-muted">
                      {gap.currentScore} / {gap.requiredScore} required
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/journey" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                Work on this in your roadmap
                <ArrowRight size={11} aria-hidden />
              </Link>
            </section>
          )}

          {passport.assessments.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <Award size={15} aria-hidden />
                Assessment history
              </h2>
              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-paper">
                {passport.assessments.map((assessment, index) => (
                  <li key={index} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-graphite">{assessment.title}</p>
                      <p className="mt-0.5 text-[10px] text-muted">
                        v{assessment.version} ·{" "}
                        {assessment.completedAt
                          ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
                              new Date(assessment.completedAt),
                            )
                          : "in progress"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {assessment.readinessScore !== null && (
                        <span className="text-[12px] font-medium tabular text-ink">{assessment.readinessScore}</span>
                      )}
                      <Badge size="sm" variant={assessment.passed ? "green" : "outline"}>
                        {assessment.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-lg border border-line bg-paper p-5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              <Layers size={11} aria-hidden />
              What this passport is
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              A record of evidence you can show. It is not a certificate, a guarantee or a
              replacement for an employer&apos;s own assessment.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
              <div>
                <p className="font-display text-[22px] leading-none tabular">{passport.assessments.length}</p>
                <p className="mt-1 text-[9.5px] text-faint">assessments</p>
              </div>
              <div>
                <p className="font-display text-[22px] leading-none tabular">{passport.skills.length}</p>
                <p className="mt-1 text-[9.5px] text-faint">skills recorded</p>
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
