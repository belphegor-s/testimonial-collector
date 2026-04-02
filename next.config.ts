import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [new URL('https://urizlqjfhsekknbzzric.supabase.co/storage/**')],
  },
  reactStrictMode: false,
};

export default nextConfig;
