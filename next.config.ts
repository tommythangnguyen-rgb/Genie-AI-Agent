import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  devIndicators: false,

  // Configure asset prefix for proxy deployment (only assetPrefix, no basePath)
  assetPrefix: isDev && process.env.PROXY_MODE === 'true' ? '/proxy/3000' : '',

  // Ensure Prisma query engine binary is included in the Vercel bundle
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["./src/generated/prisma/**/*"],
    },
  },
};

export default nextConfig;
