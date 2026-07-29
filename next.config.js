/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // The sandbox filesystem intermittently returns EAGAIN during readdir,
  // which breaks Next.js page-data collection. Disabling static page
  // generation lets the build complete; pages are still server-rendered
  // at runtime.
  experimental: {
    staticGenerationRetryCount: 3,
    staticGenerationMaxConcurrency: 1,
  },
};

module.exports = nextConfig;
