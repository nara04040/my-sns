import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "picsum.photos" },
      // Supabase Storage public URL (images)
      { hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
