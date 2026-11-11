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
import { Panel, SectionHeader } from "@/components/ui/AppPage";
import { formatSlug } from "@/lib/utils";

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
    <main id="main-content" className="app-page app-page-narrow">
      <section className="hb-tile hb-tile-white animate-rise p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-xs font-medium text-link">
            <Globe2 size={13} aria-hidden />
            Public portfolio
          </span>
          <span className="text-xs text-muted">Shared by the candidate · sections they enabled only</span>
        </div>

        <div className="mt-7 flex items-start gap-4 sm:gap-5">
          <span className="hb-avatar h-14 w-14 shrink-0 text-xl sm:h-16 sm:w-16">{portfolio.profile.initials}</span>
          <div className="min-w-0">
            <h1 className="display-md text-ink">{passport.ownerName}</h1>
            {portfolio.profile.headline && (
              <p className="mt-2 max-w-[600px] text-base leading-relaxed text-graphite">
                {portfolio.profile.headline}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted">
              {passport.targetRole && (
                <span className="flex items-center gap-1.5">
                  <Target size={15} aria-hidden />
                  Targeting {passport.targetRole}
                </span>
              )}
              {portfolio.profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={15} aria-hidden />
                  {portfolio.profile.location}
                </span>
              )}
            </div>
            {portfolio.profile.links.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                {portfolio.profile.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="hb-link text-sm"
                  >
                    <Link2 size={14} aria-hidden />
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-3">
          {[
            ["Readiness", String(passport.readiness)],
            ["Verified", String(verifiedSkills.length)],
            ["Projects", String(completedProjects.length)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-paper-2 px-4 py-4 sm:px-5">
              <dt className="text-xs font-medium text-muted">{label}</dt>
              <dd className="stat-value mt-1.5 text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-4 space-y-4 sm:mt-5 lg:space-y-5">
        {portfolio.profile.about && (
          <Panel>
            <SectionHeader title="Introduction" />
            <p className="mt-3 max-w-3xl whitespace-pre-line text-base leading-relaxed text-graphite">
              {portfolio.profile.about}
            </p>
          </Panel>
        )}

        {passport.skills.length > 0 && (
          <Panel>
            <SectionHeader
              title={
                <span className="flex items-center gap-2.5">
                  <ShieldCheck size={20} className="text-moss" aria-hidden />
                  Skills and evidence
                </span>
              }
              description="Verified means an assessment or employer review produced the score. Self-reported claims are labelled and never counted as verified."
              action={<span className="tabular text-sm text-muted">{verifiedSkills.length} verified</span>}
            />
            <div className="mt-5">
              <PassportSkillList skills={passport.skills} />
            </div>
          </Panel>
        )}

        {completedProjects.length > 0 && (
          <Panel>
            <SectionHeader
              title={
                <span className="flex items-center gap-2.5">
                  <FolderGit2 size={20} className="text-link" aria-hidden />
                  Projects
                </span>
              }
            />
            <ul className="mt-4 space-y-3">
              {completedProjects.map((project) => (
                <li key={project.id} className="rounded-md bg-paper-2 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <h3 className="text-lg font-semibold leading-snug tracking-[-0.015em] text-ink">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-4">
                      {project.projectUrl && (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hb-link text-sm"
                        >
                          <ExternalLink size={14} aria-hidden /> Live
                        </a>
                      )}
                      {project.repositoryUrl && (
                        <a
                          href={project.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hb-link text-sm"
                        >
                          <Link2 size={14} aria-hidden /> Code
                        </a>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <p className="mt-2 text-md leading-relaxed text-graphite">{project.description}</p>
                  )}
                  {project.reflection && (
                    <blockquote className="mt-3 rounded-sm bg-paper px-4 py-3 text-sm leading-relaxed text-graphite shadow-xs">
                      {project.reflection}
                    </blockquote>
                  )}
                  {project.skillSlugs.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {project.skillSlugs.map((skill) => (
                        <span key={skill} className="rounded-full bg-paper px-2.5 py-1 text-xs text-graphite shadow-xs">
                          {formatSlug(skill)}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-3.5 text-xs leading-relaxed text-muted">
                    Self-attested project work. Completion does not create a verified skill score.
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {milestones.length > 0 && (
          <Panel>
            <SectionHeader
              title={
                <span className="flex items-center gap-2.5">
                  <CheckCircle2 size={20} className="text-moss" aria-hidden />
                  Learning journey
                </span>
              }
            />
            <ul className="mt-3 divide-y divide-line">
              {milestones.map((milestone) => (
                <li key={milestone.title} className="flex items-center justify-between gap-4 py-3">
                  <span className="flex items-center gap-2.5 text-md text-ink">
                    <CheckCircle2 size={16} className="shrink-0 text-moss" aria-hidden />
                    {milestone.title}
                  </span>
                  <span className="tabular shrink-0 text-sm text-muted">
                    {new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(new Date(milestone.completedAt))}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {passport.assessments.length > 0 && (
          <Panel>
            <SectionHeader title="Assessment history" />
            <ul className="mt-3 divide-y divide-line">
              {passport.assessments
                .filter((assessment) => assessment.completedAt)
                .map((assessment, index) => (
                  <li key={index} className="flex items-center justify-between gap-4 py-3 text-md">
                    <span className="min-w-0 text-ink">
                      {assessment.title} <span className="tabular text-xs text-muted">v{assessment.version}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      {assessment.readinessScore !== null && (
                        <span className="tabular text-base font-semibold text-ink">{assessment.readinessScore}</span>
                      )}
                      <span
                        className={
                          assessment.passed
                            ? "rounded-full bg-moss-soft px-2.5 py-1 text-xs font-medium text-moss"
                            : "rounded-full bg-paper-3 px-2.5 py-1 text-xs font-medium text-graphite"
                        }
                      >
                        {assessment.passed ? "Passed" : formatSlug(assessment.status)}
                      </span>
                    </span>
                  </li>
                ))}
            </ul>
          </Panel>
        )}

        <p className="px-1 text-xs leading-relaxed text-muted">
          {passport.evidenceDisclaimer} A score is a comparison against a rubric, not a prediction of
          being hired. This page shows only the sections the candidate enabled.
        </p>
      </div>
    </main>
  );
}
