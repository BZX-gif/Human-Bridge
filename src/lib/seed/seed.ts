import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  assessmentBlueprints,
  assessmentItems,
  assessmentRubrics,
  assessmentSections,
  careerSkills,
  careers,
  companies,
  jobSkills,
  jobs,
  learningResources,
  projects,
  skillCategories,
  skills,
} from "@/db/schema";
import {
  DEMO_CAREERS,
  DEMO_COMPANIES,
  DEMO_JOBS,
  DEMO_LEARNING_RESOURCES,
  DEMO_PROJECTS,
  DEMO_SKILLS,
} from "@/lib/demo-data";
import { BLUEPRINT_SEEDS } from "@/lib/assessment/blueprints/data-analyst";
import { resolveCareerRequirement, resolveJobRequirement, slugify } from "./requirements";

export interface SeedResult {
  skillCategories: number;
  skills: number;
  careers: number;
  careerSkills: number;
  companies: number;
  jobs: number;
  jobSkills: number;
  projects: number;
  learningResources: number;
  blueprints: number;
  sections: number;
  items: number;
  rubrics: number;
}

/**
 * Idempotent catalogue seeding.
 *
 * Deliberately NOT destructive: it upserts reference/demo data by slug and never
 * touches user-owned tables (users, attempts, evidence, applications). Running
 * it twice is safe and will not corrupt candidate records.
 */
export async function seedDatabase(): Promise<SeedResult> {
  const db = await getDb();

  // ── Skill categories ───────────────────────────────────────────────────
  const categorySeeds = [
    { name: "Core Skills", slug: "core-skills", description: "Foundational domain knowledge", icon: "BookOpen" },
    { name: "Tools", slug: "tools", description: "Software and platforms", icon: "Wrench" },
    { name: "Human Skills", slug: "human-skills", description: "Interpersonal capabilities", icon: "Users" },
    { name: "Domain", slug: "domain", description: "Industry-specific knowledge", icon: "Building2" },
  ];
  for (const cat of categorySeeds) {
    await db
      .insert(skillCategories)
      .values(cat)
      .onConflictDoUpdate({
        target: skillCategories.slug,
        set: { name: cat.name, description: cat.description, icon: cat.icon },
      });
  }
  const categoryRows = await db.select().from(skillCategories);
  const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));
  const CATEGORY_SLUG: Record<string, string> = {
    core: "core-skills",
    tool: "tools",
    human: "human-skills",
    domain: "domain",
  };

  // ── Skills ─────────────────────────────────────────────────────────────
  for (const skill of DEMO_SKILLS) {
    const categoryId = categoryIdBySlug.get(CATEGORY_SLUG[skill.category] ?? "core-skills") ?? null;
    await db
      .insert(skills)
      .values({
        name: skill.name,
        slug: skill.slug,
        description: skill.description,
        categoryId,
        whyEmployersWant: skill.whyEmployersWant,
      })
      .onConflictDoUpdate({
        target: skills.slug,
        set: {
          name: skill.name,
          description: skill.description,
          categoryId,
          whyEmployersWant: skill.whyEmployersWant,
        },
      });
  }
  const skillRows = await db.select().from(skills);
  const skillIdBySlug = new Map(skillRows.map((s) => [s.slug, s.id]));

  // ── Careers ────────────────────────────────────────────────────────────
  for (const career of DEMO_CAREERS) {
    await db
      .insert(careers)
      .values({
        name: career.name,
        slug: career.slug,
        tagline: career.tagline,
        description: career.description,
        whatThisRoleDoes: career.whatThisRoleDoes,
        demandLevel: career.demandLevel,
        salaryMin: career.salaryMin,
        salaryMax: career.salaryMax,
        salaryUnit: career.salaryUnit,
        experienceLevel: career.experienceLevel,
        growthRate: career.growthRate,
        icon: career.icon,
        color: career.color,
        careerPathway: career.careerPathway,
        typicalRequirements: career.typicalRequirements,
        isDemo: true,
      })
      .onConflictDoUpdate({
        target: careers.slug,
        set: {
          name: career.name,
          tagline: career.tagline,
          description: career.description,
          whatThisRoleDoes: career.whatThisRoleDoes,
          demandLevel: career.demandLevel,
          salaryMin: career.salaryMin,
          salaryMax: career.salaryMax,
          careerPathway: career.careerPathway,
          typicalRequirements: career.typicalRequirements,
        },
      });
  }
  const careerRows = await db.select().from(careers);
  const careerIdBySlug = new Map(careerRows.map((c) => [c.slug, c.id]));

  // ── Career skills (now with required level + score) ────────────────────
  let careerSkillCount = 0;
  for (const career of DEMO_CAREERS) {
    const careerId = careerIdBySlug.get(career.slug);
    if (!careerId) continue;
    let order = 0;
    for (const cs of career.skills) {
      const skillId = skillIdBySlug.get(cs.skill.slug);
      if (!skillId) continue;
      const req = resolveCareerRequirement(career.slug, cs.skill.slug, cs.importance);
      await db
        .insert(careerSkills)
        .values({
          careerId,
          skillId,
          importance: cs.importance,
          requiredLevel: req.requiredLevel,
          requiredScore: req.requiredScore,
          categoryLabel: cs.categoryLabel,
          order: order++,
        })
        .onConflictDoUpdate({
          target: [careerSkills.careerId, careerSkills.skillId],
          set: {
            importance: cs.importance,
            requiredLevel: req.requiredLevel,
            requiredScore: req.requiredScore,
            categoryLabel: cs.categoryLabel,
          },
        });
      careerSkillCount += 1;
    }
  }

  // ── Companies ──────────────────────────────────────────────────────────
  for (const company of DEMO_COMPANIES) {
    await db
      .insert(companies)
      .values({
        name: company.name,
        slug: company.slug,
        description: company.description,
        industry: company.industry,
        size: company.size,
        location: company.location,
        logoInitials: company.logoInitials,
        logoColor: company.logoColor,
        verified: company.verified,
        isDemo: true,
      })
      .onConflictDoUpdate({
        target: companies.slug,
        set: { name: company.name, description: company.description, isDemo: true },
      });
  }
  const companyRows = await db.select().from(companies);
  const companyIdBySlug = new Map(companyRows.map((c) => [c.slug, c.id]));

  // ── Jobs ───────────────────────────────────────────────────────────────
  let jobCount = 0;
  let jobSkillCount = 0;
  for (const job of DEMO_JOBS) {
    const companyId = companyIdBySlug.get(job.company.slug);
    const careerId = careerIdBySlug.get(job.career.slug);
    if (!companyId) continue;

    const jobSlug = slugify(job.title);
    const existing = await db
      .select()
      .from(jobs)
      .where(sql`${jobs.title} = ${job.title} and ${jobs.companyId} = ${companyId}`)
      .limit(1);

    const values = {
      title: job.title,
      companyId,
      careerId: careerId ?? null,
      description: job.description,
      location: job.location,
      workType: job.workType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryUnit: job.salaryUnit,
      experienceMin: job.experienceMin,
      experienceMax: job.experienceMax,
      status: "active" as const,
      isDemo: true,
      postedAt: new Date(Date.now() - job.postedDaysAgo * 86_400_000),
    };

    const jobId =
      existing.length > 0
        ? (await db.update(jobs).set(values).where(eq(jobs.id, existing[0].id)).returning())[0].id
        : (await db.insert(jobs).values(values).returning())[0].id;
    jobCount += 1;

    for (const js of job.skills) {
      const skillId = skillIdBySlug.get(js.skill.slug);
      if (!skillId) continue;
      const req = resolveJobRequirement(jobSlug, js.skill.slug, js.importance);
      await db
        .insert(jobSkills)
        .values({
          jobId,
          skillId,
          importance: js.importance,
          requiredLevel: req.requiredLevel,
          requiredScore: req.requiredScore,
        })
        .onConflictDoUpdate({
          target: [jobSkills.jobId, jobSkills.skillId],
          set: {
            importance: js.importance,
            requiredLevel: req.requiredLevel,
            requiredScore: req.requiredScore,
          },
        });
      jobSkillCount += 1;
    }
  }

  // ── Projects ───────────────────────────────────────────────────────────
  for (const project of DEMO_PROJECTS) {
    const slug = slugify(project.title);
    const careerId = careerIdBySlug.get(slugify(project.careerName)) ?? null;
    await db
      .insert(projects)
      .values({
        title: project.title,
        slug,
        description: project.description,
        careerId,
        skillSlugs: project.skills.map((s) => slugify(s)),
        difficulty: project.difficulty,
        estimatedHours: project.estimatedHours,
        instructions: project.instructions,
        deliverables: project.deliverables,
      })
      .onConflictDoUpdate({
        target: projects.slug,
        set: {
          description: project.description,
          instructions: project.instructions,
          deliverables: project.deliverables,
        },
      });
  }

  // ── Learning resources ─────────────────────────────────────────────────
  await db.delete(learningResources);
  for (const resource of DEMO_LEARNING_RESOURCES) {
    const skillId = skillIdBySlug.get(slugify(resource.skillName)) ?? null;
    await db.insert(learningResources).values({
      title: resource.title,
      skillId,
      type: resource.type,
      provider: resource.provider,
      duration: resource.duration,
      level: resource.level as "beginner" | "intermediate" | "advanced" | "expert",
      free: resource.free,
      description: resource.description,
      isDemo: true,
    });
  }

  // ── Assessment blueprints ──────────────────────────────────────────────
  const blueprintStats = await seedBlueprints();

  return {
    skillCategories: categorySeeds.length,
    skills: DEMO_SKILLS.length,
    careers: DEMO_CAREERS.length,
    careerSkills: careerSkillCount,
    companies: DEMO_COMPANIES.length,
    jobs: jobCount,
    jobSkills: jobSkillCount,
    projects: DEMO_PROJECTS.length,
    learningResources: DEMO_LEARNING_RESOURCES.length,
    ...blueprintStats,
  };
}

/**
 * Seed assessment blueprints.
 *
 * Each blueprint is versioned. If a (slug, version) already exists its content
 * is replaced in place; publishing changed content should use a NEW version so
 * historical attempts stay bound to exactly what the candidate saw.
 */
export async function seedBlueprints(): Promise<{
  blueprints: number;
  sections: number;
  items: number;
  rubrics: number;
}> {
  const db = await getDb();
  const careerRows = await db.select().from(careers);
  const careerIdBySlug = new Map(careerRows.map((c) => [c.slug, c.id]));

  let sectionCount = 0;
  let itemCount = 0;
  let rubricCount = 0;

  for (const seed of BLUEPRINT_SEEDS) {
    const careerId = careerIdBySlug.get(seed.careerSlug) ?? null;

    const existing = await db
      .select()
      .from(assessmentBlueprints)
      .where(
        sql`${assessmentBlueprints.slug} = ${seed.slug} and ${assessmentBlueprints.version} = ${seed.version}`,
      )
      .limit(1);

    const values = {
      slug: seed.slug,
      version: seed.version,
      title: seed.title,
      summary: seed.summary,
      targetRole: seed.targetRole,
      careerId,
      durationMinutes: seed.durationMinutes,
      passingPolicy: seed.passingPolicy,
      toolsAllowed: seed.toolsAllowed,
      aiPolicy: seed.aiPolicy,
      status: "published" as const,
      updatedAt: new Date(),
    };

    const blueprintId =
      existing.length > 0
        ? (
            await db
              .update(assessmentBlueprints)
              .set(values)
              .where(eq(assessmentBlueprints.id, existing[0].id))
              .returning()
          )[0].id
        : (await db.insert(assessmentBlueprints).values(values).returning())[0].id;

    // Replace this version's content wholesale (sections cascade to items).
    await db.delete(assessmentSections).where(eq(assessmentSections.blueprintId, blueprintId));
    await db.delete(assessmentRubrics).where(eq(assessmentRubrics.blueprintId, blueprintId));

    const rubricIdByKey = new Map<string, number>();
    for (const rubric of seed.rubrics) {
      const [row] = await db
        .insert(assessmentRubrics)
        .values({
          blueprintId,
          key: rubric.key,
          title: rubric.title,
          criteria: rubric.criteria,
        })
        .returning();
      rubricIdByKey.set(rubric.key, row.id);
      rubricCount += 1;
    }

    let sectionOrder = 0;
    for (const section of seed.sections) {
      const [sectionRow] = await db
        .insert(assessmentSections)
        .values({
          blueprintId,
          key: section.key,
          kind: section.kind,
          title: section.title,
          instructions: section.instructions,
          weight: section.weight,
          order: sectionOrder++,
          timeLimitMinutes: section.timeLimitMinutes ?? null,
          rubricId: section.rubricKey ? (rubricIdByKey.get(section.rubricKey) ?? null) : null,
          config: {
            ...(section.config ?? {}),
            ...(section.key === "knowledge" ? { scenario: seed.scenario } : {}),
          },
        })
        .returning();
      sectionCount += 1;

      let itemOrder = 0;
      for (const item of section.items) {
        await db.insert(assessmentItems).values({
          sectionId: sectionRow.id,
          key: item.key,
          // Item type comes from the item definition — NOT hardcoded to "mcq".
          type: item.type,
          prompt: item.prompt,
          helperText: item.helperText ?? null,
          payload: item.payload ?? {},
          answerKey: item.answerKey ?? null,
          skillSlugs: item.skillSlugs,
          points: item.points ?? 1,
          difficulty: item.difficulty ?? "intermediate",
          order: itemOrder++,
        });
        itemCount += 1;
      }
    }

  }

  return {
    blueprints: BLUEPRINT_SEEDS.length,
    sections: sectionCount,
    items: itemCount,
    rubrics: rubricCount,
  };
}

export function getScenario(slug: string): string | null {
  return BLUEPRINT_SEEDS.find((b) => b.slug === slug)?.scenario ?? null;
}
