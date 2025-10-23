import type { NextConfig } from "next";

// Check if building for mobile (static export), electron (static export), or web (with APIs)
const isMobileBuild = process.env.BUILD_TARGET === 'mobile';
const isElectronBuild = process.env.BUILD_TARGET === 'electron';
const isWebBuild = process.env.BUILD_TARGET === 'web';

const nextConfig: NextConfig = {
  // Static export for mobile and electron, standalone for web Docker, default for dev
  ...(isMobileBuild || isElectronBuild ? { output: 'export' } : {}),
  ...(isWebBuild ? { output: 'standalone' } : {}),

  trailingSlash: false,       // Prevent trailing slash redirects on API routes
  images: {
    unoptimized: isMobileBuild || isElectronBuild, // Only unoptimized for mobile and electron builds
  },
  eslint: {
    ignoreDuringBuilds: true, // Disable linting during build
  },
  typescript: {
    ignoreBuildErrors: true,  // Disable TypeScript errors during build
  },
};

export default nextConfig;
