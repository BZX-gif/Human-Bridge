import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Compass, ShieldCheck, Target } from "lucide-react";
import { listCareerSummaries, type CareerSummary } from "@/lib/services/career-service";
import { getCurrentUser } from "@/lib/auth/session";
import { CareerExplorer } from "@/components/careers/CareerExplorer";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore careers",
  description:
    "Understand what careers actually require: the daily work, the skills, the entry points and how to build evidence before you apply.",
};

export default async function CareersPage() {
  const user = await getCurrentUser();
  let careers: CareerSummary[] = [];
  let unavailable = false;

  try {
    careers = await listCareerSummaries();
  } catch {
    unavailable = true;
  }

  return (
    <main id="main-content" className="bg-paper pt-16">
      <section className="border-b border-line">
        <div className="hb-container py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <p className="eyebrow">Career explorer</p>
              <h1 className="display-lg mt-4 max-w-3xl">
                Start with the work.
                <br />
                Then choose the title.
              </h1>
              <p className="lede mt-5">
                A job title tells you very little about what a person actually does all day. Each
                path here is described by its real skill requirements, the work, the entry point and
                the evidence you would need to show.
              </p>
            </div>
            <div className="border-l-0 border-line lg:border-l lg:pl-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                A better way to choose
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  "Read the day-to-day work before the salary.",
                  "Check the essential skills, not the full wishlist.",
                  "Ask what evidence you could build in 90 days.",
                ].map((item, index) => (
                  <li key={item} className="flex gap-3 text-[12.5px] leading-relaxed text-graphite">
                    <span className="font-display text-lg leading-none text-faint">
                      0{index + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="hb-container py-8 sm:py-10">
        {unavailable ? (
          <EmptyState
            title="The career catalogue is unavailable"
            message="Human Bridge could not reach its database. The rest of the product still works; please try again shortly."
            action={<ButtonLink href="/" variant="secondary">Back to home</ButtonLink>}
          />
        ) : careers.length === 0 ? (
          <EmptyState
            title="No careers loaded yet"
            message="Run the catalogue seed to populate career paths."
          />
        ) : (
          <CareerExplorer
            careers={careers}
            signedIn={Boolean(user)}
            targetCareerId={user?.targetCareerId ?? null}
          />
        )}
      </section>

      <section className="border-t border-line bg-paper-2">
        <div className="hb-container grid gap-px overflow-hidden py-14 sm:grid-cols-3 sm:py-16">
          {[
            {
              icon: Compass,
              title: "Honest descriptions",
              body: "We describe the work and its constraints. We do not dress a role up to make it sound easy or glamorous.",
            },
            {
              icon: Target,
              title: "Requirements, not wishlists",
              body: "Skills are graded by importance and required level, so you can tell what is essential from what is merely useful.",
            },
            {
              icon: ShieldCheck,
              title: "No promised outcomes",
              body: "Career information here is orientation. No salary, demand figure or roadmap is a guarantee of a job.",
            },
          ].map((item) => (
            <div key={item.title} className="border-line sm:border-l sm:px-7 sm:first:border-l-0 sm:first:pl-0">
              <item.icon size={18} strokeWidth={1.5} className="text-ink" aria-hidden />
              <h2 className="mt-4 text-[13.5px] font-semibold text-ink">{item.title}</h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hb-container py-14 sm:py-20">
        <div className="flex flex-col gap-6 rounded-lg border border-line bg-ink px-6 py-8 text-paper sm:flex-row sm:items-center sm:justify-between sm:px-9">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Ready to commit to a direction?
            </p>
            <p className="mt-2 max-w-xl font-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight">
              Choose one career and Human Bridge will build the roadmap around its real requirements.
            </p>
          </div>
          <Link
            href={user ? "/journey" : "/signup"}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-paper px-5 text-[13px] font-medium text-ink transition-colors hover:bg-paper-3"
          >
            {user ? "Open my journey" : "Create a free account"}
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
