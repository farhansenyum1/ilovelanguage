import type { NextConfig } from "next";

const devOrigins = ["192.168.100.166", "*.*.*.*"];
const devHosts = ["192.168.100.166:3000", "*.*.*.*:3000"];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ["@prisma/client", "prisma"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: devOrigins,
    experimental: {
      serverActions: {
        allowedOrigins: devHosts,
      },
    },
  }),
};

export default nextConfig;