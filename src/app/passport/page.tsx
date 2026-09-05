import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Award, Info, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getPassportForUser } from "@/lib/services/passport-service";
import { PassportSkillList } from "@/components/passport/PassportSkillList";
import { PassportPrivacyControls } from "@/components/passport/PassportPrivacyControls";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Skill Passport — Human Bridge",
  description: "Your verified skills, the evidence behind them, and how ready you are for your target role.",
};

export default async function PassportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/passport");

  const passport = await getPassportForUser(user.id);
  const verified = passport.skills.filter((s) => s.verificationStatus !== "self_reported");

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#1a56ff]">
            Skill Passport
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {passport.ownerName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {passport.targetRole ? `Targeting ${passport.targetRole}` : "No target role selected"}
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Readiness
              </p>
              <p className="mt-1 text-4xl font-black tabular-nums text-slate-900">
                {passport.readiness}
                <span className="text-xl font-bold text-slate-300"> / 100</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Verified skills
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-700">
                {verified.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Assessments
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-700">
                {passport.assessments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <Info size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
          <p className="text-xs leading-relaxed text-slate-600">
            {passport.evidenceDisclaimer}
          </p>
        </div>

        {/* Skills */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <ShieldCheck size={18} className="text-[#1a56ff]" aria-hidden />
            Skills
          </h2>
          {passport.skills.length === 0 ? (
            <EmptyState
              title="No skills evidenced yet"
              message="Complete a work simulation to turn what you can do into evidence on your passport."
              action={<ButtonLink href="/assessments">Prove a skill</ButtonLink>}
            />
          ) : (
            <PassportSkillList skills={passport.skills} />
          )}
        </section>

        {/* Gaps */}
        {passport.gaps.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
              Gap to {passport.targetRole}
            </h2>
            <ul className="space-y-2.5">
              {passport.gaps.map((gap) => (
                <li key={gap.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <GapDot status={gap.status} />
                    <span className="text-slate-700">{gap.name}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-slate-500">
                    {gap.currentScore} / {gap.requiredScore} required
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Assessments */}
        {passport.assessments.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <Award size={15} className="text-[#1a56ff]" aria-hidden />
              Assessment history
            </h2>
            <ul className="divide-y divide-slate-100">
              {passport.assessments.map((a, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-500">
                      v{a.version} ·{" "}
                      {a.completedAt
                        ? new Date(a.completedAt).toLocaleDateString()
                        : "in progress"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.readinessScore !== null && (
                      <span className="text-sm font-bold tabular-nums text-slate-900">
                        {a.readinessScore}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        a.passed
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Privacy */}
        <PassportPrivacyControls
          publicId={passport.publicId}
          isPublic={passport.isPublic}
          visibility={passport.visibility}
        />
      </div>
    </main>
  );
}

function GapDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ready: "bg-green-500",
    needs_improvement: "bg-amber-500",
    major_gap: "bg-red-500",
    not_started: "bg-slate-300",
  };
  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${colors[status] ?? colors.not_started}`}
      aria-label={status.replace(/_/g, " ")}
    />
  );
}
