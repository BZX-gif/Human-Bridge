"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
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
      { label: "Mentor", href: "/mentor", icon: Sparkles },
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
      <div className="min-h-screen bg-paper">
        <header className="flex h-16 items-center justify-between border-b border-line px-5 sm:px-8">
          <Logo />
          <Link
            href="/"
            className="text-xs font-medium text-muted transition-colors hover:text-ink"
          >
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
    <div className="min-h-screen bg-paper">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-xl">
        <div className="hb-container flex h-16 items-center justify-between gap-6">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  pathname === link.href
                    ? "bg-paper-3 text-ink"
                    : "text-muted hover:bg-paper-2 hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Link
                  href={workspaceHref}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-4 text-[13px] font-medium text-paper transition-colors hover:bg-graphite"
                >
                  Open workspace
                  <ArrowUpRight size={14} aria-hidden />
                </Link>
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setUserOpen((open) => !open)}
                    aria-expanded={userOpen}
                    aria-haspopup="menu"
                    className="flex h-9 items-center gap-1.5 rounded-md border border-line px-2 text-[13px] font-medium text-graphite transition-colors hover:border-line-strong"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-ink text-[10px] font-semibold text-paper">
                      {initials(user.name)}
                    </span>
                    <ChevronDown size={13} aria-hidden />
                  </button>
                  {userOpen && (
                    <div
                      role="menu"
                      className="animate-scale-in absolute right-0 top-full mt-2 w-56 rounded-lg border border-line bg-paper p-1.5 shadow-lg"
                    >
                      <div className="px-2.5 py-2">
                        <p className="truncate text-[13px] font-medium text-ink">{user.name}</p>
                        <p className="truncate text-[11px] text-muted">{user.email}</p>
                      </div>
                      <div className="my-1 h-px bg-line" />
                      <Link
                        href={workspaceHref}
                        role="menuitem"
                        onClick={() => setUserOpen(false)}
                        className="block rounded-md px-2.5 py-2 text-[13px] text-graphite hover:bg-paper-2"
                      >
                        Workspace
                      </Link>
                      <Link
                        href="/profile"
                        role="menuitem"
                        onClick={() => setUserOpen(false)}
                        className="block rounded-md px-2.5 py-2 text-[13px] text-graphite hover:bg-paper-2"
                      >
                        Profile settings
                      </Link>
                      <SignOutButton className="w-full rounded-md px-2.5 py-2 text-left text-[13px] text-rust hover:bg-rust-soft" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center rounded-md px-3 text-[13px] font-medium text-graphite transition-colors hover:bg-paper-2 hover:text-ink"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink px-4 text-[13px] font-medium text-paper transition-colors hover:bg-graphite"
                >
                  Start free
                  <ArrowUpRight size={14} aria-hidden />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-graphite md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} aria-hidden />
          </button>
        </div>
      </header>

      <div className="pt-16">{children}</div>
      <Footer />

      <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="hb-dialog-overlay fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm" />
          <Dialog.Content className="hb-dialog-content fixed inset-x-0 top-0 z-[61] max-h-[92dvh] overflow-y-auto rounded-b-2xl border-b border-line bg-paper p-5 shadow-xl sm:hidden">
            <div className="flex items-center justify-between">
              <Dialog.Title className="sr-only">Navigation</Dialog.Title>
              <Logo />
              <Dialog.Close
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-graphite"
                aria-label="Close menu"
              >
                <X size={18} aria-hidden />
              </Dialog.Close>
            </div>
            <nav className="mt-6 space-y-0.5" aria-label="Mobile">
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-line/70 py-3 text-[15px] font-medium text-graphite last:border-0"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    href={workspaceHref}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-ink text-sm font-medium text-paper"
                  >
                    Open workspace
                  </Link>
                  <SignOutButton className="inline-flex h-11 items-center justify-center rounded-md border border-line text-sm font-medium text-rust" />
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="inline-flex h-11 items-center justify-center rounded-md bg-ink text-sm font-medium text-paper"
                  >
                    Start free
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-line text-sm font-medium text-graphite"
                  >
                    Sign in
                  </Link>
                </>
              )}
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
    <div className="min-h-screen bg-paper-2">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-line bg-paper md:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6 pt-5">
          <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
            {workspaceLabel}
          </p>
          {groups.map((group) => (
            <div key={group.group} className="mb-5">
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                {group.group}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                          active
                            ? "bg-ink text-paper"
                            : "text-graphite hover:bg-paper-2 hover:text-ink",
                        )}
                      >
                        <item.icon
                          size={15}
                          strokeWidth={1.7}
                          className={active ? "text-paper" : "text-faint group-hover:text-graphite"}
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
        </div>

        <div className="border-t border-line p-3">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 rounded-md p-2 transition-colors hover:bg-paper-2"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-ink text-[11px] font-semibold text-paper">
              {initials(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium text-ink">{user.name}</span>
              <span className="block truncate text-[11px] text-muted">{user.email}</span>
            </span>
          </Link>
          <SignOutButton className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12.5px] font-medium text-muted transition-colors hover:bg-rust-soft hover:text-rust" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur-md md:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-graphite"
          aria-label="Open navigation"
        >
          <Menu size={18} aria-hidden />
        </button>
      </header>

      <div className="pt-14 md:pl-[248px] md:pt-0">
        <div className="pb-[74px] md:pb-0">{children}</div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="hb-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md md:hidden"
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
                    "flex h-[58px] flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                    active ? "text-ink" : "text-muted",
                  )}
                >
                  <item.icon size={18} strokeWidth={active ? 2 : 1.6} aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex h-[58px] w-full flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted"
            >
              <Menu size={18} strokeWidth={1.6} aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="hb-dialog-overlay fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm" />
          <Dialog.Content className="hb-dialog-content fixed inset-y-0 right-0 z-[61] flex w-[86vw] max-w-[340px] flex-col border-l border-line bg-paper shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-line px-4">
              <Dialog.Title className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                {workspaceLabel}
              </Dialog.Title>
              <Dialog.Close
                className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-graphite"
                aria-label="Close navigation"
              >
                <X size={17} aria-hidden />
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              {groups.map((group) => (
                <div key={group.group} className="mb-5">
                  <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                    {group.group}
                  </p>
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
                              "flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-[13.5px] font-medium",
                              active ? "bg-ink text-paper" : "text-graphite hover:bg-paper-2",
                            )}
                          >
                            <item.icon size={16} strokeWidth={1.7} aria-hidden />
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
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-[13.5px] font-medium text-graphite hover:bg-paper-2"
                >
                  <UserRound size={16} strokeWidth={1.7} aria-hidden />
                  Profile settings
                </Link>
                <Link
                  href="/employers"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-[13.5px] font-medium text-graphite hover:bg-paper-2"
                >
                  <Briefcase size={16} strokeWidth={1.7} aria-hidden />
                  For employers
                </Link>
              </div>
            </div>
            <div className="border-t border-line p-3">
              <p className="px-2 pb-2 text-[11px] text-muted">{user.email}</p>
              <SignOutButton className="flex w-full items-center gap-2 rounded-md px-2.5 py-2.5 text-[13px] font-medium text-rust hover:bg-rust-soft" />
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
  const path = href.split("#")[0];
  if (path === "/dashboard" || path === "/employers/dashboard") return pathname === path;
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
