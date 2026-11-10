import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: {
    default: "Human Bridge — Your ambition deserves a direction",
    template: "%s — Human Bridge",
  },
  description:
    "Human Bridge helps you discover career possibilities, understand what they actually require, build a realistic plan, and produce evidence of your work.",
  keywords:
    "career planning, career roadmap, skills, projects, portfolio, skill gap, career development",
  openGraph: {
    title: "Human Bridge — Your ambition deserves a direction",
    description:
      "Discover a career direction, build a roadmap, plan the work and prove what you can do.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-paper text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
        >
          Skip to content
        </a>
        <Navigation user={user}>{children}</Navigation>
      </body>
    </html>
  );
}
