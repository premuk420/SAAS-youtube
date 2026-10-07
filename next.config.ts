import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // TOTO MUSÍ BÝT ZDE NA NEJVYŠŠÍ ÚROVNI
  experimental: {
    agentFeedback: true,
  },
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