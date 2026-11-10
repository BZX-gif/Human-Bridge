import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="pt-16 min-h-screen bg-[#F7F7F3] flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="w-16 h-16 bg-[#EFEFE9] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Search size={28} className="text-[#0B0B0C]" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Page not found</h1>
        <p className="text-slate-500 text-lg mb-8">
          The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-[#0B0B0C] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#2B2B30] transition-colors text-sm"
          >
            <ArrowLeft size={15} />
            Back to Home
          </Link>
          <Link
            href="/careers"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
          >
            Explore Careers
          </Link>
        </div>
      </div>
    </main>
  );
}
