import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'prisma'],
  devIndicators: {
    position: 'bottom-right',
  },
  // Force server to bind to all interfaces for Railway deployment
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
