import type { Metadata } from "next";
import { ArrowRight, Compass, ShieldCheck, Target } from "lucide-react";
import { listCareerSummaries, type CareerSummary } from "@/lib/services/career-service";
import { getCurrentUser } from "@/lib/auth/session";
import { CareerExplorer } from "@/components/careers/CareerExplorer";
import { EmptyState } from "@/components/ui/States";
import { ButtonLink } from "@/components/ui/Button";
import { ScrollMotion } from "@/components/motion/ScrollMotion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore careers",
  description:
    "Understand what careers actually require: the daily work, the skills, the entry points and how to build evidence before you apply.",
};

export default async function CareersPage() {
  // Session and catalogue are independent — one wave.
  const [user, result] = await Promise.all([
    getCurrentUser(),
    listCareerSummaries()
      .then((careers): { careers: CareerSummary[]; unavailable: false } => ({ careers, unavailable: false }))
      .catch((): { careers: CareerSummary[]; unavailable: true } => ({ careers: [], unavailable: true })),
  ]);
  const { careers, unavailable } = result;

  return (
    <main id="main-content" className="bg-paper">
      <section className="relative isolate overflow-x-clip">
        <div className="hb-aurora -top-[30%] bottom-[20%] opacity-50" aria-hidden />
        <div className="hb-container pb-14 pt-[clamp(52px,8vw,104px)] text-center sm:pb-20">
          <p className="eyebrow animate-rise">Career explorer</p>
          <h1 className="display-xl animate-focus-in mx-auto mt-5 max-w-[900px] [animation-delay:70ms]">
            Start with the work. <span className="text-muted">Then choose the title.</span>
          </h1>
          <p className="lede animate-rise mx-auto mt-6 max-w-[680px] [animation-delay:200ms]">
            A job title tells you very little about what a person actually does all day. Each path
            here is described by its real skill requirements, the work, the entry point and the
            evidence you would need to show.
          </p>

          <ol className="animate-rise mx-auto mt-12 grid max-w-[920px] grid-cols-1 gap-x-8 gap-y-6 text-left sm:mt-16 sm:grid-cols-3 [animation-delay:320ms]">
            {[
              "Read the day-to-day work before the salary.",
              "Check the essential skills, not the full wishlist.",
              "Ask what evidence you could build in 90 days.",
            ].map((item, index) => (
              <li key={item} className="border-t border-line-strong pt-4">
                <span className="tabular text-sm font-semibold text-link">0{index + 1}</span>
                <p className="mt-1.5 text-md leading-snug text-ink">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-paper-2">
        <div className="hb-container py-10 sm:py-14">
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
        </div>
      </section>

      <section className="hb-container hb-section-tight">
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-3">
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
          ].map((item, index) => (
            <div key={item.title} data-reveal data-reveal-delay={index * 90}>
              <item.icon size={28} strokeWidth={1.5} className="text-link" aria-hidden />
              <h2 className="mt-5 text-xl font-semibold text-ink">{item.title}</h2>
              <p className="mt-2 text-md leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hb-container pb-[clamp(64px,8vw,112px)]">
        <div
          className="hb-tile hb-tile-dark on-dark flex flex-col gap-8 px-7 py-10 sm:px-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between"
          data-reveal="scale"
        >
          <div className="hb-aurora hb-aurora-dark opacity-80" aria-hidden />
          <div>
            <p className="eyebrow text-[#a1a1a6]">Ready to commit to a direction?</p>
            <p className="display-md mt-3 max-w-2xl">
              Choose one career and Human Bridge will build the roadmap around its real requirements.
            </p>
          </div>
          <ButtonLink href={user ? "/journey" : "/signup"} size="lg" className="shrink-0 self-start lg:self-auto">
            {user ? "Open my journey" : "Create a free account"}
            <ArrowRight size={17} aria-hidden />
          </ButtonLink>
        </div>
      </section>

      <ScrollMotion />
    </main>
  );
}
