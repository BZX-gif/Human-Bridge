import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { buildMentorContext } from "@/lib/ai/mentor";
import { getEvaluationProvider } from "@/lib/ai";
import { MentorWorkspace, type MentorSummary } from "@/components/mentor/MentorWorkspace";
import { ErrorState } from "@/components/ui/States";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentor",
  description: "Context-aware career guidance grounded in your own plan and evidence.",
};

export default async function MentorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mentor");

  let summary: MentorSummary | null = null;
  try {
    const context = await buildMentorContext(user.id);
    const provider = getEvaluationProvider();
    summary = {
      firstName: context.userName,
      careerName: context.careerName,
      progress: context.roadmap?.progress ?? 0,
      currentFocus: context.roadmap?.currentMilestone?.title ?? null,
      verifiedSkills: context.verifiedSkills.length,
      gaps: context.gaps.slice(0, 4).map((gap) => ({
        name: gap.name,
        currentScore: gap.currentScore,
        requiredScore: gap.requiredScore,
      })),
      todaysTasks: context.todaysTasks,
      weeklyHours: context.weeklyHours,
      aiConfigured: Boolean(provider?.isConfigured()),
    };
  } catch (error) {
    console.error("[mentor] failed to load", error);
  }

  if (!summary) {
    return (
      <main id="main-content" className="app-page">
        <p className="eyebrow mb-3">Mentor</p>
        <h1 className="font-display text-[clamp(2rem,4vw,2.9rem)] leading-tight">
          The mentor is unavailable right now.
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
          Your plan and evidence are unaffected. You can still work from your roadmap and planner.
        </p>
        <div className="mt-6">
          <ErrorState message="Please retry in a moment." />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content">
      <MentorWorkspace summary={summary} />
    </main>
  );
}
