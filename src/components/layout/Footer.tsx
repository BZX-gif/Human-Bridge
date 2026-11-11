import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
      { label: "Paper", href: "/mentor" },
    ],
  },
  {
    title: "For employers",
    links: [
      { label: "Hire for skills", href: "/employers" },
      { label: "Employer workspace", href: "/employers/dashboard" },
      { label: "Post a role", href: "/employers#post" },
      { label: "How matching works", href: "/employers#matching" },
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
    <footer className="border-t border-line bg-paper-2 text-muted">
      <div className="hb-container">
        <div className="grid gap-12 py-14 lg:grid-cols-[1fr_1.5fr] lg:gap-20 lg:py-20">
          <div>
            <Logo />
            <p className="display-sm mt-7 max-w-sm text-ink">
              The bridge between what you want to become and what you actually do.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Discover a direction, understand the real requirements, build a plan, and produce
              evidence of your work. No shortcuts and no guarantees — just a clearer path.
            </p>
            <Link href="/signup" className="hb-link mt-5 text-sm">
              Start building
              <ChevronRight size={14} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4" aria-label="Footer">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-2xs font-semibold text-ink">{column.title}</h3>
                <ul className="mt-3 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-2xs text-graphite transition-colors duration-200 hover:text-ink hover:underline hover:underline-offset-2"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-line-strong/70 py-6">
          <p className="max-w-4xl text-2xs leading-relaxed text-muted">
            Human Bridge is in active development. Career descriptions, demand signals and salary
            ranges are indicative context for orientation only. They are not offers, predictions or
            guarantees of employment. Skills marked verified are backed by assessment or employer
            evidence; self-reported claims are labelled as such.
          </p>
          <div className="mt-4 flex flex-col gap-3 border-t border-line-strong/70 pt-4 text-2xs sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Human Bridge. Built for people who intend to follow
              through.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-graphite">
              <Link href="/#trust" className="transition-colors duration-200 hover:text-ink hover:underline hover:underline-offset-2">
                Principles
              </Link>
              <Link href="/#trust" className="transition-colors duration-200 hover:text-ink hover:underline hover:underline-offset-2">
                Privacy
              </Link>
              <Link href="/#trust" className="transition-colors duration-200 hover:text-ink hover:underline hover:underline-offset-2">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
