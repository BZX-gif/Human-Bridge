import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/safe-next";
import { SignupForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) {
    const fallback = user.role === "employer" ? "/employers/dashboard" : "/dashboard";
    redirect(safeNextPath(next, fallback));
  }

  return (
    <AuthShell
      title="Start with a direction."
      description="Create an account to turn a career you want into a staged, workable plan. Your data stays yours."
    >
      <SignupForm nextPath={next} />
    </AuthShell>
  );
}
