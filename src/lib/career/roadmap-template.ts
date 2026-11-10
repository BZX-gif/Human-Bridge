/**
 * Deterministic career roadmap builder.
 *
 * The roadmap is generated from the career's structured skill requirements and
 * the project catalogue — not from an LLM. This keeps the core product free,
 * reliable and honest when no AI provider is configured. An AI layer may later
 * annotate the plan, but it can never invent requirements or resources here.
 */

export type StartingLevel = "beginner" | "some_experience" | "intermediate";

export interface RoadmapSkillInput {
  slug: string;
  name: string;
  importance: "essential" | "important" | "helpful";
  requiredLevel: "not_evaluated" | "beginner" | "intermediate" | "advanced" | "expert";
  requiredScore: number;
  skillType?: "domain" | "tool" | "human" | "ai_fluency";
  difficulty?: "beginner" | "intermediate" | "advanced";
  whyEmployersWant?: string | null;
  requiredCategory?: string | null;
}

export interface RoadmapProjectInput {
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  estimatedHours: number | null;
  skillSlugs: string[];
  deliverables: string[];
}

export interface RoadmapResourceInput {
  title: string;
  provider: string | null;
  url: string | null;
  type: string | null;
  isDemo: boolean;
}

export interface RoadmapCareerInput {
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  trackSlug?: string | null;
}

export interface BuildRoadmapInput {
  career: RoadmapCareerInput;
  skills: RoadmapSkillInput[];
  projects: RoadmapProjectInput[];
  resourcesBySkill: Record<string, RoadmapResourceInput[]>;
  startingLevel: StartingLevel;
  hoursPerWeek: number;
  /** Verified assessment scores only. Self-reported claims must never appear here. */
  verifiedScores?: Record<string, number>;
}

export interface PlannedMilestone {
  key: string;
  title: string;
  objective: string;
  whyItMatters: string;
  skillSlugs: string[];
  resources: {
    title: string;
    provider?: string;
    url?: string;
    type?: string;
    note?: string;
    isDemo?: boolean;
  }[];
  exercises: string[];
  projectSlugs: string[];
  estimatedHours: number;
  completionCriteria: string[];
  dependsOn: string[];
  status: "not_started" | "in_progress" | "completed";
  ordering: number;
}

export interface PlannedStage {
  key: string;
  title: string;
  description: string;
  estimatedWeeks: number;
  milestones: PlannedMilestone[];
}

export interface PlannedRoadmap {
  title: string;
  summary: string;
  estimatedWeeks: number;
  totalHours: number;
  stages: PlannedStage[];
}

interface StageCopy {
  title: string;
  description: string;
}

interface TrackTemplate {
  stages: [StageCopy, StageCopy, StageCopy, StageCopy, StageCopy];
}

const GENERIC: TrackTemplate = {
  stages: [
    {
      title: "Foundations",
      description:
        "Build the base knowledge and vocabulary the role assumes. Nothing here is decorative — every item is used later.",
    },
    {
      title: "Core craft",
      description:
        "Develop the capabilities the role is actually hired for, working from essential requirements first.",
    },
    {
      title: "Tools & practice",
      description:
        "Learn the tools professionals use daily and practise the workflows that surround them.",
    },
    {
      title: "Applied work",
      description:
        "Turn knowledge into evidence by completing realistic projects with clear deliverables.",
    },
    {
      title: "Professional readiness",
      description:
        "Package your evidence, practise explaining your work, and prepare to apply with honesty.",
    },
  ],
};

const TEMPLATES: Record<string, TrackTemplate> = {
  "software-engineering": {
    stages: [
      {
        title: "Foundations",
        description:
          "Computer fundamentals, problem decomposition and the mathematics that actually shows up in day-to-day engineering.",
      },
      {
        title: "Programming",
        description:
          "Learn one language properly: data types, control flow, functions, data structures and deliberate practice.",
      },
      {
        title: "Development practice",
        description:
          "Version control, databases, APIs, testing and the working habits that make code maintainable.",
      },
      {
        title: "Real projects",
        description:
          "Ship working software. Each project produces artefacts you can show, explain and defend.",
      },
      {
        title: "Professional readiness",
        description:
          "A portfolio, a clear CV, interview practice and a realistic application strategy.",
      },
    ],
  },
  "data-analytics": {
    stages: [
      {
        title: "Foundations",
        description:
          "How data is structured, how to reason with numbers and how to ask a question that data can answer.",
      },
      {
        title: "Analysis craft",
        description:
          "Querying, cleaning, exploratory analysis and the statistical judgement to avoid confident nonsense.",
      },
      {
        title: "Tools & reporting",
        description:
          "Spreadsheets, SQL, BI tools and the dashboards stakeholders will actually use.",
      },
      {
        title: "Applied analysis",
        description:
          "Complete end-to-end analyses from messy data to a recommendation someone can act on.",
      },
      {
        title: "Professional readiness",
        description:
          "Present findings, document your work and prepare evidence for analyst interviews.",
      },
    ],
  },
  "ai-machine-learning": {
    stages: [
      {
        title: "Foundations",
        description:
          "Programming, statistics and the mathematical intuition behind models — without skipping the basics.",
      },
      {
        title: "Modelling",
        description:
          "Framing problems, feature work, model selection and evaluation that survives contact with real data.",
      },
      {
        title: "Engineering & tools",
        description:
          "The libraries, data pipelines and deployment practices that separate notebooks from systems.",
      },
      {
        title: "Applied projects",
        description:
          "Build measured, documented models with a clear baseline and an honest evaluation.",
      },
      {
        title: "Professional readiness",
        description:
          "Explain model trade-offs, publish reproducible work and prepare for applied ML interviews.",
      },
    ],
  },
  "cloud-devops": {
    stages: [
      {
        title: "Foundations",
        description:
          "Linux, networking and the operating-system concepts that explain why production behaves the way it does.",
      },
      {
        title: "Infrastructure",
        description:
          "Cloud fundamentals, containers and declarative infrastructure with cost and reliability in mind.",
      },
      {
        title: "Delivery & operations",
        description:
          "CI/CD, observability, security and the day-two work that keeps systems running.",
      },
      {
        title: "Applied projects",
        description:
          "Deploy, monitor and document a real service — including what breaks and how you fixed it.",
      },
      {
        title: "Professional readiness",
        description:
          "Runbooks, incident write-ups and a portfolio that shows operational judgement.",
      },
    ],
  },
  cybersecurity: {
    stages: [
      {
        title: "Foundations",
        description:
          "Networks, operating systems and the core security principles every defensive decision rests on.",
      },
      {
        title: "Security craft",
        description:
          "Threat modelling, application security and the OWASP habits that prevent common failures.",
      },
      {
        title: "Tools & operations",
        description:
          "Scanning, monitoring and the operational routines of a security team.",
      },
      {
        title: "Applied projects",
        description:
          "Produce defensible assessments and fixes, with clear evidence and prioritisation.",
      },
      {
        title: "Professional readiness",
        description:
          "Write for both engineers and decision-makers, and prepare for practical security interviews.",
      },
    ],
  },
  "ui-ux-design": {
    stages: [
      {
        title: "Foundations",
        description:
          "Design principles, accessibility and how people actually use interfaces.",
      },
      {
        title: "Design craft",
        description:
          "Research, information architecture, wireframing and interaction design.",
      },
      {
        title: "Tools & systems",
        description:
          "Figma fluency, component thinking and handing work to engineers without losing intent.",
      },
      {
        title: "Applied projects",
        description:
          "Solve a real user problem end to end, from research notes to a tested prototype.",
      },
      {
        title: "Professional readiness",
        description:
          "A case-study portfolio that explains decisions, trade-offs and measured outcomes.",
      },
    ],
  },
  "digital-marketing": {
    stages: [
      {
        title: "Foundations",
        description:
          "How acquisition, conversion and retention fit together — and how to measure them honestly.",
      },
      {
        title: "Channel craft",
        description:
          "Search, content, paid and social execution grounded in audience and message.",
      },
      {
        title: "Tools & analytics",
        description:
          "Analytics, experimentation and reporting that connects activity to outcomes.",
      },
      {
        title: "Applied campaigns",
        description:
          "Plan and execute a campaign with a clear hypothesis, budget and measurement plan.",
      },
      {
        title: "Professional readiness",
        description:
          "A results-oriented portfolio that clearly separates your contribution from team results.",
      },
    ],
  },
  "sales-business-development": {
    stages: [
      {
        title: "Foundations",
        description:
          "Understand the product, the buyer and the problem you are actually solving.",
      },
      {
        title: "Sales craft",
        description:
          "Discovery, qualification, objection handling and ethical closing.",
      },
      {
        title: "Tools & pipeline",
        description:
          "CRM discipline, forecasting and follow-up systems that do not rely on memory.",
      },
      {
        title: "Applied practice",
        description:
          "Run realistic discovery and objection scenarios and record how you improve.",
      },
      {
        title: "Professional readiness",
        description:
          "Build a track record narrative and prepare for role-play interviews.",
      },
    ],
  },
  "product-management": {
    stages: [
      {
        title: "Foundations",
        description:
          "Users, business models and how products create and capture value.",
      },
      {
        title: "Product craft",
        description:
          "Discovery, prioritisation, specification and decision-making under uncertainty.",
      },
      {
        title: "Tools & collaboration",
        description:
          "Analytics, roadmapping and working effectively with design and engineering.",
      },
      {
        title: "Applied projects",
        description:
          "Take a problem from evidence to a scoped, measurable product proposal.",
      },
      {
        title: "Professional readiness",
        description:
          "Product case studies and interview practice that show judgement, not jargon.",
      },
    ],
  },
  "finance-business-analysis": {
    stages: [
      {
        title: "Foundations",
        description:
          "Accounting, business models and the financial statements that describe reality.",
      },
      {
        title: "Analysis craft",
        description:
          "Modelling, variance analysis and the assumptions behind every forecast.",
      },
      {
        title: "Tools & reporting",
        description:
          "Spreadsheets, reporting packs and communicating numbers without distortion.",
      },
      {
        title: "Applied analysis",
        description:
          "Build a model or business case with documented assumptions and sensitivity.",
      },
      {
        title: "Professional readiness",
        description:
          "Prepare work samples, explain your assumptions, and practise technical interviews.",
      },
    ],
  },
  "project-management": {
    stages: [
      {
        title: "Foundations",
        description:
          "Scope, stakeholders, risk and the delivery fundamentals behind every methodology.",
      },
      {
        title: "Delivery craft",
        description:
          "Planning, estimation, dependency management and clear communication.",
      },
      {
        title: "Tools & governance",
        description:
          "Tracking tools, reporting and the rituals that keep work visible.",
      },
      {
        title: "Applied projects",
        description:
          "Plan and run a realistic project, documenting decisions and trade-offs.",
      },
      {
        title: "Professional readiness",
        description:
          "A delivery narrative and interview practice around real constraints.",
      },
    ],
  },
  "customer-success-support": {
    stages: [
      {
        title: "Foundations",
        description:
          "Product knowledge, customer context and the difference between support and success.",
      },
      {
        title: "Customer craft",
        description:
          "Diagnosis, clear writing, de-escalation and proactive account work.",
      },
      {
        title: "Tools & process",
        description:
          "Ticketing, CRM and the metrics that reveal customer health.",
      },
      {
        title: "Applied practice",
        description:
          "Work realistic cases and document the resolution and the learning.",
      },
      {
        title: "Professional readiness",
        description:
          "Show customer outcomes and prepare for scenario-based interviews.",
      },
    ],
  },
};

const CAREER_OVERRIDES: Record<string, TrackTemplate> = {
  "software-developer": TEMPLATES["software-engineering"],
  "data-analyst": TEMPLATES["data-analytics"],
  "ui-ux-designer": TEMPLATES["ui-ux-design"],
  "business-analyst": TEMPLATES["finance-business-analysis"],
};

const HOURS_BY_LEVEL: Record<string, number> = {
  beginner: 8,
  intermediate: 14,
  advanced: 22,
  expert: 26,
};

const STAGE_KEYS = ["foundations", "craft", "tools", "applied", "readiness"] as const;

function stageIndexForSkill(
  skill: RoadmapSkillInput,
  explicit: Map<string, number>,
): number {
  const mapped = explicit.get(skill.slug);
  if (mapped !== undefined) return mapped;
  if (skill.skillType === "human") return 4;
  if (skill.skillType === "tool") return 2;
  if (skill.difficulty === "beginner") return 0;
  if (skill.importance === "essential") return 1;
  if (skill.importance === "helpful") return 2;
  return 1;
}

/** Track-specific nudges for skills that belong in a particular stage. */
const STAGE_FOCUS: Record<string, Record<string, string[]>> = {
  "software-engineering": {
    foundations: ["computer-fundamentals", "problem-solving", "critical-thinking"],
    craft: ["programming-fundamentals", "data-structures-algorithms", "rest-apis", "testing-debugging"],
    tools: ["git-github", "docker", "linux", "sql", "databases"],
    applied: [],
    readiness: ["communication", "stakeholder-management"],
  },
  "data-analytics": {
    foundations: ["data-cleaning", "critical-thinking", "problem-solving", "statistics"],
    craft: ["sql", "data-analysis", "data-visualization", "business-analysis"],
    tools: ["excel", "power-bi", "tableau", "python", "google-analytics"],
    applied: [],
    readiness: ["communication", "stakeholder-management"],
  },
  "ui-ux-design": {
    foundations: ["user-research", "critical-thinking", "communication"],
    craft: ["wireframing", "prototyping", "user-research"],
    tools: ["figma"],
    applied: [],
    readiness: ["communication", "stakeholder-management"],
  },
};

function explicitStageMap(trackSlug: string | null | undefined, careerSlug: string): Map<string, number> {
  const key = trackSlug && STAGE_FOCUS[trackSlug] ? trackSlug : careerSlug;
  const focus = STAGE_FOCUS[key];
  const map = new Map<string, number>();
  if (!focus) return map;
  for (const [stageKey, slugs] of Object.entries(focus)) {
    const index = STAGE_KEYS.indexOf(stageKey as (typeof STAGE_KEYS)[number]);
    if (index === -1) continue;
    for (const slug of slugs) map.set(slug, index);
  }
  return map;
}

function resourceViews(resources: RoadmapResourceInput[] | undefined, skill: RoadmapSkillInput) {
  if (!resources || resources.length === 0) {
    return [
      {
        title: `No curated resource for ${skill.name} yet`,
        note: "Use the practice exercises below, or ask the mentor to explain the concept. Human Bridge does not invent course links.",
      },
    ];
  }
  return resources.slice(0, 3).map((resource) => ({
    title: resource.title,
    provider: resource.provider ?? undefined,
    url: resource.url ?? undefined,
    type: resource.type ?? undefined,
    note: resource.isDemo ? "Demo catalogue entry — not a live course link." : undefined,
    isDemo: resource.isDemo,
  }));
}

function exercisesFor(skill: RoadmapSkillInput): string[] {
  return [
    `Write a one-page explanation of ${skill.name} in your own words, including where you are still unsure.`,
    `Complete three small practice exercises that use ${skill.name} without following a tutorial step by step.`,
    `Apply ${skill.name} to one realistic scenario and keep the output as portfolio evidence.`,
  ];
}

function criteriaFor(skill: RoadmapSkillInput): string[] {
  return [
    `You can explain ${skill.name} without notes to someone outside the field.`,
    `You completed the practice work and can show the output.`,
    `You can complete a representative ${skill.name} task unaided.`,
    `Optional: pass a Human Bridge assessment to add verified evidence in addition to your self-attested work.`,
  ];
}

function estimateFor(skill: RoadmapSkillInput, verifiedScore: number, hoursPerWeek: number): number {
  const base = HOURS_BY_LEVEL[skill.requiredLevel] ?? 12;
  const required = Math.max(1, skill.requiredScore);
  const progress = Math.min(1, Math.max(0, verifiedScore / required));
  const remaining = Math.max(0.35, 1 - progress);
  const loadFactor = hoursPerWeek >= 10 ? 0.85 : hoursPerWeek <= 3 ? 1.15 : 1;
  return Math.max(2, Math.round(base * remaining * loadFactor));
}

/**
 * Build a complete, dependency-ordered roadmap.
 *
 * Rules that matter for trust:
 *  - Only verified scores can pre-complete a milestone. Claims never can.
 *  - Effort figures are estimates derived from required level and remaining gap.
 *  - Resources come only from the curated catalogue; absence is stated plainly.
 */
export function buildRoadmap(input: BuildRoadmapInput): PlannedRoadmap {
  const trackSlug = input.career.trackSlug ?? null;
  const template =
    CAREER_OVERRIDES[input.career.slug] ??
    (trackSlug ? TEMPLATES[trackSlug] : undefined) ??
    GENERIC;

  const hoursPerWeek = Math.min(40, Math.max(1, Math.round(input.hoursPerWeek || 5)));
  const verified = input.verifiedScores ?? {};
  const explicit = explicitStageMap(trackSlug, input.career.slug);

  const buckets: RoadmapSkillInput[][] = [[], [], [], [], []];
  const seen = new Set<string>();
  for (const skill of input.skills) {
    if (seen.has(skill.slug)) continue;
    seen.add(skill.slug);
    buckets[stageIndexForSkill(skill, explicit)].push(skill);
  }

  const stageMilestones: PlannedMilestone[][] = [[], [], [], [], []];
  let counter = 0;
  const nextKey = (prefix: string) => `${prefix}-${++counter}`;

  const stageHours = [0, 0, 0, 0, 0];

  // Stage 1 — an orientation milestone, always useful and never fabricated.
  const orientationKey = nextKey("orientation");
  stageMilestones[0].push({
    key: orientationKey,
    title: `Understand the ${input.career.name} role honestly`,
    objective: `Read the career overview for ${input.career.name}, list the five tasks you would actually do in a typical week, and identify which of them you would find hardest. This is a reality check, not a motivational exercise.`,
    whyItMatters:
      "People often choose a title without understanding the work. Ten minutes of honest reflection now prevents months of preparation for a role you may not want.",
    skillSlugs: [],
    resources: [],
    exercises: [
      "Write down what you believe the role involves, then compare it with the career overview.",
      "List three parts of the work that appeal to you and two that do not.",
      "Identify one assumption you held that the overview corrected.",
    ],
    projectSlugs: [],
    estimatedHours: 1,
    completionCriteria: [
      "You can describe the day-to-day work without using marketing language.",
      "You have written down at least one part of the role you would find difficult.",
    ],
    dependsOn: [],
    status: "not_started",
    ordering: 1,
  });
  stageHours[0] += 1;

  for (let stage = 0; stage < 5; stage++) {
    const skills = buckets[stage].sort((a, b) => {
      const rank = { essential: 0, important: 1, helpful: 2 } as const;
      const byImportance = rank[a.importance] - rank[b.importance];
      if (byImportance !== 0) return byImportance;
      return a.name.localeCompare(b.name);
    });

    for (const skill of skills) {
      const verifiedScore = verified[skill.slug] ?? 0;
      const alreadyVerified = verifiedScore > 0 && verifiedScore >= skill.requiredScore;
      const qualification = skill.importance === "essential" ? "required by this role" : skill.importance === "important" ? "expected by most employers" : "useful for standing out";
      const hours = alreadyVerified ? 1 : estimateFor(skill, verifiedScore, hoursPerWeek);
      stageHours[stage] += hours;

      stageMilestones[stage].push({
        key: nextKey(`skill-${skill.slug}`),
        title: alreadyVerified
          ? `${skill.name} — already evidenced`
          : `Build working command of ${skill.name}`,
        objective: alreadyVerified
          ? `Your verified evidence already meets this requirement (${verifiedScore}/${skill.requiredScore}). Keep the evidence current and be ready to explain it.`
          : `Reach a level where you can use ${skill.name} unaided on a realistic task. The role requirement is ${skill.requiredScore}/100 (${skill.requiredLevel}), which is ${qualification}.`,
        whyItMatters:
          skill.whyEmployersWant ??
          `${skill.name} is ${qualification}. The roadmap uses your measured gap against that requirement rather than a generic syllabus.`,
        skillSlugs: [skill.slug],
        resources: resourceViews(input.resourcesBySkill[skill.slug], skill),
        exercises: alreadyVerified ? ["Re-read your evidence and prepare a two-minute explanation of what you did."] : exercisesFor(skill),
        projectSlugs: [],
        estimatedHours: hours,
        completionCriteria: alreadyVerified
          ? ["Your evidence is recorded and you can explain the work behind it."]
          : criteriaFor(skill),
        dependsOn: [],
        status: alreadyVerified ? "completed" : "not_started",
        ordering: stageMilestones[stage].length + 1,
      });
    }
  }

  // Stage 4 — applied projects, drawn from the curated project catalogue.
  const relevant = input.projects
    .map((project) => {
      const overlap = project.skillSlugs.filter((slug) => seen.has(slug)).length;
      return { project, overlap };
    })
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 2);

  if (relevant.length === 0) {
    const topSkills = input.skills.slice(0, 3).map((s) => s.name);
    const fallbackProject = {
      slug: `capstone-${input.career.slug}`,
      title: `${input.career.name} capstone`,
      description: `Design and complete a self-directed project that uses ${topSkills.join(", ") || "the core skills for this role"}. Define the problem, produce the deliverables and write a short reflection.`,
      difficulty: "Intermediate",
      estimatedHours: 20,
      skillSlugs: input.skills.slice(0, 3).map((s) => s.slug),
      deliverables: ["Project brief", "Final artefact", "Short reflection on decisions and limitations"],
    };
    relevant.push({ project: fallbackProject, overlap: fallbackProject.skillSlugs.length });
  }

  for (const { project } of relevant) {
    const hours = project.estimatedHours ?? 16;
    stageHours[3] += hours;
    stageMilestones[3].push({
      key: nextKey(`project-${project.slug}`),
      title: `Project: ${project.title}`,
      objective: project.description ?? `Complete a practical ${input.career.name} project with clear deliverables.`,
      whyItMatters:
        "Employers cannot verify what you know from a certificate alone. A finished project gives you something concrete to show, explain and defend.",
      skillSlugs: project.skillSlugs,
      resources: [],
      exercises: [
        "Write a one-paragraph brief: the problem, the intended user and what done looks like.",
        "Build the smallest version that works before polishing anything.",
        "Record one decision you made and the trade-off behind it.",
      ],
      projectSlugs: [project.slug],
      estimatedHours: hours,
      completionCriteria:
        project.deliverables.length > 0
          ? project.deliverables.map((deliverable) => `Deliverable ready: ${deliverable}`)
          : ["The project works end to end.", "The work is documented and stored in your portfolio."],
      dependsOn: [],
      status: "not_started",
      ordering: stageMilestones[3].length + 1,
    });
  }

  // Stage 5 — professional readiness. Generic, honest and actionable.
  const readiness: Omit<PlannedMilestone, "key" | "ordering" | "dependsOn">[] = [
    {
      title: "Build a portfolio that shows real work",
      objective:
        "Add at least two completed projects to your portfolio, each with the problem, your approach, the result and the limits of the work.",
      whyItMatters:
        "A portfolio is evidence. It is also a record of your thinking, which is what interviewers probe.",
      skillSlugs: [],
      resources: [],
      exercises: [
        "Choose the two projects that best demonstrate the skills this role requires.",
        "Write a short case note for each: context, constraints, decisions, outcome.",
        "Remove any claim you cannot back with an artefact.",
      ],
      projectSlugs: [],
      estimatedHours: 4,
      completionCriteria: [
        "Two projects are visible in your portfolio.",
        "Each project has an artefact and a short explanation.",
      ],
      status: "not_started",
    },
    {
      title: "Write a clear, truthful CV and profile",
      objective:
        "Produce a one-page CV focused on demonstrated work. Describe what you did and the result, not adjectives about yourself.",
      whyItMatters:
        "Most CVs fail because they make claims without evidence. A smaller, specific CV is stronger than a long one.",
      skillSlugs: [],
      resources: [],
      exercises: [
        "List your projects and the concrete skills each one demonstrates.",
        "Rewrite three bullets to start with an action and end with an outcome.",
        "Ask someone to identify what role you are targeting from the CV alone.",
      ],
      projectSlugs: [],
      estimatedHours: 3,
      completionCriteria: [
        "The CV fits one page.",
        "Every claim maps to work you can show.",
        "A reader can tell which role you are targeting.",
      ],
      status: "not_started",
    },
    {
      title: "Practise explaining your work out loud",
      objective:
        "Prepare and rehearse answers about your projects, your decisions and what you would do differently.",
      whyItMatters:
        "Interviews test whether you understand your own work. Rehearsal exposes the gaps before an interviewer does.",
      skillSlugs: [],
      resources: [],
      exercises: [
        "Record a three-minute walkthrough of one project without notes.",
        "Prepare answers to: what was hardest, what failed, what would you change.",
        "Do one mock interview with a friend or the Human Bridge mentor.",
      ],
      projectSlugs: [],
      estimatedHours: 4,
      completionCriteria: [
        "You can explain one project in three minutes.",
        "You can discuss a failure without becoming defensive.",
      ],
      status: "not_started",
    },
    {
      title: "Run a realistic application plan",
      objective:
        "Build a target list of roles that match your current evidence, tailor each application and track what you send. No mass applications.",
      whyItMatters:
        "Applications are a numbers game only if the numbers are honest. Tailored applications produce better learning, even when they do not convert.",
      skillSlugs: [],
      resources: [],
      exercises: [
        "Identify five roles whose requirements match at least 60% of your evidence.",
        "For each, note the two skills you cannot yet evidence.",
        "Track applications and outcomes so you can adjust the plan.",
      ],
      projectSlugs: [],
      estimatedHours: 3,
      completionCriteria: [
        "Five realistic target roles are listed.",
        "Each application is tailored rather than duplicated.",
        "You have a way to track outcomes.",
      ],
      status: "not_started",
    },
  ];

  for (const item of readiness) {
    stageHours[4] += item.estimatedHours;
    stageMilestones[4].push({
      ...item,
      key: nextKey(`readiness-${stageMilestones[4].length + 1}`),
      ordering: stageMilestones[4].length + 1,
      dependsOn: [],
    });
  }

  // Dependencies follow the intended sequence, not a rigid curriculum.
  let previousTitle: string | null = null;
  for (let stage = 0; stage < 5; stage++) {
    for (const milestone of stageMilestones[stage]) {
      if (previousTitle) milestone.dependsOn = [previousTitle];
      previousTitle = milestone.title;
    }
  }

  const stages: PlannedStage[] = stageMilestones.map((milestones, index) => ({
    key: STAGE_KEYS[index],
    title: template.stages[index].title,
    description: template.stages[index].description,
    estimatedWeeks: Math.max(1, Math.ceil(stageHours[index] / hoursPerWeek)),
    milestones,
  }));

  const totalHours = stageHours.reduce((sum, hours) => sum + hours, 0);
  const estimatedWeeks = Math.max(1, Math.ceil(totalHours / hoursPerWeek));
  const completed = stageMilestones.flat().filter((m) => m.status === "completed").length;

  return {
    title: `${input.career.name} roadmap`,
    summary: `${stages.length} stages · ${stageMilestones.flat().length} milestones · about ${estimatedWeeks} weeks at ${hoursPerWeek} hours per week. ${
      completed > 0
        ? `${completed} milestone${completed === 1 ? " is" : "s are"} already met by verified evidence.`
        : "Every milestone has an objective, practice work and completion criteria."
    } Effort figures are estimates; adjust them as you learn more about your pace.`,
    estimatedWeeks,
    totalHours,
    stages,
  };
}

/** Progress from completed milestones. A milestone is never complete by assumption. */
export function roadmapProgress(
  milestones: { status: string; estimatedHours: number }[],
): number {
  const total = milestones.reduce((sum, m) => sum + Math.max(1, m.estimatedHours), 0);
  if (total === 0) return 0;
  const done = milestones
    .filter((m) => m.status === "completed")
    .reduce((sum, m) => sum + Math.max(1, m.estimatedHours), 0);
  return Math.min(100, Math.round((done / total) * 100));
}
