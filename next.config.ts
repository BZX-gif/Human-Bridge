import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Database drivers must run as real Node modules. Bundling them breaks
  // PGlite's wasm/filesystem loader and postgres.js's socket handling.
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
};

export default nextConfig;
