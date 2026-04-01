import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  devIndicators: false,

  // Configure asset prefix for proxy deployment (only assetPrefix, no basePath)
  assetPrefix: isDev && process.env.PROXY_MODE === 'true' ? '/proxy/3000' : '',

  // Ensure Prisma client package is not bundled by Next.js (required for native binary)
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Copy the Prisma query engine .node binary into the Vercel output bundle.
  // Without this, the custom output path (src/generated/prisma) is not traced
  // and Vercel cannot find libquery_engine-rhel-openssl-3.0.x.so.node at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...(({ outputFileTracingIncludes: { "/**": ["./src/generated/prisma/**/*.node"] } }) as any),
};

export default nextConfig;
