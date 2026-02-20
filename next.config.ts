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
        source: '/events/:id/:hash/og.png',
        destination: '/api/og?eventId=:id',
      }
    ];
  },
};

export default nextConfig;
