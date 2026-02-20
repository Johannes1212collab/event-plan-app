import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/events/:id/og.png',
        destination: '/api/og?eventId=:id',
      },
      {
        source: '/og.png',
        destination: '/opengraph-image',
      }
    ];
  },
};

export default nextConfig;
