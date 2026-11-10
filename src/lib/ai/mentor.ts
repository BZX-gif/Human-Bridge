import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { careers, plannerTasks, users } from "@/db/schema";
import { getEvaluationProvider } from "@/lib/ai";
import { getCareerGapForUser } from "@/lib/services/career-service";
import { getRoadmapForUser } from "@/lib/services/roadmap-service";
import { getPortfolioForUser, listProjectCatalogue } from "@/lib/services/portfolio-service";
import { getUserSkills } from "@/lib/services/skill-service";
import { addDays, endOfDay, startOfDay } from "@/lib/services/planner-service";

export const MENTOR_DISCLAIMER =
  "Guidance is generated from your own recorded plan and evidence. Effort estimates are approximate, and no outcome is guaranteed.";

export interface MentorContext {
  userName: string;
  careerName: string | null;
  careerSlug: string | null;
  weeklyHours: number;
  currentLevel: string;
  roadmap: Awaited<ReturnType<typeof getRoadmapForUser>>;
  verifiedSkills: { name: string; score: number; status: string }[];
  gaps: { name: string; currentScore: number; requiredScore: number; importance: string }[];
  projects: { title: string; status: string; skills: string[] }[];
  todaysTasks: { title: string; status: string; minutes: number }[];
  catalogue: { title: string; skills: string[]; difficulty: string | null }[];
}

export async function buildMentorContext(userId: number): Promise<MentorContext> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  let careerName: string | null = null;
  let careerSlug: string | null = null;
  let gaps: MentorContext["gaps"] = [];
  if (user?.targetCareerId) {
    const [career] = await db
      .select({ name: careers.name, slug: careers.slug })
      .from(careers)
      .where(eq(careers.id, user.targetCareerId))
      .limit(1);
    careerName = career?.name ?? null;
    careerSlug = career?.slug ?? null;
    gaps = (await getCareerGapForUser(user.targetCareerId, userId))
      .filter((gap) => gap.status !== "ready")
      .slice(0, 6)
      .map((gap) => ({
        name: gap.name,
        currentScore: gap.currentScore,
        requiredScore: gap.requiredScore,
        importance: gap.importance,
      }));
  }

  const [skills, roadmap, portfolio, catalogue, taskRows] = await Promise.all([
    getUserSkills(userId),
    getRoadmapForUser(userId),
    getPortfolioForUser(userId),
    listProjectCatalogue(user?.targetCareerId ?? undefined),
    db
      .select()
      .from(plannerTasks)
      .where(eq(plannerTasks.userId, userId)),
  ]);

  const now = new Date();
  const todaysTasks = taskRows
    .filter(
      (task) =>
        task.scheduledFor &&
        task.scheduledFor >= startOfDay(now) &&
        task.scheduledFor <= endOfDay(addDays(now, 1)),
    )
    .sort((a, b) => (a.scheduledFor && b.scheduledFor ? a.scheduledFor.getTime() - b.scheduledFor.getTime() : 0))
    .slice(0, 8)
    .map((task) => ({ title: task.title, status: task.status, minutes: task.estimatedMinutes }));

  return {
    userName: user?.name.split(" ")[0] ?? "there",
    careerName,
    careerSlug,
    weeklyHours: user?.weeklyHours ?? 5,
    currentLevel: user?.currentLevel ?? "beginner",
    roadmap,
    verifiedSkills: skills
      .filter((skill) => skill.score > 0)
      .slice(0, 10)
      .map((skill) => ({
        name: skill.name,
        score: skill.score,
        status: skill.verificationStatus,
      })),
    gaps,
    projects: portfolio.projects.map((project) => ({
      title: project.title,
      status: project.status,
      skills: project.skillSlugs,
    })),
    todaysTasks,
    catalogue: catalogue.slice(0, 8).map((project) => ({
      title: project.title,
      skills: project.skillSlugs,
      difficulty: project.difficulty,
    })),
  };
}

export function formatMentorContext(context: MentorContext): string {
  const roadmap = context.roadmap;
  const current = roadmap?.currentMilestone;
  return [
    `User: ${context.userName}`,
    `Target career: ${context.careerName ?? "not chosen"}`,
    `Stated availability: ${context.weeklyHours} hours/week`,
    `Self-described starting level: ${context.currentLevel}`,
    roadmap
      ? `Roadmap: ${roadmap.progress}% complete (${roadmap.completedMilestones}/${roadmap.totalMilestones} milestones). Current milestone: ${current?.title ?? "none"}. Next milestone: ${roadmap.stages.flatMap((s) => s.milestones).find((m) => m.status !== "completed" && m.status !== "skipped")?.title ?? "none"}.`
      : "Roadmap: not created yet.",
    `Verified skills: ${
      context.verifiedSkills.length === 0
        ? "none yet — do not imply any exist"
        : context.verifiedSkills.map((s) => `${s.name} ${s.score}/100 (${s.status})`).join("; ")
    }`,
    `Skill gaps: ${
      context.gaps.length === 0
        ? "none recorded"
        : context.gaps
            .map((g) => `${g.name} ${g.currentScore}/${g.requiredScore} (${g.importance})`)
            .join("; ")
    }`,
    `Portfolio projects: ${
      context.projects.length === 0
        ? "none"
        : context.projects.map((p) => `${p.title} (${p.status})`).join("; ")
    }`,
    `Today's tasks: ${
      context.todaysTasks.length === 0
        ? "none scheduled"
        : context.todaysTasks.map((t) => `${t.title} (${t.status}, ${t.minutes}m)`).join("; ")
    }`,
    `Catalogue projects the user could take on: ${
      context.catalogue.length === 0
        ? "none in the catalogue for this career"
        : context.catalogue.map((p) => `${p.title} [${p.skills.join(", ")}]`).join("; ")
    }`,
  ].join("\n");
}

export const MENTOR_SYSTEM_PROMPT = `You are the Human Bridge Career Mentor. You help a person turn an ambition into a realistic plan.

You are grounded in the user's real context. Follow these rules without exception:
- Use only the figures in the supplied context. Never invent scores, assessments, certificates, resources, employers, vacancies or salaries.
- Never guarantee a job, interview, salary, promotion or employer interest. Never promise outcomes.
- Effort estimates are estimates. Say so when you use one.
- Recommend only resources that appear in the context. If none exist, say no curated resource is recorded and suggest practice instead.
- Do not describe a skill as verified. Only assessment or employer evidence counts as verified; reference the stated evidence status.
- Be concise, direct and practical. Prefer a specific next action over encouragement.
- If the user is overwhelmed, reduce the plan to one action they can do today.
- Respect their stated availability. Never invent workloads that ignore their hours.
- You are not a therapist, lawyer or financial adviser. For medical, legal or financial distress, suggest appropriate professional support.
- If the user asks something outside career development, answer briefly and redirect to what the product can support.
- Write in plain text with short paragraphs and, where useful, a short list. No markdown tables.`;

/**
 * Deterministic fallback. This is not dressed up as AI: the UI labels it as a
 * guided response. It is still genuinely useful because every line comes from
 * the user's actual plan.
 */
export function guidedReply(message: string, context: MentorContext): string {
  const text = message.toLowerCase();
  const current =
    context.roadmap?.currentMilestone ??
    context.roadmap?.stages.flatMap((stage) => stage.milestones).find(
      (milestone) => milestone.status !== "completed" && milestone.status !== "skipped",
    ) ??
    null;

  const asksAbout = (...terms: string[]) => terms.some((term) => text.includes(term));

  if (asksAbout("guarantee", "salary", "job offer", "get hired", "placement")) {
    return [
      `I will not promise an outcome, ${context.userName} — not a job, an interview or a salary. No honest platform can.`,
      "",
      context.careerName
        ? `What I can tell you is where your evidence stands against ${context.careerName}: ${
            context.verifiedSkills.length === 0
              ? "you have no verified skill evidence recorded yet."
              : `${context.verifiedSkills.length} skill${context.verifiedSkills.length === 1 ? "" : "s"} have evidence recorded.`
          } ${context.gaps.length > 0 ? `The largest recorded gaps are ${context.gaps.slice(0, 3).map((gap) => gap.name).join(", ")}.` : ""}`
        : "You have not chosen a target career yet. Choose one and I can make the gap concrete.",
      "",
      "The practical next move is to make your evidence stronger: finish current milestones, complete a real project and, where available, take an assessment. Applications work better after that.",
    ].join("\n");
  }

  if (asksAbout("roadmap", "next step", "start", "where do i", "what should i do", "plan")) {
    if (!context.careerName) {
      return [
        "You have not chosen a target career, so any plan would be generic.",
        "",
        "Open Explore Careers and choose one role that genuinely interests you. Human Bridge will build a roadmap from that role's real skill requirements, then you can adjust the weekly hours.",
      ].join("\n");
    }
    if (!current) {
      return [
        `Your roadmap for ${context.careerName} is fully complete at milestone level. That is a good moment to review the evidence rather than add more study.`,
        "",
        "Open your portfolio and check that every project has a short explanation, a link and an honest reflection. Then review the Opportunities section for roles that match your recorded evidence.",
      ].join("\n");
    }
    return [
      `Your next milestone is “${current.title}”.`,
      "",
      current.whyItMatters ?? current.objective,
      "",
      `Estimated effort: about ${current.estimatedHours} hour${current.estimatedHours === 1 ? "" : "s"}. That is an estimate, not a deadline.`,
      "",
      "Do this next:",
      ...current.exercises.slice(0, 3).map((exercise, index) => `${index + 1}. ${exercise}`),
      "",
      "Use “Add to planner” on the milestone and Human Bridge will spread the work across your available hours instead of creating a backlog.",
    ].join("\n");
  }

  if (asksAbout("skill", "gap", "learn", "study")) {
    if (context.gaps.length === 0) {
      return [
        "There are no recorded skill gaps against your target role right now.",
        "",
        "That usually means one of two things: your evidence is strong, or you have not assessed the required skills yet. Check your Skills page — claimed skills are not the same as demonstrated ones.",
      ].join("\n");
    }
    return [
      `Against ${context.careerName}, these are your largest recorded gaps:`,
      "",
      ...context.gaps
        .slice(0, 5)
        .map(
          (gap) =>
            `• ${gap.name}: ${gap.currentScore}/${gap.requiredScore} required (${gap.importance}).`,
        ),
      "",
      "Start with the essential skill that blocks the most later milestones. Your roadmap already orders them; follow the current stage rather than studying five things at once.",
    ].join("\n");
  }

  if (asksAbout("project", "portfolio", "evidence", "show my work")) {
    const nextProject = context.catalogue.find(
      (project) => !context.projects.some((existing) => existing.title === project.title),
    );
    return [
      context.projects.length === 0
        ? "Your portfolio has no projects yet. Without evidence, a roadmap is only a plan."
        : `You have ${context.projects.length} project${context.projects.length === 1 ? "" : "s"} in your portfolio. The useful question is whether each one proves the skills your target role requires.`,
      "",
      nextProject
        ? `A catalogue project worth considering: “${nextProject.title}” — it exercises ${nextProject.skills.slice(0, 4).join(", ")}.`
        : "No new catalogue project matches this career right now. Build a small project of your own around one gap skill.",
      "",
      "For every project, record four things: the problem, your approach, the result, and what you would do differently. That reflection is what makes the work credible.",
    ].join("\n");
  }

  if (asksAbout("interview", "cv", "resume", "apply", "application")) {
    return [
      "Prepare evidence, not adjectives.",
      "",
      "1. Choose two projects and write a three-minute walkthrough of each.",
      "2. For each, prepare answers to: what was hardest, what failed, what you would change.",
      "3. Rewrite your CV so every bullet describes something you can show.",
      "4. Tailor applications to roles that match at least 60% of your recorded evidence.",
      "",
      "No application volume compensates for weak evidence. You can rehearse with me here, but I will not invent interview questions that claim to be from a real employer.",
    ].join("\n");
  }

  if (asksAbout("task", "today", "week", "time", "busy", "overwhelmed")) {
    return [
      context.todaysTasks.length === 0
        ? "You have nothing scheduled for today. That is either intentional rest or an empty plan."
        : `Today's plan has ${context.todaysTasks.length} item${context.todaysTasks.length === 1 ? "" : "s"}: ${context.todaysTasks.map((task) => task.title).join("; ")}.`,
      "",
      `You told Human Bridge you have about ${context.weeklyHours} hours per week. If the plan is heavier than that, reduce it rather than abandoning it. One focused 45-minute session is a real session.`,
      "",
      "If you are behind, use “Move overdue to today” in the planner. Rescheduling is not failure; pretending is.",
    ].join("\n");
  }

  return [
    context.careerName
      ? `Here is where you actually are, ${context.userName}: ${context.roadmap?.progress ?? 0}% through your ${context.careerName} roadmap, with ${context.verifiedSkills.length} skill${context.verifiedSkills.length === 1 ? "" : "s"} backed by evidence.`
      : `You have not chosen a target career yet, ${context.userName}. That is the first decision the rest of the system depends on.`,
    "",
    current
      ? `Current focus: “${current.title}” — about ${current.estimatedHours} hours estimated.`
      : "There is no current milestone to focus on.",
    context.gaps.length > 0
      ? `Largest recorded gap: ${context.gaps[0].name} at ${context.gaps[0].currentScore}/${context.gaps[0].requiredScore}.`
      : "",
    "",
    "You can ask me about your next step, a skill gap, projects, interview preparation or how to fit the plan into your week.",
  ]
    .filter(Boolean)
    .join("\n");
}

export interface MentorReply {
  reply: string;
  mode: "ai" | "guided";
  provider: string | null;
  disclaimer: string;
  notices: string[];
}

/**
 * Ask the mentor. AI is attempted only when configured; any provider failure
 * falls back to the guided response rather than breaking the page.
 */
export async function askMentor(
  userId: number,
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
): Promise<MentorReply> {
  const context = await buildMentorContext(userId);
  const provider = getEvaluationProvider();
  const notices: string[] = [];

  if (!provider) {
    return {
      reply: guidedReply(message, context),
      mode: "guided",
      provider: null,
      disclaimer: MENTOR_DISCLAIMER,
      notices: [
        "The AI mentor is not configured, so this is a guided response built from your own plan. Everything here still works offline.",
      ],
    };
  }

  const system = `${MENTOR_SYSTEM_PROMPT}\n\nUSER CONTEXT (authoritative — do not contradict it):\n${formatMentorContext(context)}`;
  const messages = [
    ...history.slice(-8),
    { role: "user" as const, content: message },
  ];

  const result = await provider.chat({ system, messages });
  if (!result.ok) {
    notices.push(
      "The AI provider could not be reached, so this is a guided response built from your own plan.",
    );
    return {
      reply: guidedReply(message, context),
      mode: "guided",
      provider: provider.name,
      disclaimer: MENTOR_DISCLAIMER,
      notices,
    };
  }

  const reply = result.data.trim().slice(0, 8000);
  if (!reply) {
    return {
      reply: guidedReply(message, context),
      mode: "guided",
      provider: provider.name,
      disclaimer: MENTOR_DISCLAIMER,
      notices: ["The AI provider returned an empty response. A guided answer is shown instead."],
    };
  }

  return {
    reply,
    mode: "ai",
    provider: result.provider,
    disclaimer: MENTOR_DISCLAIMER,
    notices,
  };
}
