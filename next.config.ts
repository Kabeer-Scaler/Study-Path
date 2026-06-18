import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  reactStrictMode: true,
  serverExternalPackages: ["node:sqlite"]
};

export default nextConfig;
