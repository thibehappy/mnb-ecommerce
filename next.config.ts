import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 95],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'mynicebracelet.com' },
      // Shopify CDN — for any product images we end up serving from
      // Shopify rather than next/image's local pipeline (e.g. if we
      // upload kit/bracelet hero shots to the Shopify product page).
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
