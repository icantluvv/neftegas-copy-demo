import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/api"],
  async rewrites() {
    const backInternalUrl = process.env.BACK_INTERNAL_URL;
    if (!backInternalUrl) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${backInternalUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
