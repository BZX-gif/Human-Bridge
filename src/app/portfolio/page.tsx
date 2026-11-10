import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
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
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/utils";

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
        <h1 className="font-display text-[clamp(2rem,4vw,2.9rem)] leading-tight">
          Your portfolio could not be loaded.
        </h1>
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
    <main id="main-content">
      {/* Identity header */}
      <section className="border-b border-line bg-paper">
        <div className="app-page pb-8 pt-7 sm:pb-10 sm:pt-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[8px] bg-ink font-display text-[26px] text-paper sm:h-20 sm:w-20 sm:text-[30px]">
                {portfolio.profile.initials}
              </span>
              <div className="min-w-0">
                <p className="eyebrow">Portfolio</p>
                <h1 className="mt-2 font-display text-[clamp(2rem,4.4vw,3rem)] leading-[1.02] tracking-[-0.02em]">
                  {portfolio.profile.name}
                </h1>
                {portfolio.profile.headline ? (
                  <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-graphite">
                    {portfolio.profile.headline}
                  </p>
                ) : (
                  <Link href="/profile" className="mt-1.5 inline-flex items-center gap-1 text-[12px] text-muted underline decoration-line underline-2 underline-offset-4 hover:text-ink">
                    Add your professional headline
                    <ArrowUpRight size={12} aria-hidden />
                  </Link>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-muted">
                  {portfolio.career && (
                    <span className="flex items-center gap-1.5">
                      <Target size={12} aria-hidden />
                      {portfolio.career.name}
                    </span>
                  )}
                  {portfolio.profile.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} aria-hidden />
                      {portfolio.profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Globe2 size={12} aria-hidden />
                    {portfolio.isPublic ? "Public portfolio" : "Private portfolio"}
                  </span>
                </div>
                {portfolio.profile.links.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                    {portfolio.profile.links.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer me"
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ink underline decoration-line-strong underline-offset-4"
                      >
                        <Link2 size={11} aria-hidden />
                        {link.label}
                        <ArrowUpRight size={10} aria-hidden />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <ButtonLink href="/profile" variant="secondary" size="md">
                <Pencil size={14} aria-hidden />
                Edit profile
              </ButtonLink>
              {portfolio.isPublic && portfolio.publicId ? (
                <ButtonLink href={`/passport/${portfolio.publicId}`} size="md" target="_blank">
                  <Globe2 size={14} aria-hidden />
                  View public page
                </ButtonLink>
              ) : (
                <ButtonLink href="#visibility" size="md">
                  <Globe2 size={14} aria-hidden />
                  Make public
                </ButtonLink>
              )}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
            {[
              { label: "Verified skills", value: portfolio.stats.verifiedSkills },
              { label: "Projects completed", value: portfolio.stats.projectsCompleted },
              { label: "Milestones", value: portfolio.stats.milestonesCompleted },
              { label: "Tasks completed", value: portfolio.stats.tasksCompleted },
            ].map((stat) => (
              <div key={stat.label} className="bg-paper px-4 py-3.5">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">{stat.label}</p>
                <p className="mt-1 font-display text-[24px] leading-none tabular text-ink">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="app-page pt-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
          <div className="min-w-0 space-y-9">
            {/* About */}
            <section>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                Professional introduction
              </h2>
              {portfolio.profile.about ? (
                <p className="mt-3 max-w-3xl whitespace-pre-line text-[13px] leading-[1.8] text-graphite">
                  {portfolio.profile.about}
                </p>
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-line-strong p-5">
                  <p className="text-[12px] leading-relaxed text-muted">
                    A portfolio without context is a list of files. Write two or three sentences about
                    the direction you are building toward and the kind of work you want to do.
                  </p>
                  <ButtonLink href="/profile" variant="secondary" size="sm" className="mt-3">
                    Write introduction
                  </ButtonLink>
                </div>
              )}
            </section>

            {/* Skills */}
            <section>
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Skills and evidence
                </h2>
                <Link href="/skills" className="text-[11px] font-medium text-muted hover:text-ink">
                  Skill workspace
                </Link>
              </div>
              {portfolio.skills.length === 0 && portfolio.selfReportedSkills.length === 0 ? (
                <div className="mt-3">
                  <EmptyState
                    title="No skills evidenced yet"
                    message="Take an assessment or complete a project to begin building evidence. Claims alone never create a verified score."
                    action={<ButtonLink href="/assessments" size="sm">Prove a skill</ButtonLink>}
                    icon={<ShieldCheck size={18} aria-hidden />}
                  />
                </div>
              ) : (
                <>
                  {portfolio.skills.length > 0 && (
                    <ul className="mt-3 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
                      {portfolio.skills.map((skill) => (
                        <li key={skill.slug} className="bg-paper p-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[12.5px] font-medium text-ink">{skill.name}</p>
                            <span className="shrink-0 text-[12px] tabular text-moss">{skill.score}</span>
                          </div>
                          <p className="mt-1 text-[10.5px] text-muted">
                            {skill.level.replace(/_/g, " ")} · {skill.evidenceCount} evidence
                            {skill.evidenceCount === 1 ? "" : " entries"}
                            {skill.assessmentCount > 0 ? ` · ${skill.assessmentCount} assessed` : ""}
                          </p>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper-3">
                            <div className="h-full rounded-full bg-moss" style={{ width: `${skill.score}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {portfolio.selfReportedSkills.length > 0 && (
                    <div className="mt-4 rounded-lg border border-line bg-paper-2 p-4">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">
                        <ShieldCheck size={11} aria-hidden />
                        Self-reported, not verified
                      </p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                        These claims are recorded but do not count toward your verified skill level.
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {portfolio.selfReportedSkills.map((skill) => (
                          <span key={skill.slug} className="rounded-[3px] border border-line bg-paper px-1.5 py-1 text-[10.5px] text-muted">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Projects */}
            <section>
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Projects
                </h2>
                <Link href="/projects" className="text-[11px] font-medium text-muted hover:text-ink">
                  Manage projects
                </Link>
              </div>
              {portfolio.projects.length === 0 ? (
                <div className="mt-3">
                  <EmptyState
                    title="Your portfolio is waiting for its first project."
                    message="Finished work with a short reflection is more persuasive than a long list of courses."
                    action={<ButtonLink href="/projects" size="sm">Choose a project</ButtonLink>}
                    icon={<FolderGit2 size={18} aria-hidden />}
                  />
                </div>
              ) : (
                <ul className="mt-3 space-y-3">
                  {portfolio.projects.map((project) => (
                    <li key={project.id} className="rounded-lg border border-line bg-paper p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge size="sm" variant={project.status === "completed" ? "green" : project.status === "in_progress" ? "yellow" : "outline"}>
                              {project.status.replace(/_/g, " ")}
                            </Badge>
                            {project.verified && <Badge size="sm" variant="dark">Verified</Badge>}
                          </div>
                          <h3 className="mt-2 font-display text-[22px] leading-tight text-ink">{project.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {project.projectUrl && (
                            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                              <ExternalLink size={11} aria-hidden /> Live
                            </a>
                          )}
                          {project.repositoryUrl && (
                            <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                              <Link2 size={11} aria-hidden /> Code
                            </a>
                          )}
                        </div>
                      </div>
                      {project.description && (
                        <p className="mt-2 text-[12px] leading-relaxed text-muted">{project.description}</p>
                      )}
                      {project.reflection && (
                        <blockquote className="mt-3 border-l-2 border-line-strong pl-3 text-[11.5px] leading-relaxed text-graphite">
                          {project.reflection}
                        </blockquote>
                      )}
                      {project.skillSlugs.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {project.skillSlugs.map((slug) => (
                            <span key={slug} className="rounded-[3px] bg-paper-3 px-1.5 py-0.5 text-[10px] text-graphite">
                              {slug.replace(/-/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Milestones */}
            <section>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                Learning milestones
              </h2>
              {portfolio.milestones.length === 0 ? (
                <p className="mt-2 text-[12px] leading-relaxed text-muted">
                  No milestones completed yet. Your roadmap records the ones you finish.
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {portfolio.milestones.map((milestone) => (
                    <li key={milestone.title} className="flex items-start gap-2.5 py-2.5">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-moss" aria-hidden />
                      <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-graphite">{milestone.title}</span>
                      <span className="shrink-0 text-[10px] text-faint">
                        {new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" }).format(new Date(milestone.completedAt))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Activity */}
            {portfolio.activity.length > 0 && (
              <section>
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                  Recent activity
                </h2>
                <ol className="mt-3 space-y-3">
                  {portfolio.activity.slice(0, 6).map((item) => (
                    <li key={item.id} className="flex items-start gap-3 text-[11.5px]">
                      <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", item.type === "project" ? "bg-ochre" : item.type === "milestone" ? "bg-moss" : "bg-ink")} aria-hidden />
                      <span className="min-w-0 flex-1 text-graphite">{item.label}</span>
                      <span className="shrink-0 text-[10px] text-faint">
                        {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(item.at))}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-lg border border-line bg-paper p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                  Portfolio strength
                </p>
                <span className="font-display text-[20px] tabular">{checklistDone}/5</span>
              </div>
              <ul className="mt-3 space-y-2">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-[11.5px]">
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-full border",
                        item.done ? "border-ink bg-ink text-paper" : "border-line-strong text-transparent",
                      )}
                      aria-hidden
                    >
                      <CheckCircle2 size={9} />
                    </span>
                    <span className={item.done ? "text-muted" : "text-graphite"}>{item.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10.5px] leading-relaxed text-faint">
                A checklist, not a score. Nothing here is shared with an employer unless you enable it.
              </p>
            </div>

            <PassportPrivacyControls
              publicId={portfolio.publicId}
              isPublic={portfolio.isPublic}
              visibility={portfolio.visibility}
            />

            {portfolio.career && (
              <div className="rounded-lg border border-line bg-paper-2 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
                  Career objective
                </p>
                <p className="mt-2 font-display text-[22px] leading-tight">{portfolio.career.name}</p>
                <Link href="/journey" className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-ink">
                  View roadmap
                  <ArrowRight size={11} aria-hidden />
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
