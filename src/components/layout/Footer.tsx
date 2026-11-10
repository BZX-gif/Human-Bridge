import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Career explorer", href: "/careers" },
      { label: "Career roadmap", href: "/journey" },
      { label: "Planner", href: "/planner" },
      { label: "Skills", href: "/skills" },
      { label: "Projects", href: "/projects" },
    ],
  },
  {
    title: "Build evidence",
    links: [
      { label: "Assessments", href: "/assessments" },
      { label: "Skill passport", href: "/passport" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Opportunities", href: "/jobs" },
      { label: "Career mentor", href: "/mentor" },
    ],
  },
  {
    title: "For employers",
    links: [
      { label: "Hire for skills", href: "/employers" },
      { label: "Employer workspace", href: "/employers/dashboard" },
      { label: "Post a role", href: "/employers#post" },
      { label: "How matching works", href: "/employers#talent" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our principles", href: "/#trust" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Get started", href: "/signup" },
      { label: "Sign in", href: "/login" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="hb-container">
        <div className="grid gap-12 border-b border-white/10 py-16 lg:grid-cols-[1.1fr_1.4fr] lg:py-20">
          <div>
            <Logo inverted />
            <p className="mt-8 max-w-md font-display text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.06] tracking-[-0.015em] text-paper">
              The bridge between what you want to become and what you actually do.
            </p>
            <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-white/55">
              Discover a direction, understand the real requirements, build a plan, and produce
              evidence of your work. No shortcuts and no guarantees — just a clearer path.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex h-10 items-center gap-2 rounded-md bg-paper px-4 text-[13px] font-medium text-ink transition-colors hover:bg-paper-3"
            >
              Start building
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-[12.5px] text-white/65 transition-colors hover:text-paper"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 py-8 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="max-w-2xl text-[11.5px] leading-relaxed text-white/40">
              Human Bridge is in active development. Career descriptions, demand signals and salary
              ranges are indicative context for orientation only. They are not offers, predictions
              or guarantees of employment. Skills marked verified are backed by assessment or
              employer evidence; self-reported claims are labelled as such.
            </p>
            <p className="mt-3 text-[11.5px] text-white/30">
              © {new Date().getFullYear()} Human Bridge. Built for people who intend to follow
              through.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-white/40">
            <Link href="/#trust" className="hover:text-paper">
              Principles
            </Link>
            <Link href="/#trust" className="hover:text-paper">
              Privacy
            </Link>
            <Link href="/#trust" className="hover:text-paper">
              Terms
            </Link>
            <span className="font-display text-lg lowercase tracking-normal text-white/30">
              HYB
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
