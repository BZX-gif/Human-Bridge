"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  ChevronDown,
  Compass,
  FolderGit2,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth/types";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import Footer from "./Footer";

interface NavItem {
  label: string;
  href: string;
  icon: typeof Map;
}

const candidateNav: { group: string; items: NavItem[] }[] = [
  {
    group: "Workspace",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "My journey", href: "/journey", icon: Map },
      { label: "Planner", href: "/planner", icon: CalendarDays },
      { label: "Paper", href: "/mentor", icon: Sparkles },
    ],
  },
  {
    group: "Build",
    items: [
      { label: "Explore careers", href: "/careers", icon: Compass },
      { label: "Skills", href: "/skills", icon: Layers },
      { label: "Projects", href: "/projects", icon: FolderGit2 },
      { label: "Assessments", href: "/assessments", icon: ShieldCheck },
    ],
  },
  {
    group: "Show your work",
    items: [
      { label: "Portfolio", href: "/portfolio", icon: Briefcase },
      { label: "Skill passport", href: "/passport", icon: ShieldCheck },
      { label: "Opportunities", href: "/jobs", icon: GraduationCap },
    ],
  },
];

const employerNav: { group: string; items: NavItem[] }[] = [
  {
    group: "Hiring",
    items: [
      { label: "Overview", href: "/employers/dashboard", icon: LayoutDashboard },
      { label: "Post a role", href: "/employers/dashboard#post", icon: Briefcase },
      { label: "Candidates", href: "/employers/dashboard#candidates", icon: UserRound },
    ],
  },
  {
    group: "Explore",
    items: [
      { label: "Talent pool", href: "/employers", icon: Compass },
      { label: "Platform jobs", href: "/jobs", icon: GraduationCap },
    ],
  },
];

const publicLinks = [
  { label: "Explore careers", href: "/careers" },
  { label: "Skills", href: "/skills" },
  { label: "Projects", href: "/projects" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "For employers", href: "/employers" },
];

const appPrefixes = [
  "/dashboard",
  "/journey",
  "/planner",
  "/mentor",
  "/skills",
  "/projects",
  "/portfolio",
  "/profile",
  "/jobs",
  "/assessments",
  "/ai-copilot",
];

const employerPrefixes = ["/employers/dashboard", "/employers/jobs"];

export default function Navigation({
  user,
  children,
}: {
  user: SessionUser | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isPublicPassport = /^\/passport\/[^/]+$/.test(pathname);
  const isEmployerApp = employerPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isApp =
    !isPublicPassport &&
    (appPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/")) ||
      isEmployerApp ||
      pathname === "/passport" ||
      pathname === "/employers/dashboard");
  const isFocus = ["/onboarding", "/login", "/signup"].includes(pathname);

  if (isFocus) {
    return (
      <div className="min-h-dvh bg-paper">
        <header className="hb-glass-bar sticky top-0 z-40 flex h-[52px] items-center justify-between px-5 sm:px-8">
          <Logo />
          <Link href="/" className="hb-link text-xs">
            Back to home
          </Link>
        </header>
        {children}
      </div>
    );
  }

  if (isApp && user) {
    return <AppShell user={user} pathname={pathname} employer={isEmployerApp || user.role === "employer"}>{children}</AppShell>;
  }

  return <PublicShell user={user} pathname={pathname}>{children}</PublicShell>;
}

/** Vertical centre of the public header, in px: where it samples what is beneath it. */
const HEADER_PROBE = 26;

/**
 * Public routes whose first section is dark and runs up underneath the header.
 * Listing them lets the server render the bar in its dark state, so it never
 * flashes light before the first measurement. Everything else is measured.
 */
const DARK_TOP_ROUTES = new Set(["/employers"]);

/**
 * What the fixed header needs to know about the page under it:
 *  - `scrolled`  the page has moved, so the bar gets its hairline;
 *  - `dark`      a full-bleed dark section (marked `hb-nav-dark`) is beneath
 *                the bar, so it switches to dark glass with light text.
 *
 * One rAF-throttled read per scroll frame, and a re-render only when a value
 * flips. The zones come from a live collection, so it stays correct as routes
 * and streamed content mount and unmount, with no re-querying. It re-reads on
 * every navigation, because a new page can put a different surface under the bar
 * without the document scrolling or changing height.
 */
function useHeaderState(pathname: string): { scrolled: boolean; dark: boolean } {
  const [state, setState] = useState(() => ({
    scrolled: false,
    dark: DARK_TOP_ROUTES.has(pathname),
  }));

  useEffect(() => {
    const zones = document.getElementsByClassName("hb-nav-dark");
    let frame = 0;

    const read = () => {
      frame = 0;
      const scrolled = window.scrollY > 8;
      let dark = false;
      for (let index = 0; index < zones.length; index++) {
        const rect = zones[index].getBoundingClientRect();
        if (rect.top <= HEADER_PROBE && rect.bottom > HEADER_PROBE) {
          dark = true;
          break;
        }
      }
      setState((previous) =>
        previous.scrolled === scrolled && previous.dark === dark ? previous : { scrolled, dark },
      );
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(read);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    // Content arriving or leaving (navigation, streaming) changes what is under the bar.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(document.body);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return state;
}

/* ── Public site ─────────────────────────────────────────────────────────── */

function PublicShell({
  user,
  pathname,
  children,
}: {
  user: SessionUser | null;
  pathname: string;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { scrolled, dark } = useHeaderState(pathname);

  useEffect(() => {
    if (!userOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setUserOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setUserOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [userOpen]);

  const workspaceHref = user?.role === "employer" ? "/employers/dashboard" : "/dashboard";

  return (
    <div className="min-h-dvh bg-paper">
      <header
        data-theme={dark ? "dark" : "light"}
        className={cn(
          "group/nav fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500 ease-apple",
          dark ? "hb-glass-dark" : "hb-glass-bar",
          !scrolled ? "border-transparent" : dark ? "border-white/[0.12]" : "border-black/[0.08]",
        )}
      >
        <div className="hb-container flex h-[52px] items-center justify-between gap-6">
          <Logo inverted={dark} />

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
            {publicLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "py-1 text-xs transition-colors duration-300 ease-apple",
                    active
                      ? "font-medium text-ink group-data-[theme=dark]/nav:text-white"
                      : "text-ink/70 hover:text-ink group-data-[theme=dark]/nav:text-white/75 group-data-[theme=dark]/nav:hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            {user ? (
              <>
                <Link
                  href={workspaceHref}
                  className="group inline-flex h-8 items-center gap-1 rounded-full bg-accent px-3.5 text-xs font-medium text-white transition-[background-color,transform] duration-200 ease-apple hover:bg-accent-hover active:scale-[0.97]"
                >
                  Open workspace
                  <ArrowRight
                    size={13}
                    className="transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <div className="relative hidden lg:block" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setUserOpen((open) => !open)}
                    aria-expanded={userOpen}
                    aria-haspopup="menu"
                    aria-label="Account menu"
                    className="flex h-8 items-center gap-1 rounded-full pl-1 pr-2 text-graphite transition-colors duration-300 ease-apple hover:bg-ink/[0.06] group-data-[theme=dark]/nav:text-white/80 group-data-[theme=dark]/nav:hover:bg-white/[0.12]"
                  >
                    <span className="hb-avatar h-6 w-6 text-[10px]">
                      {initials(user.name)}
                    </span>
                    <ChevronDown
                      size={13}
                      className={cn("transition-transform duration-300 ease-apple", userOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>
                  {userOpen && (
                    <div
                      role="menu"
                      className="animate-scale-in absolute right-0 top-full mt-2 w-60 origin-top-right rounded-xl bg-paper p-1.5 shadow-xl ring-1 ring-black/5"
                    >
                      <div className="px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-2xs text-muted">{user.email}</p>
                      </div>
                      <div className="mx-1.5 my-1 h-px bg-line" />
                      <Link
                        href={workspaceHref}
                        role="menuitem"
                        onClick={() => setUserOpen(false)}
                        className="block rounded-sm px-3 py-2 text-sm text-graphite transition-colors hover:bg-paper-2 hover:text-ink"
                      >
                        Workspace
                      </Link>
                      <Link
                        href="/profile"
                        role="menuitem"
                        onClick={() => setUserOpen(false)}
                        className="block rounded-sm px-3 py-2 text-sm text-graphite transition-colors hover:bg-paper-2 hover:text-ink"
                      >
                        Profile settings
                      </Link>
                      <SignOutButton className="w-full rounded-sm px-3 py-2 text-left text-sm text-rust transition-colors hover:bg-rust-soft" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden h-8 items-center rounded-full px-3 text-xs text-ink/70 transition-colors duration-300 ease-apple hover:text-ink group-data-[theme=dark]/nav:text-white/75 group-data-[theme=dark]/nav:hover:text-white sm:inline-flex"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-8 items-center rounded-full bg-accent px-3.5 text-xs font-medium text-white transition-[background-color,transform] duration-200 ease-apple hover:bg-accent-hover active:scale-[0.97]"
                >
                  Start free
                </Link>
              </>
            )}

            <button
              type="button"
              className="-mr-1.5 ml-0.5 flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors duration-300 ease-apple hover:bg-ink/[0.06] group-data-[theme=dark]/nav:text-white group-data-[theme=dark]/nav:hover:bg-white/[0.12] lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu size={19} strokeWidth={1.8} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <div className="hb-public-main pt-[52px]">{children}</div>
      <Footer />

      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="hb-dialog-overlay fixed inset-0 z-[60] bg-paper/60 lg:hidden" />
          <Dialog.Content className="hb-menu-content fixed inset-0 z-[61] flex flex-col bg-paper/95 backdrop-blur-2xl focus:outline-none lg:hidden">
            <div className="hb-container flex h-[52px] shrink-0 items-center justify-between">
              <Dialog.Title className="sr-only">Navigation</Dialog.Title>
              <Logo />
              <Dialog.Close
                className="-mr-1.5 flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors duration-200 hover:bg-ink/[0.06]"
                aria-label="Close menu"
              >
                <X size={19} strokeWidth={1.8} aria-hidden />
              </Dialog.Close>
            </div>
            <nav className="hb-container stagger mt-5 flex-1 overflow-y-auto" aria-label="Mobile">
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2.5 font-display text-[1.75rem] leading-tight text-ink transition-colors duration-200 active:text-muted"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="hb-container hb-safe-bottom shrink-0">
              <div className="animate-rise flex flex-col gap-2.5 pb-6 pt-4 [animation-delay:260ms]">
                {user ? (
                  <>
                    <Link
                      href={workspaceHref}
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-accent text-base font-medium text-white active:bg-accent-press"
                    >
                      Open workspace
                    </Link>
                    <SignOutButton className="inline-flex h-12 items-center justify-center rounded-full bg-paper-3 text-base font-medium text-rust" />
                  </>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-accent text-base font-medium text-white active:bg-accent-press"
                    >
                      Start free
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex h-12 items-center justify-center rounded-full bg-paper-3 text-base font-medium text-ink"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/* ── Workspace shell ─────────────────────────────────────────────────────── */

function AppShell({
  user,
  pathname,
  employer,
  children,
}: {
  user: SessionUser;
  pathname: string;
  employer: boolean;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const groups = employer ? employerNav : candidateNav;
  const workspaceLabel = employer ? "Hiring workspace" : "Career workspace";

  return (
    <div className="min-h-dvh bg-paper-2">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-line bg-[#fbfbfd] md:flex">
        <div className="flex h-[60px] shrink-0 items-center px-5">
          <Logo />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6 pt-3" aria-label={workspaceLabel}>
          {groups.map((group) => (
            <div key={group.group} className="mb-6">
              <p className="px-3 pb-1.5 text-2xs font-semibold text-faint">{group.group}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition-[background-color,color] duration-300 ease-apple",
                          active
                            ? "bg-ink/[0.07] font-semibold text-ink"
                            : "font-medium text-graphite hover:bg-ink/[0.04] hover:text-ink",
                        )}
                      >
                        <item.icon
                          size={17}
                          strokeWidth={active ? 2 : 1.7}
                          className={cn(
                            "shrink-0 transition-colors duration-300 ease-apple",
                            active ? "text-accent" : "text-faint group-hover:text-graphite",
                          )}
                          aria-hidden
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-[10px] p-2 transition-colors duration-300 ease-apple hover:bg-ink/[0.04]"
          >
            <span className="hb-avatar h-9 w-9 text-2xs">
              {initials(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
              <span className="block truncate text-2xs text-muted">{user.email}</span>
            </span>
          </Link>
          <SignOutButton className="mt-1 flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium text-muted transition-colors duration-300 ease-apple hover:bg-rust-soft hover:text-rust" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="hb-glass-bar fixed inset-x-0 top-0 z-40 flex h-[52px] items-center justify-between border-b border-black/[0.06] px-4 md:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="-mr-1.5 flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors duration-200 hover:bg-ink/[0.06]"
          aria-label="Open navigation"
        >
          <Menu size={19} strokeWidth={1.8} aria-hidden />
        </button>
      </header>

      <div className="pt-[52px] md:pl-[260px] md:pt-0">
        <div className="pb-[76px] md:pb-0">{children}</div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="hb-glass-bar hb-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] md:hidden"
        aria-label="Workspace"
      >
        <ul className="grid grid-cols-5">
          {mobileTabs(employer).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-[58px] flex-col items-center justify-center gap-1 text-3xs font-medium transition-[color,transform] duration-200 ease-apple active:scale-95",
                    active ? "text-accent" : "text-muted",
                  )}
                >
                  <item.icon size={21} strokeWidth={active ? 2 : 1.6} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-[58px] w-full flex-col items-center justify-center gap-1 text-3xs font-medium text-muted transition-transform duration-200 ease-apple active:scale-95"
            >
              <Menu size={21} strokeWidth={1.6} aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="hb-dialog-overlay fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
          <Dialog.Content className="hb-drawer-content fixed inset-y-0 right-0 z-[61] flex w-[86vw] max-w-[340px] flex-col rounded-l-2xl bg-paper shadow-2xl focus:outline-none">
            <div className="flex h-[56px] shrink-0 items-center justify-between px-5">
              <Dialog.Title className="text-sm font-semibold text-ink">{workspaceLabel}</Dialog.Title>
              <Dialog.Close
                className="-mr-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-paper-3 text-graphite transition-[background-color,transform] duration-200 ease-apple hover:bg-paper-4 active:scale-95"
                aria-label="Close navigation"
              >
                <X size={15} strokeWidth={2.2} aria-hidden />
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
              {groups.map((group) => (
                <div key={group.group} className="mb-5">
                  <p className="px-3 pb-1.5 text-2xs font-semibold text-faint">{group.group}</p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            onClick={() => setDrawerOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-md",
                              active
                                ? "bg-ink/[0.07] font-semibold text-ink"
                                : "font-medium text-graphite active:bg-ink/[0.04]",
                            )}
                          >
                            <item.icon
                              size={18}
                              strokeWidth={active ? 2 : 1.7}
                              className={active ? "text-accent" : "text-faint"}
                              aria-hidden
                            />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              <div className="border-t border-line pt-3">
                <Link
                  href="/profile"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-md font-medium text-graphite active:bg-ink/[0.04]"
                >
                  <UserRound size={18} strokeWidth={1.7} className="text-faint" aria-hidden />
                  Profile settings
                </Link>
                <Link
                  href="/employers"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-md font-medium text-graphite active:bg-ink/[0.04]"
                >
                  <Briefcase size={18} strokeWidth={1.7} className="text-faint" aria-hidden />
                  For employers
                </Link>
              </div>
            </div>
            <div className="hb-safe-bottom shrink-0 border-t border-line">
              <div className="p-3">
                <p className="truncate px-3 pb-1.5 text-2xs text-muted">{user.email}</p>
                <SignOutButton className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-md font-medium text-rust active:bg-rust-soft" />
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function mobileTabs(employer: boolean): NavItem[] {
  return employer
    ? [
        { label: "Overview", href: "/employers/dashboard", icon: LayoutDashboard },
        { label: "Post", href: "/employers/dashboard#post", icon: Briefcase },
        { label: "Talent", href: "/employers", icon: Compass },
        { label: "Jobs", href: "/jobs", icon: GraduationCap },
      ]
    : [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "Journey", href: "/journey", icon: Map },
        { label: "Planner", href: "/planner", icon: CalendarDays },
        { label: "Portfolio", href: "/portfolio", icon: Briefcase },
      ];
}

function isActive(pathname: string, href: string): boolean {
  const [path, hash] = href.split("#");
  // In-page anchors are shortcuts, not places, so they never mark the current
  // page. The one exception is "Candidates", which owns the review routes.
  if (hash) return hash === "candidates" && pathname.startsWith("/employers/jobs/");
  if (path === "/dashboard" || path === "/employers/dashboard" || path === "/employers") {
    return pathname === path;
  }
  return pathname === path || pathname.startsWith(path + "/");
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Cookie is cleared server-side even if the request fails.
    }
    router.push("/");
    router.refresh();
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={busy}
      className={cn("flex items-center gap-2 disabled:opacity-60", className)}
    >
      <LogOut size={15} strokeWidth={1.7} aria-hidden />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
