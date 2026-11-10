"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  GitBranch,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { PortfolioProjectView } from "@/lib/services/portfolio-service";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/States";
import { cn } from "@/lib/utils";

type CatalogueProject = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  estimatedHours: number | null;
  skillSlugs: string[];
  deliverables: string[];
  careerName: string | null;
  instructions: string | null;
};

interface ProjectForm {
  id: number | null;
  title: string;
  description: string;
  skills: string;
  projectUrl: string;
  repositoryUrl: string;
  reflection: string;
  status: "planned" | "in_progress" | "completed";
  isPublic: boolean;
}

const BLANK: ProjectForm = {
  id: null,
  title: "",
  description: "",
  skills: "",
  projectUrl: "",
  repositoryUrl: "",
  reflection: "",
  status: "planned",
  isPublic: true,
};

const STATUS_LABEL: Record<string, string> = {
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
};

export function ProjectsWorkspace({
  initialProjects,
  initialCatalogue,
  targetCareer,
}: {
  initialProjects: PortfolioProjectView[];
  initialCatalogue: CatalogueProject[];
  targetCareer: string | null;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [catalogue, setCatalogue] = useState(initialCatalogue);
  const [tab, setTab] = useState<"mine" | "catalogue">(initialProjects.length > 0 ? "mine" : "catalogue");
  const [form, setForm] = useState<ProjectForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PortfolioProjectView | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await apiFetch<{ projects: PortfolioProjectView[]; catalogue: CatalogueProject[] }>(
        "/api/projects",
      );
      setProjects(data.projects);
      setCatalogue(data.catalogue);
    } catch {
      // A stale list is safer than a failed flash after a successful write.
    }
  }

  async function run(key: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(key);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function addCatalogueProject(project: CatalogueProject) {
    await run(`add-${project.id}`, async () => {
      await apiFetch("/api/projects", { method: "POST", json: { projectId: project.id } });
      setNotice(`“${project.title}” added to your portfolio as a planned project.`);
      setTab("mine");
      await refresh();
    });
  }

  async function saveProject(draft: ProjectForm) {
    await run("save", async () => {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        skillSlugs: draft.skills
          .split(",")
          .map((value) => value.trim().toLowerCase().replace(/\s+/g, "-"))
          .filter(Boolean)
          .slice(0, 12),
        projectUrl: draft.projectUrl.trim() || null,
        repositoryUrl: draft.repositoryUrl.trim() || null,
        reflection: draft.reflection.trim() || null,
        status: draft.status,
        isPublic: draft.isPublic,
      };
      if (draft.id) {
        await apiFetch(`/api/projects/${draft.id}`, { method: "PATCH", json: payload });
      } else {
        await apiFetch("/api/projects", { method: "POST", json: payload });
      }
      setForm(null);
      setNotice(
        draft.status === "completed"
          ? "Project completed and recorded in your portfolio. The skills remain self-attested until verified."
          : "Project saved.",
      );
      await refresh();
    });
  }

  async function updateStatus(project: PortfolioProjectView, status: string) {
    await run(`status-${project.id}`, async () => {
      await apiFetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        json: { status },
      });
      setNotice(
        status === "completed"
          ? "Project marked complete. It now appears in your portfolio as self-attested work."
          : "Project status updated.",
      );
      await refresh();
    });
  }

  async function remove(project: PortfolioProjectView) {
    await run("delete", async () => {
      await apiFetch(`/api/projects/${project.id}`, { method: "DELETE" });
      setConfirmDelete(null);
      setNotice("Project removed from your portfolio.");
      await refresh();
    });
  }

  const addedTitles = new Set(projects.map((project) => project.title));
  const completed = projects.filter((project) => project.status === "completed").length;

  return (
    <div className="app-page">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Projects</p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3rem)] leading-[1.02] tracking-[-0.02em]">
            Proof of work.
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
            Finished projects with clear deliverables are the most credible evidence you can build
            without an employer. {completed > 0 ? `${completed} completed.` : "None completed yet."}
          </p>
        </div>
        <Button size="md" onClick={() => setForm({ ...BLANK })}>
          <Plus size={15} aria-hidden />
          Add your own project
        </Button>
      </header>

      {(error || notice) && (
        <div
          role={error ? "alert" : "status"}
          className={cn(
            "mt-5 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-[12.5px]",
            error ? "border-rust/20 bg-rust-soft text-rust" : "border-moss/20 bg-moss-soft text-moss",
          )}
        >
          <p>{error ?? notice}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setNotice(null);
            }}
            className="shrink-0 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 border-b border-line">
        <div role="tablist" aria-label="Project views" className="flex gap-5">
          {(
            [
              ["mine", `My work (${projects.length})`],
              ["catalogue", "Project library"],
            ] as ["mine" | "catalogue", string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "relative -mb-px border-b-2 pb-3 text-[12.5px] font-medium transition-colors",
                tab === value ? "border-ink text-ink" : "border-transparent text-muted hover:text-graphite",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Link href="/portfolio" className="hidden items-center gap-1 pb-3 text-[11.5px] font-medium text-muted hover:text-ink sm:flex">
          View portfolio
          <ArrowRight size={12} aria-hidden />
        </Link>
      </div>

      {tab === "mine" && (
        <div className="mt-6">
          {projects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              message="Start with one project from the library, or add work you have already completed."
              action={
                <Button size="sm" onClick={() => setTab("catalogue")}>
                  Browse the library
                </Button>
              }
              icon={<FolderGit2 size={18} aria-hidden />}
            />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {projects.map((project) => (
                <li key={project.id} className="flex flex-col rounded-lg border border-line bg-paper p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge size="sm" variant={project.status === "completed" ? "green" : project.status === "in_progress" ? "yellow" : "outline"}>
                        {STATUS_LABEL[project.status]}
                      </Badge>
                      {project.verified && <Badge size="sm" variant="dark">Verified</Badge>}
                      {project.source === "catalogue" && <span className="text-[10px] text-faint">From library</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            id: project.id,
                            title: project.title,
                            description: project.description ?? "",
                            skills: project.skillSlugs.join(", "),
                            projectUrl: project.projectUrl ?? "",
                            repositoryUrl: project.repositoryUrl ?? "",
                            reflection: project.reflection ?? "",
                            status: project.status,
                            isPublic: project.isPublic,
                          })
                        }
                        className="flex h-7 w-7 items-center justify-center rounded text-faint hover:bg-paper-3 hover:text-ink"
                        aria-label={`Edit ${project.title}`}
                      >
                        <Pencil size={13} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(project)}
                        className="flex h-7 w-7 items-center justify-center rounded text-faint hover:bg-rust-soft hover:text-rust"
                        aria-label={`Delete ${project.title}`}
                      >
                        <Trash2 size={13} aria-hidden />
                      </button>
                    </div>
                  </div>

                  <h2 className="mt-3 font-display text-[24px] leading-tight text-ink">{project.title}</h2>
                  {project.description && (
                    <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-muted">
                      {project.description}
                    </p>
                  )}

                  {project.skillSlugs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.skillSlugs.slice(0, 5).map((slug) => (
                        <span key={slug} className="rounded-[3px] bg-paper-3 px-1.5 py-0.5 text-[10px] text-graphite">
                          {slug.replace(/-/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}

                  {project.reflection && (
                    <p className="mt-3 border-l-2 border-line-strong pl-3 text-[11.5px] leading-relaxed text-graphite">
                      {project.reflection}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                    <select
                      value={project.status}
                      onChange={(event) => void updateStatus(project, event.target.value)}
                      disabled={busy !== null}
                      aria-label={`Status for ${project.title}`}
                      className="hb-input h-8 max-w-[150px] py-0 text-[11px]"
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-ink"
                      >
                        <ExternalLink size={11} aria-hidden />
                        Live project
                      </a>
                    )}
                    {project.repositoryUrl && (
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-ink"
                      >
                        <GitBranch size={11} aria-hidden />
                        Repository
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "catalogue" && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-muted">
              {targetCareer ? `Projects relevant to ${targetCareer}` : "All catalogue projects"}
            </p>
            <p className="text-[10.5px] text-faint">Illustrative project catalogue</p>
          </div>
          {catalogue.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No catalogue projects for this career"
                message="Add your own project instead. Real work you have already done counts."
                action={<Button size="sm" onClick={() => setForm({ ...BLANK })}>Add a project</Button>}
              />
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catalogue.map((project) => {
                const added = addedTitles.has(project.title);
                return (
                  <li key={project.id} className="flex flex-col rounded-lg border border-line bg-paper p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                        {project.difficulty ?? "Project"}
                      </span>
                      <span className="text-[10px] text-faint">~{project.estimatedHours ?? 10}h</span>
                    </div>
                    <h2 className="mt-2 text-[14px] font-semibold leading-snug text-ink">{project.title}</h2>
                    <p className="mt-1.5 flex-1 text-[11.5px] leading-relaxed text-muted">
                      {project.description}
                    </p>
                    {project.deliverables.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {project.deliverables.slice(0, 3).map((deliverable) => (
                          <li key={deliverable} className="flex gap-1.5 text-[10.5px] leading-relaxed text-graphite">
                            <CheckCircle2 size={10} className="mt-0.5 shrink-0 text-faint" aria-hidden />
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {project.skillSlugs.slice(0, 4).map((slug) => (
                        <span key={slug} className="rounded-[3px] bg-paper-3 px-1.5 py-0.5 text-[9.5px] text-graphite">
                          {slug.replace(/-/g, " ")}
                        </span>
                      ))}
                    </div>
                    <Button
                      variant={added ? "ghost" : "secondary"}
                      size="sm"
                      className="mt-4 w-full"
                      disabled={added || busy !== null}
                      onClick={() => void addCatalogueProject(project)}
                    >
                      {busy === `add-${project.id}` ? (
                        <Loader2 size={12} className="animate-spin" aria-hidden />
                      ) : added ? (
                        <Check size={12} aria-hidden />
                      ) : (
                        <Plus size={12} aria-hidden />
                      )}
                      {added ? "In your portfolio" : "Add to my portfolio"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <section className="mt-9 flex flex-col gap-4 rounded-lg border border-line bg-paper-2 p-5 sm:flex-row sm:items-start">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
        <div>
          <p className="text-[12.5px] font-medium text-ink">What completion does and does not mean</p>
          <p className="mt-1 max-w-3xl text-[11.5px] leading-relaxed text-muted">
            Completing a project records self-attested evidence against the skills you list. It does
            not create a verified skill level. Verification requires an assessment or employer
            review. You can keep a project private from your public portfolio at any time.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <ButtonLink href="/assessments" variant="secondary" size="sm">
              <ShieldCheck size={12} aria-hidden />
              Try an assessment
            </ButtonLink>
            <ButtonLink href="/portfolio" variant="ghost" size="sm">
              Open portfolio
              <ArrowRight size={12} aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </section>

      <Modal
        open={form !== null}
        onOpenChange={(open) => !open && setForm(null)}
        title={form?.id ? "Edit project" : "Add a project"}
        description="Describe what you built, not what you intended to build."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            <Button onClick={() => form && void saveProject(form)} disabled={!form?.title.trim() || busy !== null}>
              {busy === "save" ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
              {form?.id ? "Save project" : "Add to portfolio"}
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="project-title" className="hb-label">Project title</label>
              <input
                id="project-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="hb-input"
                placeholder="e.g. Sales performance dashboard"
                maxLength={200}
                autoFocus
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="project-description" className="hb-label">What is it?</label>
              <textarea
                id="project-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="hb-input"
                rows={3}
                placeholder="The problem, who it is for, what it does."
                maxLength={6000}
              />
            </div>
            <div>
              <label htmlFor="project-skills" className="hb-label">Skills demonstrated</label>
              <input
                id="project-skills"
                value={form.skills}
                onChange={(event) => setForm({ ...form, skills: event.target.value })}
                className="hb-input"
                placeholder="sql, data-analysis, power-bi"
              />
              <p className="mt-1 text-[10px] text-faint">Comma-separated skill slugs.</p>
            </div>
            <div>
              <label htmlFor="project-status" className="hb-label">Status</label>
              <select
                id="project-status"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as ProjectForm["status"] })}
                className="hb-input"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label htmlFor="project-live" className="hb-label">Live project URL</label>
              <input
                id="project-live"
                type="url"
                value={form.projectUrl}
                onChange={(event) => setForm({ ...form, projectUrl: event.target.value })}
                className="hb-input"
                placeholder="https://"
              />
            </div>
            <div>
              <label htmlFor="project-repo" className="hb-label">Repository URL</label>
              <input
                id="project-repo"
                type="url"
                value={form.repositoryUrl}
                onChange={(event) => setForm({ ...form, repositoryUrl: event.target.value })}
                className="hb-input"
                placeholder="https://"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="project-reflection" className="hb-label">Reflection</label>
              <textarea
                id="project-reflection"
                value={form.reflection}
                onChange={(event) => setForm({ ...form, reflection: event.target.value })}
                className="hb-input"
                rows={3}
                placeholder="One decision you made, one thing that failed, what you would do differently."
                maxLength={6000}
              />
            </div>
            <label className="flex items-start gap-2.5 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(event) => setForm({ ...form, isPublic: event.target.checked })}
                className="mt-0.5 h-4 w-4 accent-ink"
              />
              <span>
                <span className="block text-[12px] font-medium text-ink">Show on public portfolio</span>
                <span className="block text-[10.5px] text-muted">
                  Only applies when your portfolio itself is public.
                </span>
              </span>
            </label>
          </div>
        )}
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Remove this project?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Keep it</Button>
            <Button variant="danger" onClick={() => confirmDelete && void remove(confirmDelete)} disabled={busy !== null}>
              Remove project
            </Button>
          </>
        }
      >
        <p className="text-[12.5px] leading-relaxed text-graphite">
          “{confirmDelete?.title}” and its self-attested evidence will be removed from your portfolio.
          This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
