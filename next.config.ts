import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

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

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

export default withPWA(nextConfig);
