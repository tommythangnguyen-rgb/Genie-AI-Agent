import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  devIndicators: false,
  
  // Configure asset prefix for proxy deployment (only assetPrefix, no basePath)
  assetPrefix: isDev && process.env.PROXY_MODE === 'true' ? '/proxy/3000' : '',
};

export default nextConfig;
