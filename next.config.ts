import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Docker Desktop on Windows may not forward filesystem change events.
  watchOptions:
    process.env.DOCKER_WATCH_POLLING === "true"
      ? { pollIntervalMs: 1000 }
      : undefined,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
