import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   typescript: {
    ignoreBuildErrors: true,
  },
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.convex.site',
      },
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
    ],
  },
};

export default nextConfig;
