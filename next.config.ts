import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "picsum.photos" },
      // Supabase Storage 도메인 허용
      // Supabase는 프로젝트별로 다른 서브도메인을 사용하므로 와일드카드 패턴 사용
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
    ],
  },
};

export default nextConfig;
