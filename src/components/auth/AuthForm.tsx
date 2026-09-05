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

function fieldClass(invalid?: boolean) {
  return cn(
    "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-[#1a56ff] focus:border-transparent",
    invalid ? "border-red-300" : "border-slate-200",
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-600" role="alert">
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
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
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
          className={fieldClass(Boolean(errors.email))}
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
            className={cn(fieldClass(Boolean(errors.password)), "pr-11")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <FieldError id="password-error" message={errors.password} />
      </div>

      <Button type="submit" className="w-full" disabled={loading} size="lg">
        {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        New to Human Bridge?{" "}
        <Link href="/signup" className="font-semibold text-[#1a56ff] hover:underline">
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
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
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
          className={fieldClass(Boolean(errors.name))}
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
          className={fieldClass(Boolean(errors.email))}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          disabled={loading}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-slate-700">Account type</legend>
        <div className="grid grid-cols-2 gap-2">
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
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                role === opt.id
                  ? "border-[#1a56ff] bg-[#e8edff] text-[#1a56ff]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
              aria-pressed={role === opt.id}
              disabled={loading}
            >
              <span className="block text-sm font-semibold">{opt.label}</span>
              <span className="block text-[11px] opacity-80">{opt.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {role === "employer" && (
        <div>
          <Label htmlFor="companyName">Company name</Label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            autoComplete="organization"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className={fieldClass(Boolean(errors.companyName))}
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
            className={cn(fieldClass(Boolean(errors.password)), "pr-11")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            disabled={loading}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
          className={fieldClass(Boolean(errors.confirm))}
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

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#1a56ff] hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
