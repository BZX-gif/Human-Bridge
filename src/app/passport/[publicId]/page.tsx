import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getPublicPassport } from "@/lib/services/passport-service";
import { PassportSkillList } from "@/components/passport/PassportSkillList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skill Passport — Human Bridge",
  robots: { index: false },
};

/**
 * Portable, shareable verification page.
 *
 * Only renders what the candidate explicitly chose to expose. No email, phone,
 * internal notes or hidden assessment data is ever included here.
 */
export default async function PublicPassportPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  let passport;
  try {
    passport = await getPublicPassport(publicId);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#eef3ff] px-2.5 py-1 text-[11px] font-semibold text-[#1a56ff]">
            <ShieldCheck size={11} aria-hidden />
            Verified by Human Bridge
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {passport.ownerName}
          </h1>
          {passport.targetRole && (
            <p className="mt-1 text-sm text-slate-500">{passport.targetRole}</p>
          )}
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Readiness
            </p>
            <p className="mt-1 text-4xl font-black tabular-nums text-slate-900">
              {passport.readiness}
              <span className="text-xl font-bold text-slate-300"> / 100</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        {passport.skills.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-bold text-slate-900">Verified skills</h2>
            <PassportSkillList skills={passport.skills} />
          </section>
        )}

        {passport.assessments.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-900">
              Assessments completed
            </h2>
            <ul className="divide-y divide-slate-100">
              {passport.assessments
                .filter((a) => a.completedAt)
                .map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="text-slate-700">
                      {a.title}{" "}
                      <span className="text-xs text-slate-400">v{a.version}</span>
                    </span>
                    {a.readinessScore !== null && (
                      <span className="font-bold tabular-nums text-slate-900">
                        {a.readinessScore}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        )}

        <p className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
          {passport.evidenceDisclaimer}
        </p>
      </div>
    </main>
  );
}
