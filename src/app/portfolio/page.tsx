import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FolderGit2,
  Globe2,
  Link2,
  MapPin,
  Pencil,
  ShieldCheck,
  Target,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getPortfolioForUser } from "@/lib/services/portfolio-service";
import { PassportPrivacyControls } from "@/components/passport/PassportPrivacyControls";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Panel, SectionHeader, Stat } from "@/components/ui/AppPage";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cn, formatSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "A professional record of your skills, projects and learning progress.",
};

export default async function PortfolioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/portfolio");

  let portfolio;
  try {
    portfolio = await getPortfolioForUser(user.id);
  } catch (error) {
    console.error("[portfolio] failed to load", error);
    return (
      <main id="main-content" className="app-page">
        <p className="eyebrow mb-3">Portfolio</p>
        <h1 className="display-md">Your portfolio could not be loaded.</h1>
        <div className="mt-6">
          <ErrorState message="Your evidence is safe. Please retry in a moment." />
        </div>
      </main>
    );
  }

  const completedProjects = portfolio.projects.filter((project) => project.status === "completed");
  const checklist = [
    { label: "Professional headline", done: Boolean(portfolio.profile.headline) },
    { label: "Short introduction", done: Boolean(portfolio.profile.about) },
    { label: "At least one completed project", done: completedProjects.length > 0 },
    { label: "At least one verified skill", done: portfolio.skills.length > 0 },
    { label: "A professional link", done: portfolio.profile.links.length > 0 },
  ];
  const checklistDone = checklist.filter((item) => item.done).length;

  return (
    <main id="main-content" className="app-page">
      {/* Identity */}
      <section className="hb-tile hb-tile-white animate-rise p-6 sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:gap-6">
            <span className="hb-avatar h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl">
              {portfolio.profile.initials}
            </span>
            <div className="min-w-0">
              <p className="eyebrow">Portfolio</p>
              <h1 className="display-md mt-2 text-ink">{portfolio.profile.name}</h1>
              {portfolio.profile.headline ? (
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-graphite">
                  {portfolio.profile.headline}
                </p>
              ) : (
                <Link href="/profile" className="hb-link mt-2 text-md">
                  Add your professional headline
                  <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
                </Link>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
                {portfolio.career && (
                  <span className="flex items-center gap-1.5">
                    <Target size={14} aria-hidden />
                    {portfolio.career.name}
                  </span>
                )}
                {portfolio.profile.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} aria-hidden />
                    {portfolio.profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Globe2 size={14} aria-hidden />
                  {portfolio.isPublic ? "Public portfolio" : "Private portfolio"}
                </span>
              </div>
              {portfolio.profile.links.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
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
                      <ArrowUpRight size={13} aria-hidden />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            <ButtonLink href="/profile" variant="secondary" size="md">
              <Pencil size={15} aria-hidden />
              Edit profile
            </ButtonLink>
            {portfolio.isPublic && portfolio.publicId ? (
              <ButtonLink href={`/passport/${portfolio.publicId}`} size="md" target="_blank">
                <Globe2 size={15} aria-hidden />
                View public page
              </ButtonLink>
            ) : (
              <ButtonLink href="#visibility" size="md">
                <Globe2 size={15} aria-hidden />
                Make public
              </ButtonLink>
            )}
          </div>
        </div>
      </section>

      <section className="stagger mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-4" aria-label="Portfolio summary">
        <Stat label="Verified skills" value={portfolio.stats.verifiedSkills} accent="moss" />
        <Stat label="Projects completed" value={portfolio.stats.projectsCompleted} />
        <Stat label="Milestones" value={portfolio.stats.milestonesCompleted} />
        <Stat label="Tasks completed" value={portfolio.stats.tasksCompleted} />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          {/* About */}
          <Panel>
            <SectionHeader title="Professional introduction" />
            {portfolio.profile.about ? (
              <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-graphite">
                {portfolio.profile.about}
              </p>
            ) : (
              <div className="mt-4 rounded-md bg-paper-2 p-5">
                <p className="max-w-2xl text-sm leading-relaxed text-muted">
                  A portfolio without context is a list of files. Write two or three sentences about
                  the direction you are building toward and the kind of work you want to do.
                </p>
                <Link href="/profile" className="hb-link mt-3 text-sm">
                  Write introduction
                  <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                </Link>
              </div>
            )}
          </Panel>

          {/* Skills */}
          <Panel>
            <SectionHeader
              title="Skills and evidence"
              action={
                <Link href="/skills" className="hb-link text-sm">
                  Skill workspace
                  <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                </Link>
              }
            />
            {portfolio.skills.length === 0 && portfolio.selfReportedSkills.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="No skills evidenced yet"
                  message="Take an assessment or complete a project to begin building evidence. Claims alone never create a verified score."
                  action={<ButtonLink href="/assessments" size="md">Prove a skill</ButtonLink>}
                  icon={<ShieldCheck size={20} aria-hidden />}
                />
              </div>
            ) : (
              <>
                {portfolio.skills.length > 0 && (
                  <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {portfolio.skills.map((skill) => (
                      <li key={skill.slug} className="rounded-md bg-paper-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-md font-medium text-ink">{skill.name}</p>
                          <span className="tabular shrink-0 text-md font-semibold text-moss">{skill.score}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {formatSlug(skill.level)} · {skill.evidenceCount} evidence
                          {skill.evidenceCount === 1 ? "" : " entries"}
                          {skill.assessmentCount > 0 ? ` · ${skill.assessmentCount} assessed` : ""}
                        </p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-4">
                          <div className="h-full rounded-full bg-moss" style={{ width: `${skill.score}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {portfolio.selfReportedSkills.length > 0 && (
                  <div className="mt-5 border-t border-line pt-5">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                      <ShieldCheck size={15} className="text-muted" aria-hidden />
                      Self-reported, not verified
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      These claims are recorded but do not count toward your verified skill level.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {portfolio.selfReportedSkills.map((skill) => (
                        <span key={skill.slug} className="rounded-full bg-paper-2 px-2.5 py-1 text-xs text-graphite">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Panel>

          {/* Projects */}
          <Panel>
            <SectionHeader
              title="Projects"
              action={
                <Link href="/projects" className="hb-link text-sm">
                  Manage projects
                  <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                </Link>
              }
            />
            {portfolio.projects.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Your portfolio is waiting for its first project."
                  message="Finished work with a short reflection is more persuasive than a long list of courses."
                  action={<ButtonLink href="/projects" size="md">Choose a project</ButtonLink>}
                  icon={<FolderGit2 size={20} aria-hidden />}
                />
              </div>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {portfolio.projects.map((project) => (
                  <li key={project.id} className="py-5 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge size="sm" variant={project.status === "completed" ? "green" : project.status === "in_progress" ? "yellow" : "outline"}>
                            {formatSlug(project.status)}
                          </Badge>
                          {project.verified && <Badge size="sm" variant="blue">Verified</Badge>}
                        </div>
                        <h3 className="mt-2.5 text-xl font-semibold leading-tight tracking-[-0.02em] text-ink">
                          {project.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        {project.projectUrl && (
                          <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="hb-link text-sm">
                            <ExternalLink size={14} aria-hidden /> Live
                          </a>
                        )}
                        {project.repositoryUrl && (
                          <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="hb-link text-sm">
                            <Link2 size={14} aria-hidden /> Code
                          </a>
                        )}
                      </div>
                    </div>
                    {project.description && (
                      <p className="mt-2 max-w-3xl text-md leading-relaxed text-muted">{project.description}</p>
                    )}
                    {project.reflection && (
                      <blockquote className="mt-3 max-w-3xl rounded-md bg-paper-2 px-4 py-3 text-sm leading-relaxed text-graphite">
                        {project.reflection}
                      </blockquote>
                    )}
                    {project.skillSlugs.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.skillSlugs.map((slug) => (
                          <span key={slug} className="rounded-full bg-paper-2 px-2.5 py-1 text-xs text-graphite">
                            {formatSlug(slug)}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Milestones */}
          <Panel>
            <SectionHeader title="Learning milestones" />
            {portfolio.milestones.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                No milestones completed yet. Your roadmap records the ones you finish.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {portfolio.milestones.map((milestone) => (
                  <li key={milestone.title} className="flex items-start gap-3 py-3 last:pb-0">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-moss" aria-hidden />
                    <span className="min-w-0 flex-1 text-md leading-relaxed text-ink">{milestone.title}</span>
                    <span className="shrink-0 pt-0.5 text-xs text-muted">
                      {new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(new Date(milestone.completedAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Activity */}
          {portfolio.activity.length > 0 && (
            <Panel>
              <SectionHeader title="Recent activity" />
              <ol className="mt-4 space-y-3.5">
                {portfolio.activity.slice(0, 6).map((item) => (
                  <li key={item.id} className="flex items-start gap-3 text-md">
                    <span
                      className={cn(
                        "mt-[7px] h-2 w-2 shrink-0 rounded-full",
                        item.type === "project" ? "bg-ochre" : item.type === "milestone" ? "bg-moss" : "bg-accent",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 text-ink">{item.label}</span>
                    <span className="shrink-0 pt-0.5 text-xs text-muted">
                      {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(item.at))}
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[76px] lg:space-y-5 lg:self-start">
          <div className="hb-card p-6">
            <div className="flex items-baseline justify-between">
              <p className="text-base font-semibold text-ink">Portfolio strength</p>
              <span className="tabular text-xl font-semibold tracking-[-0.02em] text-ink">
                {checklistDone}
                <span className="text-muted">/5</span>
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-3" aria-hidden>
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-out-expo"
                style={{ width: `${(checklistDone / 5) * 100}%` }}
              />
            </div>
            <ul className="mt-4 space-y-2.5">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={cn(
                      "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                      item.done ? "bg-moss text-white" : "ring-[1.5px] ring-inset ring-line-strong",
                    )}
                    aria-hidden
                  >
                    {item.done && <Check size={11} strokeWidth={3.2} />}
                  </span>
                  <span className={item.done ? "text-muted" : "text-ink"}>
                    {item.label}
                    <span className="sr-only">{item.done ? " (done)" : " (not done yet)"}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              A checklist, not a score. Nothing here is shared with an employer unless you enable it.
            </p>
          </div>

          <PassportPrivacyControls
            publicId={portfolio.publicId}
            isPublic={portfolio.isPublic}
            visibility={portfolio.visibility}
          />

          {portfolio.career && (
            <div className="hb-card p-6">
              <p className="text-sm font-medium text-muted">Career objective</p>
              <p className="mt-1.5 text-xl font-semibold leading-tight tracking-[-0.02em] text-ink">
                {portfolio.career.name}
              </p>
              <Link href="/journey" className="hb-link mt-3 text-sm">
                View roadmap
                <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
