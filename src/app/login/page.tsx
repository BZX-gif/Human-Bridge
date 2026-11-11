import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/safe-next";
import { LoginForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
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
    <AuthShell title="Welcome back." description="Sign in to continue to the plan you were building.">
      <LoginForm nextPath={next} />
    </AuthShell>
  );
}
