import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Human Bridge — Career-to-Employment Platform",
  description: "Find the skills. Build the skills. Prove the skills. Get hired. Human Bridge connects the skills companies need with the people ready to build them.",
  keywords: "career platform, skill gap analysis, employment, job matching, skills assessment, career development",
  openGraph: {
    title: "Human Bridge — Career-to-Employment Platform",
    description: "Find the skills. Build the skills. Prove the skills. Get hired.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-slate-900 antialiased">
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
