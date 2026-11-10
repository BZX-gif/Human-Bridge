"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Globe2,
  Link2,
  Loader2,
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
      <header className="flex flex-col gap-3 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Profile</p>
          <h1 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3rem)] leading-[1.02] tracking-[-0.02em]">
            Your professional identity.
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
            This is the context that calibrates your roadmap, planning and portfolio. Only what you
            write here is used — nothing is inferred from behaviour.
          </p>
        </div>
        <ButtonLink href="/portfolio" variant="secondary" size="md">
          Preview portfolio
          <ArrowRight size={14} aria-hidden />
        </ButtonLink>
      </header>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          {/* Identity */}
          <section className="rounded-lg border border-line bg-paper p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <UserRound size={14} aria-hidden />
              Identity
            </h2>
            <p className="mt-1 text-[11.5px] text-muted">
              Used on your dashboard and portfolio. Your email is never shown publicly.
            </p>
            <div className="mt-4 flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[6px] bg-ink font-display text-[22px] text-paper">
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
                  <p className="mt-1 text-[10px] text-faint">
                    What you are building toward, not a title you do not have yet. {form.headline.length}/200
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-[11.5px] text-muted">
              <Globe2 size={12} aria-hidden />
              <span>{email}</span>
              <span className="text-faint">·</span>
              <Link href="/portfolio#visibility" className="font-medium text-ink underline decoration-line-strong underline-offset-4">
                {isPublic ? "Portfolio is public" : "Portfolio is private"}
              </Link>
              {publicId && isPublic && (
                <>
                  <span className="text-faint">·</span>
                  <Link href={`/passport/${publicId}`} className="font-medium text-ink underline decoration-line-strong underline-offset-4">
                    View public page
                  </Link>
                </>
              )}
            </div>
          </section>

          {/* About */}
          <section className="rounded-lg border border-line bg-paper p-5 sm:p-6">
            <h2 className="text-[13px] font-semibold text-ink">Introduction</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Two or three sentences on where you are, what you are working toward, and the kind of
              problems you want to solve. Written by you — not generated.
            </p>
            <label htmlFor="profile-about" className="sr-only">Professional introduction</label>
            <textarea
              id="profile-about"
              value={form.about}
              onChange={(event) => setForm({ ...form, about: event.target.value })}
              className="hb-input mt-3"
              rows={5}
              maxLength={4000}
              placeholder="I am moving from operations into data work. I like turning messy spreadsheets into something a team can act on…"
            />
            <p className="mt-1 text-right text-[10px] text-faint">{form.about.length}/4000</p>
          </section>

          {/* Links */}
          <section className="rounded-lg border border-line bg-paper p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <Link2 size={14} aria-hidden />
                  Professional links
                </h2>
                <p className="mt-1 text-[11.5px] text-muted">
                  GitHub, a portfolio site, LinkedIn, a writing page. Up to six.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setForm({ ...form, links: [...form.links, { label: "", url: "" }].slice(0, 6) })
                }
                disabled={form.links.length >= 6}
              >
                <Plus size={12} aria-hidden />
                Add
              </Button>
            </div>
            {form.links.length === 0 ? (
              <p className="mt-3 rounded-md border border-dashed border-line p-4 text-[11.5px] text-muted">
                No links yet. Only add pages you would be comfortable showing an interviewer.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {form.links.map((link, index) => (
                  <li key={index} className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={link.label}
                      onChange={(event) => {
                        const next = [...form.links];
                        next[index] = { ...link, label: event.target.value };
                        setForm({ ...form, links: next });
                      }}
                      className="hb-input sm:max-w-[160px]"
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
                      className="flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-md border border-line text-faint hover:border-rust/30 hover:text-rust sm:self-auto"
                      aria-label={`Remove link ${index + 1}`}
                    >
                      <Trash2 size={13} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {invalidLinks.length > 0 && (
              <p className="mt-2 text-[11px] text-rust">
                {invalidLinks.length} link{invalidLinks.length === 1 ? "" : "s"} need a label and a full URL.
              </p>
            )}
          </section>

          {/* Availability */}
          <section className="rounded-lg border border-line bg-paper p-5 sm:p-6">
            <h2 className="text-[13px] font-semibold text-ink">Time and starting point</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              These two answers shape how your roadmap is paced and how tasks are sized. Change them
              whenever your situation changes; nothing is permanent.
            </p>
            <div className="mt-5">
              <p className="hb-label">Realistic study time per week</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {HOURS.map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setForm({ ...form, weeklyHours: hours })}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-[12px] transition-colors",
                      form.weeklyHours === hours
                        ? "border-ink bg-ink text-paper"
                        : "border-line bg-paper text-graphite hover:border-line-strong",
                    )}
                    aria-pressed={form.weeklyHours === hours}
                  >
                    {hours}h
                  </button>
                ))}
                <label className="flex items-center gap-2 text-[11px] text-muted">
                  <span className="sr-only">Custom hours per week</span>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={form.weeklyHours}
                    onChange={(event) =>
                      setForm({ ...form, weeklyHours: Math.min(40, Math.max(1, Number(event.target.value) || 1)) })
                    }
                    className="hb-input h-8 w-[70px] py-0 text-center text-[12px]"
                  />
                  h/week
                </label>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-faint">
                Be honest rather than ambitious. A plan built on ten hours you do not have is worse
                than a plan built on four you do.
              </p>
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <p className="hb-label">Where you are starting</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setForm({ ...form, currentLevel: level.value })}
                    className={cn(
                      "rounded-md border p-3 text-left transition-colors",
                      form.currentLevel === level.value
                        ? "border-ink bg-paper-2"
                        : "border-line bg-paper hover:border-line-strong",
                    )}
                    aria-pressed={form.currentLevel === level.value}
                  >
                    <span className="flex items-center justify-between text-[12px] font-medium text-ink">
                      {level.label}
                      {form.currentLevel === level.value && <Check size={12} aria-hidden />}
                    </span>
                    <span className="mt-1 block text-[10.5px] leading-relaxed text-muted">{level.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-lg border border-line bg-paper-2 p-5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              <Target size={11} aria-hidden />
              Career goal
            </p>
            {career ? (
              <>
                <p className="mt-2 font-display text-[22px] leading-tight">{career.name}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                  Your roadmap, planner suggestions and project recommendations are built from this
                  goal.
                </p>
                <ButtonLink href="/careers" variant="secondary" size="sm" className="mt-3 w-full">
                  Change career goal
                </ButtonLink>
                <Link href={`/careers/${career.slug}`} className="mt-2 block text-center text-[10.5px] text-muted underline decoration-line underline-offset-4 hover:text-ink">
                  Revisit this career
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-[12px] leading-relaxed text-graphite">
                  You have not chosen a career goal yet. Your roadmap and planner stay generic until
                  you do.
                </p>
                <ButtonLink href="/onboarding" size="sm" className="mt-3 w-full">
                  Choose a direction
                </ButtonLink>
              </>
            )}
          </div>

          <div className="rounded-lg border border-line bg-paper p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              Your data
            </p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              Your portfolio is private by default. Nothing is shared with an employer unless you
              enable the public link and choose which sections it shows.
            </p>
            <ButtonLink href="/portfolio#visibility" variant="ghost" size="sm" className="mt-2 px-0">
              Manage visibility
              <ArrowRight size={12} aria-hidden />
            </ButtonLink>
          </div>
        </aside>
      </div>

      {/* Save bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-[58px] z-30 border-t border-line bg-paper/95 backdrop-blur-sm transition-transform duration-200 md:bottom-0",
          dirty || saved ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-3 px-4 py-3 sm:px-7 lg:px-10">
          <p className="text-[11.5px] text-muted" aria-live="polite">
            {error ? (
              <span className="text-rust">{error}</span>
            ) : saved ? (
              <span className="flex items-center gap-1.5 text-moss"><Check size={12} aria-hidden />Profile saved.</span>
            ) : invalidLinks.length > 0 ? (
              "Fix the highlighted links before saving."
            ) : (
              "You have unsaved changes."
            )}
          </p>
          <div className="flex gap-2">
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
              {saving ? <Loader2 size={13} className="animate-spin" aria-hidden /> : null}
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
