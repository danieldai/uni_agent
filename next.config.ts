import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',           // Enable static export for Capacitor
  trailingSlash: true,        // Better mobile compatibility
  images: {
    unoptimized: true,        // Required for Capacitor static export
  },
  eslint: {
    ignoreDuringBuilds: true, // Disable linting during build
  },
  typescript: {
    ignoreBuildErrors: true,  // Disable TypeScript errors during build
  },
};

export default nextConfig;
