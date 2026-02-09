import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.output.globalObject = 'globalThis';
    return config;
  },
};

export default nextConfig;
