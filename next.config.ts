import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  // Explicitly tell Next.js to allow custom Webpack configs underneath Turbopack
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.eventfinda.co.nz',
      }
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
