import type { NextConfig } from "next";

// BACKEND_URL: set this in Vercel dashboard as an env var (not NEXT_PUBLIC_)
// pointing to your Render backend URL, e.g. https://p2p-solar-backend.onrender.com
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
