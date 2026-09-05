import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Briefcase, Target, TrendingUp } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { careers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { getCareerGapForUser, getLearningPath } from "@/lib/services/career-service";
import { listJobsWithMatch, listUserApplications } from "@/lib/services/job-service";
import { getPassportForUser } from "@/lib/services/passport-service";
import { getUserSkills } from "@/lib/services/skill-service";
import { listUserAttempts } from "@/lib/services/assessment-service";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard — Human Bridge" };

export default async function DashboardPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login?next=/dashboard");
  if (sessionUser.role === "employer") redirect("/employers/dashboard");

  const db = await getDb();
  const [record] = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);

  if (!record?.onboardingComplete) redirect("/onboarding");

  const passport = await getPassportForUser(sessionUser.id);
  const userSkills = await getUserSkills(sessionUser.id);
  const applications = await listUserApplications(sessionUser.id);
  const attempts = await listUserAttempts(sessionUser.id);

  let targetCareer = null;
  let gaps: Awaited<ReturnType<typeof getCareerGapForUser>> = [];
  let learning: Awaited<ReturnType<typeof getLearningPath>> = [];
  if (record.targetCareerId) {
    const [career] = await db
      .select()
      .from(careers)
      .where(eq(careers.id, record.targetCareerId))
      .limit(1);
    targetCareer = career ?? null;
    gaps = await getCareerGapForUser(record.targetCareerId, sessionUser.id);
    learning = await getLearningPath(record.targetCareerId, sessionUser.id);
  }

  const jobs = await listJobsWithMatch(sessionUser.id);
  const recommended = jobs.filter((j) => (j.match?.score ?? 0) >= 40).slice(0, 4);
  const openGaps = gaps.filter((g) => g.status !== "ready");
  const verifiedCount = userSkills.filter(
    (s) => s.verificationStatus !== "self_reported" && s.score > 0,
  ).length;
  const inProgress = attempts.find((a) =>
    ["in_progress", "defense", "submitted"].includes(a.attempt.status),
  );

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="text-sm text-slate-500">{greeting()}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {sessionUser.name.split(" ")[0]}
          </h1>
          {targetCareer && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
              <Target size={14} className="text-[#1a56ff]" aria-hidden />
              Working toward <strong className="font-semibold">{targetCareer.name}</strong>
            </p>
          )}
        </header>

        {/* Primary CTA */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#1a56ff]">
                Continue your path
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">{nextStep(verifiedCount, inProgress !== undefined, openGaps.length)}</p>
            </div>
            <ButtonLink
              href={
                inProgress
                  ? inProgress.attempt.status === "in_progress"
                    ? `/assessments/${inProgress.blueprint.slug}/workspace`
                    : `/assessments/attempt/${inProgress.attempt.id}/defense`
                  : "/assessments"
              }
            >
              {inProgress ? "Resume assessment" : "Prove a skill"}
              <ArrowRight size={15} aria-hidden />
            </ButtonLink>
          </div>
        </section>

        {/* Metrics */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Metric label="Readiness" value={`${passport.readiness}%`} />
          <Metric label="Verified skills" value={verifiedCount} />
          <Metric label="Skill gaps" value={openGaps.length} />
          <Metric label="Matching jobs" value={recommended.length} />
          <Metric label="Applications" value={applications.length} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Skill gaps */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <TrendingUp size={15} className="text-[#1a56ff]" aria-hidden />
              Your skill gap
            </h2>
            {gaps.length === 0 ? (
              <EmptyState
                title="No target role selected"
                message="Choose a career to see exactly which skills you need."
                action={<ButtonLink href="/careers" size="sm">Explore careers</ButtonLink>}
              />
            ) : (
              <ul className="space-y-3">
                {gaps.slice(0, 6).map((gap) => (
                  <li key={gap.slug}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        <GapDot status={gap.status} />
                        <span className="font-medium text-slate-800">{gap.name}</span>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">
                          {gap.importance}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-slate-500">
                        {gap.currentScore} / {gap.requiredScore}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${gapColor(gap.status)}`}
                        style={{
                          width: `${Math.min(100, (gap.currentScore / Math.max(1, gap.requiredScore)) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Learning */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <BookOpen size={15} className="text-[#1a56ff]" aria-hidden />
              Recommended learning
            </h2>
            {learning.length === 0 ? (
              <p className="text-sm text-slate-500">
                No gaps to close right now. Take an assessment to get a sharper picture.
              </p>
            ) : (
              <ul className="space-y-3">
                {learning.slice(0, 4).map((item) => (
                  <li key={item.skillSlug} className="rounded-xl bg-slate-50 p-3.5">
                    <p className="text-sm font-semibold text-slate-900">{item.skillName}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {item.whatToLearn}
                    </p>
                    {item.resources.length > 0 && (
                      <p className="mt-2 text-[11px] text-slate-400">
                        {item.resources.length} resource
                        {item.resources.length === 1 ? "" : "s"} available
                        {item.resources.some((r) => r.isDemo) && " (demo catalogue)"}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Jobs */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <Briefcase size={15} className="text-[#1a56ff]" aria-hidden />
              Jobs matching your evidence
            </h2>
            <Link href="/jobs" className="text-xs font-semibold text-[#1a56ff] hover:underline">
              View all
            </Link>
          </div>
          {recommended.length === 0 ? (
            <p className="text-sm text-slate-500">
              No strong matches yet. Matching improves as you build verified evidence.
            </p>
          ) : (
            <ul className="space-y-2">
              {recommended.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3.5 transition-colors hover:border-slate-300"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{job.title}</p>
                      <p className="text-xs text-slate-500">
                        {job.companyName} · {job.location}
                        {job.isDemo && (
                          <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            DEMO
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                        job.match?.eligible
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {job.match?.score ?? 0}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function GapDot({ status }: { status: string }) {
  return <span className={`h-2 w-2 shrink-0 rounded-full ${gapColor(status)}`} aria-hidden />;
}

function gapColor(status: string): string {
  const colors: Record<string, string> = {
    ready: "bg-green-500",
    needs_improvement: "bg-amber-500",
    major_gap: "bg-red-500",
    not_started: "bg-slate-300",
  };
  return colors[status] ?? colors.not_started;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function nextStep(verified: number, hasInProgress: boolean, gapCount: number): string {
  if (hasInProgress) return "You have an assessment in progress";
  if (verified === 0) return "Prove your first skill with a work simulation";
  if (gapCount > 0) return `Close ${gapCount} skill gap${gapCount === 1 ? "" : "s"} to reach your target role`;
  return "Apply to jobs that match your verified evidence";
}
