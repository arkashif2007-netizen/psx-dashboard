import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from external sources
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'psx.com.pk' },
      { protocol: 'https', hostname: 'www.investing.com' },
      { protocol: 'https', hostname: 's3.tradingview.com' },
    ],
  },
  // Required for scraping endpoints
  serverExternalPackages: ['cheerio', 'puppeteer-core'],

  // Headers for CORS (needed for Capacitor APK)
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

export default nextConfig;
