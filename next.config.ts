import type { NextConfig } from "next";

/**
 * Extra hosts allowed to load Next's dev-only resources (HMR socket, dev
 * endpoints) when `next dev` is reached through a proxy or preview URL instead
 * of localhost. Comma-separated, wildcards allowed, e.g. `*.example.dev`.
 * Development only: production builds ignore this entirely.
 */
const allowedDevOrigins = (process.env.HB_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Database drivers must run as real Node modules. Bundling them breaks
  // PGlite's wasm/filesystem loader and pg's socket handling.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],

  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),

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
