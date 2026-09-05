"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  ChevronDown,
  Briefcase,
  BookOpen,
  BarChart3,
  Sparkles,
  Award,
  Users,
  LayoutDashboard,
  LogIn,
} from "lucide-react";

const mainNav = [
  { label: "Careers", href: "/careers", icon: Briefcase },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Skills", href: "/skills", icon: BarChart3 },
  { label: "Learning", href: "/skills#learning", icon: BookOpen },
  { label: "AI Copilot", href: "/ai-copilot", icon: Sparkles },
];

const forEmployers = [
  { label: "For Employers", href: "/employers" },
  { label: "Post a Job", href: "/employers#post" },
  { label: "Find Talent", href: "/employers#talent" },
];

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [employerOpen, setEmployerOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-[#1a56ff] rounded-lg flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-white">
                <path d="M3 14C3 14 3 10 6.5 9C10 8 14 9 14 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="3" cy="14" r="1.5" fill="white"/>
                <circle cx="14" cy="4" r="1.5" fill="white"/>
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-slate-900">
              Human<span className="text-[#1a56ff]">Bridge</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive(item.href)
                    ? "text-[#1a56ff] bg-[#e8edff]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* Employers dropdown */}
            <div className="relative">
              <button
                onClick={() => setEmployerOpen(!employerOpen)}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive("/employers")
                    ? "text-[#1a56ff] bg-[#e8edff]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                For Employers
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform",
                    employerOpen && "rotate-180"
                  )}
                />
              </button>
              {employerOpen && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                  {forEmployers.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                      onClick={() => setEmployerOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive("/dashboard")
                  ? "text-[#1a56ff] bg-[#e8edff]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <LayoutDashboard size={15} />
              Dashboard
            </Link>
            <Link
              href="/passport"
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive("/passport")
                  ? "text-[#1a56ff] bg-[#e8edff]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Award size={15} />
              Skill Passport
            </Link>
            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#1a56ff] rounded-lg hover:bg-[#1040cc] transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 py-3">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive(item.href)
                    ? "text-[#1a56ff] bg-[#e8edff]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
              <Link href="/employers" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                <Users size={16} />
                For Employers
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link href="/passport" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                <Award size={16} />
                Skill Passport
              </Link>
              <Link href="/onboarding" className="block px-3 py-2.5 text-sm font-semibold text-white bg-[#1a56ff] rounded-lg text-center" onClick={() => setMobileOpen(false)}>
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
