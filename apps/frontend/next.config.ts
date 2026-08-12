import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/api"],
  // Плавающая dev-панель Next.js перехватывает клики Playwright поверх
  // реального контента в dev-режиме (nextjs-portal с max z-index) — мешает
  // e2e без какой-либо пользы в тестовом окружении.
  devIndicators: false,
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
