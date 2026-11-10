import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Globe2,
  Link2,
  MapPin,
  ShieldCheck,
  Target,
} from "lucide-react";
import { getPublicPassport } from "@/lib/services/passport-service";
import { getPublicPortfolio } from "@/lib/services/portfolio-service";
import { PassportSkillList } from "@/components/passport/PassportSkillList";


export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Public portfolio",
  robots: { index: false },
};

/**
 * Portable, shareable page.
 *
 * Only renders what the candidate explicitly chose to expose. No email, phone,
 * internal notes or hidden assessment data is ever included here.
 */
export default async function PublicPassportPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  let passport: Awaited<ReturnType<typeof getPublicPassport>>;
  let portfolio: Awaited<ReturnType<typeof getPublicPortfolio>>;
  try {
    [passport, portfolio] = await Promise.all([
      getPublicPassport(publicId),
      getPublicPortfolio(publicId),
    ]);
  } catch {
    notFound();
  }

  const completedProjects = portfolio.projects.filter((project) => project.status === "completed");
  const verifiedSkills = passport.skills.filter((skill) => skill.verificationStatus !== "self_reported");
  const milestones = portfolio.milestones;

  return (
    <main id="main-content" className="min-h-full bg-paper-2">
      <section className="border-b border-line bg-paper">
        <div className="mx-auto w-full max-w-[900px] px-5 py-9 sm:px-8 sm:py-12">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-line bg-paper-2 px-2 py-1 text-[9.5px] font-medium uppercase tracking-[0.12em] text-graphite">
              <Globe2 size={10} aria-hidden />
              Public portfolio
            </span>
            <span className="text-[9.5px] text-faint">Shared by the candidate · sections they enabled only</span>
          </div>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[6px] bg-ink font-display text-[22px] text-paper">
                {portfolio.profile.initials}
              </span>
              <div className="min-w-0">
                <h1 className="font-display text-[clamp(2rem,4.4vw,2.9rem)] leading-[1.03] tracking-[-0.02em]">
                  {passport.ownerName}
                </h1>
                {portfolio.profile.headline && (
                  <p className="mt-1.5 max-w-[560px] text-[12.5px] leading-relaxed text-graphite">
                    {portfolio.profile.headline}
                  </p>
                )}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted">
                  {passport.targetRole && (
                    <span className="flex items-center gap-1.5">
                      <Target size={11} aria-hidden />
                      Targeting {passport.targetRole}
                    </span>
                  )}
                  {portfolio.profile.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={11} aria-hidden />
                      {portfolio.profile.location}
                    </span>
                  )}
                </div>
                {portfolio.profile.links.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                    {portfolio.profile.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer me"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-ink underline decoration-line-strong underline-offset-4"
                      >
                        <Link2 size={10} aria-hidden />
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line sm:w-[250px]">
              {[
                ["Readiness", String(passport.readiness)],
                ["Verified", String(verifiedSkills.length)],
                ["Projects", String(completedProjects.length)],
              ].map(([label, value]) => (
                <div key={label} className="bg-paper px-2.5 py-2.5 text-center">
                  <p className="font-display text-[20px] leading-none tabular text-ink">{value}</p>
                  <p className="mt-1 text-[8.5px] uppercase tracking-[0.1em] text-faint">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[900px] space-y-7 px-5 py-8 sm:px-8">
        {portfolio.profile.about && (
          <section>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Introduction</h2>
            <p className="mt-2.5 max-w-3xl whitespace-pre-line text-[12.5px] leading-[1.8] text-graphite">
              {portfolio.profile.about}
            </p>
          </section>
        )}

        {passport.skills.length > 0 && (
          <section>
            <div className="flex items-end justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <ShieldCheck size={14} aria-hidden />
                Skills and evidence
              </h2>
              <span className="text-[9.5px] uppercase tracking-[0.1em] text-faint">
                {verifiedSkills.length} verified
              </span>
            </div>
            <p className="mt-1 text-[10.5px] leading-relaxed text-muted">
              Verified means an assessment or employer review produced the score. Self-reported claims
              are labelled and never counted as verified.
            </p>
            <div className="mt-3">
              <PassportSkillList skills={passport.skills} />
            </div>
          </section>
        )}

        {completedProjects.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <FolderGit2 size={14} aria-hidden />
              Projects
            </h2>
            <ul className="mt-3 space-y-3">
              {completedProjects.map((project) => (
                <li key={project.id} className="rounded-lg border border-line bg-paper p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-display text-[21px] leading-tight text-ink">{project.title}</h3>
                    <div className="flex items-center gap-2">
                      {project.projectUrl && (
                        <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10.5px] font-medium text-ink">
                          <ExternalLink size={10} aria-hidden /> Live
                        </a>
                      )}
                      {project.repositoryUrl && (
                        <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10.5px] font-medium text-ink">
                          <Link2 size={10} aria-hidden /> Code
                        </a>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{project.description}</p>
                  )}
                  {project.reflection && (
                    <blockquote className="mt-2.5 border-l-2 border-line-strong pl-3 text-[11px] leading-relaxed text-graphite">
                      {project.reflection}
                    </blockquote>
                  )}
                  {project.skillSlugs.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {project.skillSlugs.map((skill) => (
                        <span key={skill} className="rounded-[3px] bg-paper-3 px-1.5 py-0.5 text-[9.5px] text-graphite">
                          {skill.replace(/-/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2.5 text-[9px] text-faint">
                    Self-attested project work. Completion does not create a verified skill score.
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {milestones.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <CheckCircle2 size={14} aria-hidden />
              Learning journey
            </h2>
            <ul className="mt-2.5 divide-y divide-line">
              {milestones.map((milestone) => (
                <li key={milestone.title} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2 text-[11.5px] text-graphite">
                    <CheckCircle2 size={11} className="text-moss" aria-hidden />
                    {milestone.title}
                  </span>
                  <span className="shrink-0 text-[9.5px] text-faint">
                    {new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(new Date(milestone.completedAt))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {passport.assessments.length > 0 && (
          <section>
            <h2 className="text-[13px] font-semibold text-ink">Assessment history</h2>
            <ul className="mt-2.5 divide-y divide-line rounded-lg border border-line bg-paper">
              {passport.assessments
                .filter((assessment) => assessment.completedAt)
                .map((assessment, index) => (
                  <li key={index} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[11.5px]">
                    <span className="text-graphite">
                      {assessment.title} <span className="text-[9.5px] text-faint">v{assessment.version}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {assessment.readinessScore !== null && (
                        <span className="tabular text-ink">{assessment.readinessScore}</span>
                      )}
                      <span className={assessment.passed ? "text-moss" : "text-muted"}>
                        {assessment.passed ? "Passed" : assessment.status}
                      </span>
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <p className="rounded-md border border-line bg-paper p-4 text-[10.5px] leading-relaxed text-muted">
          {passport.evidenceDisclaimer} A score is a comparison against a rubric, not a prediction of
          being hired. This page shows only the sections the candidate enabled.
        </p>
      </div>
    </main>
  );
}
