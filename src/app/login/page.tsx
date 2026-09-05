import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/safe-next";
import { LoginForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in — Human Bridge" };

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
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <Link href="/" className="mb-8 text-center text-[15px] font-bold tracking-tight text-slate-900">
          Human<span className="text-[#1a56ff]">Bridge</span>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 mb-6 text-sm text-slate-500">Sign in to continue to your dashboard.</p>
          <LoginForm nextPath={next} />
        </div>
      </div>
    </main>
  );
}
