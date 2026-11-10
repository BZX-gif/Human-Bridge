import { describe, expect, it } from "vitest";
import { buildRoadmap, type BuildRoadmapInput } from "@/lib/career/roadmap-template";
import { dailyMinutesForWeeklyHours } from "@/lib/services/planner-service";
import {
  mentorMessageSchema,
  taskCreateSchema,
  profileUpdateSchema,
  projectCreateSchema,
} from "@/lib/validation/career";

const baseInput: BuildRoadmapInput = {
  career: {
    name: "Data Analyst",
    slug: "data-analyst",
    tagline: "Turn raw data into decisions.",
    trackSlug: "data",
  },
  skills: [
    {
      slug: "sql",
      name: "SQL",
      importance: "essential",
      requiredLevel: "intermediate",
      requiredScore: 70,
    },
    {
      slug: "excel",
      name: "Excel",
      importance: "important",
      requiredLevel: "beginner",
      requiredScore: 50,
    },
    {
      slug: "communication",
      name: "Communication",
      importance: "helpful",
      requiredLevel: "beginner",
      requiredScore: 40,
      skillType: "human",
    },
  ],
  projects: [
    {
      slug: "sales-dashboard",
      title: "Sales dashboard",
      description: "Build a dashboard for a sales team.",
      difficulty: "Intermediate",
      estimatedHours: 8,
      skillSlugs: ["sql", "excel"],
      deliverables: ["Dashboard", "Summary"],
    },
  ],
  resourcesBySkill: {},
  startingLevel: "beginner",
  hoursPerWeek: 6,
};

describe("roadmap template", () => {
  it("produces five ordered stages with unique milestone keys", () => {
    const roadmap = buildRoadmap(baseInput);
    expect(roadmap.stages).toHaveLength(5);
    const keys = roadmap.stages.flatMap((stage) => stage.milestones.map((m) => m.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(roadmap.stages[0].milestones.length).toBeGreaterThan(0);
    expect(roadmap.stages[4].milestones.length).toBeGreaterThan(0);
    expect(roadmap.totalHours).toBeGreaterThan(0);
  });

  it("puts SQL before helpful human skills and explains why each milestone matters", () => {
    const roadmap = buildRoadmap(baseInput);
    const sql = roadmap.stages
      .flatMap((stage) => stage.milestones)
      .find((milestone) => milestone.skillSlugs.includes("sql"));
    expect(sql).toBeDefined();
    expect(sql?.objective).toContain("70/100");
    expect(sql?.whyItMatters.length).toBeGreaterThan(20);
    expect(sql?.completionCriteria.length).toBeGreaterThan(0);
  });

  it("pre-completes a milestone only from verified scores, never self-report", () => {
    const unverified = buildRoadmap({ ...baseInput, verifiedScores: { sql: 10 } });
    const sqlUnverified = unverified.stages
      .flatMap((stage) => stage.milestones)
      .find((milestone) => milestone.skillSlugs.includes("sql"));
    expect(sqlUnverified?.status).toBe("not_started");

    const verified = buildRoadmap({ ...baseInput, verifiedScores: { sql: 82 } });
    const sqlVerified = verified.stages
      .flatMap((stage) => stage.milestones)
      .find((milestone) => milestone.skillSlugs.includes("sql"));
    expect(sqlVerified?.status).toBe("completed");
    expect(sqlVerified?.estimatedHours).toBe(1);
  });

  it("respects the weekly hours input when estimating the plan", () => {
    const light = buildRoadmap({ ...baseInput, hoursPerWeek: 2 });
    const heavy = buildRoadmap({ ...baseInput, hoursPerWeek: 20 });
    expect(light.estimatedWeeks).toBeGreaterThanOrEqual(1);
    expect(light.estimatedWeeks).toBeGreaterThan(heavy.estimatedWeeks);
  });

  it("never invents resources when none are curated", () => {
    const roadmap = buildRoadmap(baseInput);
    for (const milestone of roadmap.stages.flatMap((stage) => stage.milestones)) {
      expect(Array.isArray(milestone.resources)).toBe(true);
      expect(milestone.resources.every((resource) => Boolean(resource.title))).toBe(true);
    }
  });
});

describe("planner capacity", () => {
  it("caps a generated day at 90 minutes", () => {
    expect(dailyMinutesForWeeklyHours(40)).toBe(90);
    expect(dailyMinutesForWeeklyHours(20)).toBe(90);
  });

  it("never creates an unusable 5-minute plan and handles bad input", () => {
    expect(dailyMinutesForWeeklyHours(1)).toBe(20);
    expect(dailyMinutesForWeeklyHours(0)).toBe(20);
    expect(dailyMinutesForWeeklyHours(Number.NaN)).toBe(60);
    expect(dailyMinutesForWeeklyHours(6)).toBe(72);
  });
});

describe("career OS validation", () => {
  it("rejects a task with no length and clamps nothing silently", () => {
    expect(() => taskCreateSchema.parse({ title: "   " })).toThrow();
  });

  it("rejects a task over the 8-hour estimate limit", () => {
    expect(() =>
      taskCreateSchema.parse({ title: "Deep work", estimatedMinutes: 600 }),
    ).toThrow();
  });

  it("rejects malformed profile links", () => {
    expect(() =>
      profileUpdateSchema.parse({ links: [{ label: "GitHub", url: "not-a-url" }] }),
    ).toThrow();
    expect(() =>
      profileUpdateSchema.parse({ links: [{ label: "GitHub", url: "https://github.com/a" }] }),
    ).not.toThrow();
  });

  it("rejects a project without a title", () => {
    expect(() => projectCreateSchema.parse({ description: "No title" })).toThrow();
  });

  it("bounds mentor messages and history", () => {
    expect(() => mentorMessageSchema.parse({ message: "" })).toThrow();
    expect(() => mentorMessageSchema.parse({ message: "x".repeat(4001) })).toThrow();
    expect(() =>
      mentorMessageSchema.parse({
        message: "Hello",
        history: Array.from({ length: 21 }, () => ({ role: "user" as const, content: "hi" })),
      }),
    ).toThrow();
  });
});
