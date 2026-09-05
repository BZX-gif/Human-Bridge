import { db } from "@/db";
import {
  skillCategories,
  skills,
  careers,
  careerSkills,
  companies,
  jobs,
  jobSkills,
  assessments,
  projects,
  learningResources,
} from "@/db/schema";
import { sql } from "drizzle-orm";
import { DEMO_SKILLS, DEMO_CAREERS, DEMO_COMPANIES, DEMO_JOBS, DEMO_ASSESSMENTS, DEMO_PROJECTS, DEMO_LEARNING_RESOURCES } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Clear existing data
    await db.execute(sql`TRUNCATE TABLE skill_categories, skills, careers, career_skills, companies, jobs, job_skills, assessments, projects, learning_resources RESTART IDENTITY CASCADE`);

    // Seed skill categories
    const cats = await db.insert(skillCategories).values([
      { name: "Core Skills", slug: "core-skills", description: "Foundational knowledge", icon: "BookOpen" },
      { name: "Tools", slug: "tools", description: "Software and platforms", icon: "Wrench" },
      { name: "Human Skills", slug: "human-skills", description: "Interpersonal capabilities", icon: "Heart" },
    ]).returning();

    const catMap: Record<string, number> = {
      core: cats[0].id,
      tool: cats[1].id,
      human: cats[2].id,
    };

    // Seed skills
    const insertedSkills = await db.insert(skills).values(
      DEMO_SKILLS.map(s => ({
        name: s.name,
        slug: s.slug,
        description: s.description,
        categoryId: catMap[s.category] || cats[0].id,
        whyEmployersWant: s.whyEmployersWant,
      }))
    ).returning();

    const skillIdMap: Record<number, number> = {};
    DEMO_SKILLS.forEach((s, i) => {
      skillIdMap[s.id] = insertedSkills[i].id;
    });

    // Seed careers
    const insertedCareers = await db.insert(careers).values(
      DEMO_CAREERS.map(c => ({
        name: c.name,
        slug: c.slug,
        tagline: c.tagline,
        description: c.description,
        whatThisRoleDoes: c.whatThisRoleDoes,
        demandLevel: c.demandLevel,
        salaryMin: c.salaryMin,
        salaryMax: c.salaryMax,
        salaryUnit: c.salaryUnit,
        experienceLevel: c.experienceLevel,
        totalJobs: c.totalJobs,
        growthRate: c.growthRate,
        icon: c.icon,
        color: c.color,
        careerPathway: c.careerPathway,
        typicalRequirements: c.typicalRequirements,
      }))
    ).returning();

    const careerIdMap: Record<number, number> = {};
    DEMO_CAREERS.forEach((c, i) => {
      careerIdMap[c.id] = insertedCareers[i].id;
    });

    // Seed career skills
    const careerSkillRows: {
      careerId: number;
      skillId: number;
      importance: "essential" | "important" | "helpful";
      categoryLabel: string;
      order: number;
    }[] = [];
    DEMO_CAREERS.forEach(career => {
      career.skills.forEach((cs, order) => {
        if (careerIdMap[career.id] && skillIdMap[cs.skill.id]) {
          careerSkillRows.push({
            careerId: careerIdMap[career.id],
            skillId: skillIdMap[cs.skill.id],
            importance: cs.importance,
            categoryLabel: cs.categoryLabel,
            order,
          });
        }
      });
    });
    if (careerSkillRows.length > 0) {
      await db.insert(careerSkills).values(careerSkillRows);
    }

    // Seed companies
    const insertedCompanies = await db.insert(companies).values(
      DEMO_COMPANIES.map(c => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        industry: c.industry,
        size: c.size,
        location: c.location,
        logoInitials: c.logoInitials,
        logoColor: c.logoColor,
        verified: c.verified,
      }))
    ).returning();

    const companyIdMap: Record<number, number> = {};
    DEMO_COMPANIES.forEach((c, i) => {
      companyIdMap[c.id] = insertedCompanies[i].id;
    });

    // Seed jobs
    const insertedJobs = await db.insert(jobs).values(
      DEMO_JOBS.map(j => ({
        title: j.title,
        companyId: companyIdMap[j.company.id],
        careerId: careerIdMap[j.career.id],
        description: j.description,
        location: j.location,
        workType: j.workType,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryUnit: j.salaryUnit,
        experienceMin: j.experienceMin,
        experienceMax: j.experienceMax,
        status: "active" as const,
      }))
    ).returning();

    const jobIdMap: Record<number, number> = {};
    DEMO_JOBS.forEach((j, i) => {
      jobIdMap[j.id] = insertedJobs[i].id;
    });

    // Seed job skills
    const jobSkillRows: {
      jobId: number;
      skillId: number;
      importance: "essential" | "important" | "helpful";
    }[] = [];
    DEMO_JOBS.forEach(job => {
      job.skills.forEach(({ skill, importance }) => {
        if (jobIdMap[job.id] && skillIdMap[skill.id]) {
          jobSkillRows.push({
            jobId: jobIdMap[job.id],
            skillId: skillIdMap[skill.id],
            importance,
          });
        }
      });
    });
    if (jobSkillRows.length > 0) {
      await db.insert(jobSkills).values(jobSkillRows);
    }

    // Seed assessments
    await db.insert(assessments).values(
      DEMO_ASSESSMENTS.map(a => ({
        title: a.title,
        type: "mcq" as const,
        description: a.description,
        duration: a.duration,
        questions: a.questions,
        passingScore: a.passingScore,
      }))
    );

    // Seed projects
    await db.insert(projects).values(
      DEMO_PROJECTS.map(p => ({
        title: p.title,
        description: p.description,
        skills: p.skills,
        difficulty: p.difficulty,
        estimatedHours: p.estimatedHours,
        instructions: p.instructions,
        deliverables: p.deliverables,
      }))
    );

    // Seed learning resources
    await db.insert(learningResources).values(
      DEMO_LEARNING_RESOURCES.map(r => ({
        title: r.title,
        type: r.type,
        provider: r.provider,
        duration: r.duration,
        level: r.level as "beginner" | "intermediate" | "advanced" | "expert",
        free: r.free,
        description: r.description,
      }))
    );

    return Response.json({
      ok: true,
      message: "Database seeded successfully",
      counts: {
        skillCategories: cats.length,
        skills: insertedSkills.length,
        careers: insertedCareers.length,
        companies: insertedCompanies.length,
        jobs: insertedJobs.length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
