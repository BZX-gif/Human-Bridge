import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Database drivers must run as real Node modules. Bundling them breaks
  // PGlite's wasm/filesystem loader and pg's socket handling.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],

  poweredByHeader: false,

  experimental: {
    // Import-level tree-shaking for the big icon/component barrels. This
    // noticeably speeds up dev compilation and trims client bundles.
    optimizePackageImports: ["lucide-react", "@radix-ui/react-dialog"],
    // Client-side navigation cache: revisiting a dynamic page within 30s
    // reuses the RSC payload instead of refetching (mutations still call
    // router.refresh(), which bypasses this cache).
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
