import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#1a56ff] rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 14C3 14 3 10 6.5 9C10 8 14 9 14 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="3" cy="14" r="1.5" fill="white"/>
                  <circle cx="14" cy="4" r="1.5" fill="white"/>
                </svg>
              </div>
              <span className="text-[15px] font-bold text-white">
                Human<span className="text-[#1a56ff]">Bridge</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              The career-to-employment infrastructure platform. Find the skills. Build the skills. Prove the skills. Get hired.
            </p>
            <div className="mt-5">
              <Link href="/onboarding" className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#1a56ff] px-4 py-2 rounded-lg hover:bg-[#1040cc] transition-colors">
                Start your journey
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Explore Careers", href: "/careers" },
                { label: "Browse Jobs", href: "/jobs" },
                { label: "Skills Library", href: "/skills" },
                { label: "Learning", href: "/skills#learning" },
                { label: "Assessments", href: "/assessments" },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-400 hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Tools</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Skill Passport", href: "/passport" },
                { label: "Skill Gap Analysis", href: "/dashboard" },
                { label: "AI Career Copilot", href: "/ai-copilot" },
                { label: "Dashboard", href: "/dashboard" },
                { label: "For Employers", href: "/employers" },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-slate-400 hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[
                { label: "About Human Bridge", href: "#" },
                { label: "Our Mission", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Careers at HB", href: "#" },
                { label: "Contact", href: "#" },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-slate-400 hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2025 HumanBridge. All rights reserved. Demo data used throughout — not real employment or salary data.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Terms of Service</Link>
            <Link href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
