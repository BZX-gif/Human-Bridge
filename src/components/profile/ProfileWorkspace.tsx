"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Globe2,
  Link2,
  Loader2,
  Lock,
  Mail,
  Plus,
  Target,
  Trash2,
  UserRound,
} from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Level = "beginner" | "some_experience" | "intermediate";
type ProfessionalLink = { label: string; url: string };

interface ProfileForm {
  name: string;
  headline: string;
  about: string;
  location: string;
  links: ProfessionalLink[];
  weeklyHours: number;
  currentLevel: Level;
}

const LEVELS: { value: Level; label: string; hint: string }[] = [
  { value: "beginner", label: "Starting out", hint: "New to the field and its tools." },
  { value: "some_experience", label: "Some experience", hint: "You have tried parts of the work." },
  { value: "intermediate", label: "Working knowledge", hint: "You can do parts of the job with support." },
];

const HOURS = [3, 5, 8, 10, 15, 20];

function normalise(form: ProfileForm) {
  return {
    name: form.name.trim(),
    headline: form.headline.trim() || null,
    about: form.about.trim() || null,
    location: form.location.trim() || null,
    links: form.links
      .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
      .filter((link) => link.label && link.url),
    weeklyHours: form.weeklyHours,
    currentLevel: form.currentLevel,
  };
}

export function ProfileWorkspace({
  initial,
  email,
  career,
  publicId,
  isPublic,
}: {
  initial: ProfileForm;
  email: string;
  career: { name: string; slug: string } | null;
  publicId: string | null;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialJson = useMemo(() => JSON.stringify(normalise(initial)), [initial]);
  const dirty = JSON.stringify(normalise(form)) !== initialJson;

  const initials =
    form.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "HB";

  const invalidLinks = form.links.filter((link) => {
    if (!link.label.trim() && !link.url.trim()) return false;
    try {
      const url = new URL(link.url.trim());
      return !link.label.trim() || !["http:", "https:"].includes(url.protocol);
    } catch {
      return true;
    }
  });

  async function save() {
    if (saving) return;
    setError(null);
    const payload = normalise(form);
    if (!payload.name) {
      setError("Your name cannot be empty.");
      return;
    }
    if (payload.links.some((link) => !/^https?:\/\//.test(link.url))) {
      setError("Links must start with http:// or https://.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/profile", { method: "PATCH", json: payload });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not save your profile. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-page pb-24">
      <header className="animate-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Profile</p>
          <h1 className="display-md mt-2.5 text-ink">Your professional identity.</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            This is the context that calibrates your roadmap, planning and portfolio. Only what you
            write here is used — nothing is inferred from behaviour.
          </p>
        </div>
        <ButtonLink href="/portfolio" variant="secondary" size="md" className="shrink-0">
          Preview portfolio
        </ButtonLink>
      </header>

      <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-5">
        <div className="min-w-0 space-y-4 lg:space-y-5">
          {/* Identity */}
          <section className="hb-card p-5 sm:p-7">
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-ink">
              <UserRound size={19} aria-hidden />
              Identity
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Used on your dashboard and portfolio. Your email is never shown publicly.
            </p>
            <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:gap-5">
              <span className="hb-avatar h-14 w-14 text-xl">
                {initials}
              </span>
              <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-name" className="hb-label">Full name</label>
                  <input
                    id="profile-name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="hb-input"
                    maxLength={200}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="profile-location" className="hb-label">Location</label>
                  <input
                    id="profile-location"
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                    className="hb-input"
                    placeholder="Jaipur, India"
                    maxLength={200}
                    autoComplete="address-level2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="profile-headline" className="hb-label">Professional headline</label>
                  <input
                    id="profile-headline"
                    value={form.headline}
                    onChange={(event) => setForm({ ...form, headline: event.target.value })}
                    className="hb-input"
                    placeholder="Aspiring data analyst · SQL, spreadsheets, clear reporting"
                    maxLength={200}
                  />
                  <p className="mt-1.5 flex justify-between gap-3 text-xs text-muted">
                    <span>What you are building toward, not a title you do not have yet.</span>
                    <span className="tabular shrink-0">{form.headline.length}/200</span>
                  </p>
                </div>
              </div>
            </div>
            {/* Two self-contained groups and no separator characters: however the
                row wraps, nothing is left dangling at the end of a line. */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 border-t border-line pt-5 text-sm text-muted">
              <span className="flex min-w-0 max-w-full items-center gap-2">
                <Mail size={15} className="shrink-0" aria-hidden />
                <span className="truncate">{email}</span>
              </span>
              <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <span className="flex items-center gap-2">
                  {isPublic ? (
                    <Globe2 size={15} className="shrink-0" aria-hidden />
                  ) : (
                    <Lock size={15} className="shrink-0" aria-hidden />
                  )}
                  <Link href="/portfolio#visibility" className="hb-link">
                    {isPublic ? "Portfolio is public" : "Portfolio is private"}
                  </Link>
                </span>
                {publicId && isPublic && (
                  <Link href={`/passport/${publicId}`} className="hb-link">
                    View public page
                    <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                  </Link>
                )}
              </span>
            </div>
          </section>

          {/* About */}
          <section className="hb-card p-5 sm:p-7">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">Introduction</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              Two or three sentences on where you are, what you are working toward, and the kind of
              problems you want to solve. Written by you — not generated.
            </p>
            <label htmlFor="profile-about" className="sr-only">Professional introduction</label>
            <textarea
              id="profile-about"
              value={form.about}
              onChange={(event) => setForm({ ...form, about: event.target.value })}
              className="hb-input mt-4"
              rows={5}
              maxLength={4000}
              placeholder="I am moving from operations into data work. I like turning messy spreadsheets into something a team can act on…"
            />
            <p className="tabular mt-1.5 text-right text-xs text-muted">{form.about.length}/4000</p>
          </section>

          {/* Links */}
          <section className="hb-card p-5 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-ink">
                  <Link2 size={19} aria-hidden />
                  Professional links
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  GitHub, a portfolio site, LinkedIn, a writing page. Up to six.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setForm({ ...form, links: [...form.links, { label: "", url: "" }].slice(0, 6) })
                }
                disabled={form.links.length >= 6}
              >
                <Plus size={14} aria-hidden />
                Add
              </Button>
            </div>
            {form.links.length === 0 ? (
              <p className="mt-4 rounded-md bg-paper-2 p-4 text-sm leading-relaxed text-muted">
                No links yet. Only add pages you would be comfortable showing an interviewer.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {form.links.map((link, index) => (
                  <li key={index} className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={link.label}
                      onChange={(event) => {
                        const next = [...form.links];
                        next[index] = { ...link, label: event.target.value };
                        setForm({ ...form, links: next });
                      }}
                      className="hb-input sm:max-w-[180px]"
                      placeholder="Label"
                      maxLength={60}
                      aria-label={`Link ${index + 1} label`}
                    />
                    <input
                      value={link.url}
                      onChange={(event) => {
                        const next = [...form.links];
                        next[index] = { ...link, url: event.target.value };
                        setForm({ ...form, links: next });
                      }}
                      className="hb-input min-w-0 flex-1"
                      placeholder="https://"
                      inputMode="url"
                      aria-label={`Link ${index + 1} URL`}
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, links: form.links.filter((_, i) => i !== index) })}
                      className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-full text-muted transition-colors duration-200 hover:bg-rust-soft hover:text-rust sm:self-auto"
                      aria-label={`Remove link ${index + 1}`}
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {invalidLinks.length > 0 && (
              <p className="mt-2.5 text-sm text-rust">
                {invalidLinks.length} link{invalidLinks.length === 1 ? "" : "s"} need a label and a full URL.
              </p>
            )}
          </section>

          {/* Availability */}
          <section className="hb-card p-5 sm:p-7">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">Time and starting point</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              These two answers shape how your roadmap is paced and how tasks are sized. Change them
              whenever your situation changes; nothing is permanent.
            </p>
            <div className="mt-6">
              <p className="hb-label">Realistic study time per week</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {HOURS.map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setForm({ ...form, weeklyHours: hours })}
                    className={cn(
                      "tabular h-9 rounded-full px-4 text-sm font-medium transition-[background-color,color,transform] duration-200 ease-apple active:scale-95",
                      form.weeklyHours === hours
                        ? "bg-accent text-white"
                        : "bg-paper-2 text-ink hover:bg-paper-3",
                    )}
                    aria-pressed={form.weeklyHours === hours}
                  >
                    {hours}h
                  </button>
                ))}
                <label className="ml-1 flex items-center gap-2 text-sm text-muted">
                  <span className="sr-only">Custom hours per week</span>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={form.weeklyHours}
                    onChange={(event) =>
                      setForm({ ...form, weeklyHours: Math.min(40, Math.max(1, Number(event.target.value) || 1)) })
                    }
                    className="hb-input tabular h-9 w-[72px] py-0 text-center text-sm"
                  />
                  h/week
                </label>
              </div>
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted">
                Be honest rather than ambitious. A plan built on ten hours you do not have is worse
                than a plan built on four you do.
              </p>
            </div>
            <div className="mt-6 border-t border-line pt-6">
              <p className="hb-label">Where you are starting</p>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setForm({ ...form, currentLevel: level.value })}
                    className={cn(
                      "flex flex-col items-stretch justify-start rounded-md p-4 text-left transition-[background-color,box-shadow] duration-200 ease-apple",
                      form.currentLevel === level.value
                        ? "bg-accent-soft ring-2 ring-inset ring-accent"
                        : "bg-paper ring-1 ring-inset ring-line-strong hover:bg-paper-2",
                    )}
                    aria-pressed={form.currentLevel === level.value}
                  >
                    <span className="flex items-center justify-between gap-2 text-md font-semibold text-ink">
                      {level.label}
                      {form.currentLevel === level.value && (
                        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-accent text-white">
                          <Check size={11} strokeWidth={3.2} aria-hidden />
                        </span>
                      )}
                    </span>
                    <span className="mt-1.5 block text-xs leading-relaxed text-muted">{level.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[76px] lg:space-y-5 lg:self-start">
          <div className="hb-card p-6">
            <p className="flex items-center gap-1.5 text-sm font-medium text-muted">
              <Target size={14} aria-hidden />
              Career goal
            </p>
            {career ? (
              <>
                <p className="mt-2 text-xl font-semibold leading-tight tracking-[-0.02em] text-ink">{career.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Your roadmap, planner suggestions and project recommendations are built from this
                  goal.
                </p>
                <ButtonLink href="/careers" variant="secondary" size="md" className="mt-4 w-full">
                  Change career goal
                </ButtonLink>
                <Link href={`/careers/${career.slug}`} className="hb-link mt-3 flex justify-center text-sm">
                  Revisit this career
                  <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-graphite">
                  You have not chosen a career goal yet. Your roadmap and planner stay generic until
                  you do.
                </p>
                <ButtonLink href="/onboarding" size="md" className="mt-4 w-full">
                  Choose a direction
                </ButtonLink>
              </>
            )}
          </div>

          <div className="hb-card p-6">
            <p className="text-base font-semibold text-ink">Your data</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your portfolio is private by default. Nothing is shared with an employer unless you
              enable the public link and choose which sections it shows.
            </p>
            <Link href="/portfolio#visibility" className="hb-link mt-3 text-sm">
              Manage visibility
              <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        </aside>
      </div>

      {/* Save bar: floats over the content column while there is something to save. */}
      <div
        inert={!(dirty || saved)}
        className={cn(
          "fixed bottom-[70px] left-1/2 z-30 w-[min(620px,calc(100vw-24px))] -translate-x-1/2 transition-[transform,opacity] duration-500 ease-out-expo md:bottom-6 md:left-[calc(50%+130px)] md:w-[min(620px,calc(100vw-308px))]",
          dirty || saved ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
        )}
      >
        <div className="hb-glass-bar flex items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2 shadow-xl ring-1 ring-black/[0.06]">
          <p className="min-w-0 text-sm text-graphite" aria-live="polite">
            {error ? (
              <span className="text-rust">{error}</span>
            ) : saved ? (
              <span className="flex items-center gap-1.5 font-medium text-moss">
                <Check size={15} aria-hidden />
                Profile saved.
              </span>
            ) : invalidLinks.length > 0 ? (
              "Fix the highlighted links before saving."
            ) : (
              "You have unsaved changes."
            )}
          </p>
          <div className="flex shrink-0 gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setForm(initial);
                setError(null);
              }}
              disabled={!dirty || saving}
            >
              Reset
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={saving || !dirty || invalidLinks.length > 0}>
              {saving ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
