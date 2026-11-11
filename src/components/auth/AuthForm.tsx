"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { safeNextPath } from "@/lib/auth/safe-next";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Role = "candidate" | "employer";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role | "admin";
}

/** The invalid state is styled from `aria-invalid`, which every field already sets. */
const FIELD = "hb-input";

const FORM_ERROR = "animate-rise rounded-md bg-rust-soft px-3.5 py-3 text-sm leading-snug text-rust";

const TOGGLE =
  "absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-paper-3 hover:text-ink";

function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="hb-label">
      {children}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-rust" role="alert">
      {message}
    </p>
  );
}

export function LoginForm({ nextPath }: { nextPath?: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await apiFetch<{ user: AuthUser }>("/api/auth/login", {
        method: "POST",
        json: { email: email.trim().toLowerCase(), password },
      });
      const fallback = data.user.role === "employer" ? "/employers/dashboard" : "/dashboard";
      router.push(safeNextPath(nextPath, fallback));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        setFormError("Unable to sign in. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {formError && (
        <div className={FORM_ERROR} role="alert">
          {formError}
        </div>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          disabled={loading}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(FIELD, "pr-11")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            disabled={loading}
          />
          <button
            type="button"
            className={TOGGLE}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>
        <FieldError id="password-error" message={errors.password} />
      </div>

      <Button type="submit" className="w-full" disabled={loading} size="lg">
        {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted">
        New to Human Bridge?{" "}
        <Link href="/signup" className="font-medium text-link hover:underline hover:underline-offset-2">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm({ nextPath }: { nextPath?: string | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("candidate");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Enter your full name.";
    if (!email.trim()) next.email = "Enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email.";
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords do not match.";
    if (role === "employer" && !companyName.trim()) next.companyName = "Enter your company name.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      };
      if (role === "employer") payload.companyName = companyName.trim();

      const data = await apiFetch<{ user: AuthUser }>("/api/auth/signup", {
        method: "POST",
        json: payload,
      });

      const fallback = data.user.role === "employer" ? "/employers/dashboard" : "/onboarding";
      router.push(safeNextPath(nextPath, fallback));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message);
      } else {
        setFormError("Unable to create your account. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {formError && (
        <div className={FORM_ERROR} role="alert">
          {formError}
        </div>
      )}

      <div>
        <Label htmlFor="name">Full name</Label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={FIELD}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          disabled={loading}
        />
        <FieldError id="name-error" message={errors.name} />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={FIELD}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          disabled={loading}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <fieldset>
        <legend className="hb-label">Account type</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {(
            [
              { id: "candidate" as const, label: "Candidate", hint: "Find roles & prove skills" },
              { id: "employer" as const, label: "Employer", hint: "Hire verified talent" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRole(opt.id)}
              className={cn(
                "rounded-md px-3.5 py-3 text-left transition-[background-color,box-shadow,transform] duration-200 ease-apple active:scale-[0.98]",
                role === opt.id
                  ? "bg-accent-soft text-ink ring-2 ring-inset ring-accent"
                  : "bg-paper text-graphite ring-1 ring-inset ring-line-strong hover:bg-paper-2",
              )}
              aria-pressed={role === opt.id}
              disabled={loading}
            >
              <span className="block text-sm font-semibold">{opt.label}</span>
              <span className="mt-0.5 block text-2xs text-muted">{opt.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {role === "employer" && (
        <div className="animate-rise">
          <Label htmlFor="companyName">Company name</Label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            autoComplete="organization"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className={FIELD}
            aria-invalid={Boolean(errors.companyName)}
            aria-describedby={errors.companyName ? "company-error" : undefined}
            disabled={loading}
          />
          <FieldError id="company-error" message={errors.companyName} />
        </div>
      )}

      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={cn(FIELD, "pr-11")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            disabled={loading}
          />
          <button
            type="button"
            className={TOGGLE}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>
        <FieldError id="password-error" message={errors.password} />
      </div>

      <div>
        <Label htmlFor="confirm">Confirm password</Label>
        <input
          id="confirm"
          name="confirm"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={FIELD}
          aria-invalid={Boolean(errors.confirm)}
          aria-describedby={errors.confirm ? "confirm-error" : undefined}
          disabled={loading}
        />
        <FieldError id="confirm-error" message={errors.confirm} />
      </div>

      <Button type="submit" className="w-full" disabled={loading} size="lg">
        {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {loading ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-link hover:underline hover:underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  );
}
