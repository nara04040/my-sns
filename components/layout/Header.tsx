"use client";

/**
 * @file Header.tsx
 * @description 모바일 헤더 컴포넌트
 *
 * 모바일(<768px)에서만 표시되는 상단 헤더
 * 높이: 60px
 * 내용: Instagram 로고 + 알림 + DM + 프로필
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증 상태
 * - lucide-react: 아이콘
 * - next/link: 라우팅
 */

import { Heart, Send, User } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, isLoaded } = useUser();
  const profileHref = isLoaded && user ? `/profile/${user.id}` : "/profile";

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-[#dbdbdb] z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* 로고 */}
        <Link href="/" className="text-xl font-bold text-[#262626]">
          Instagram
        </Link>

        {/* 우측 아이콘들 */}
        <div className="flex items-center gap-4">
          {/* 알림 (나중에 구현) */}
          <Link
            href="/notifications"
            className="p-2 hover:opacity-70 transition-opacity"
          >
            <Heart className="w-6 h-6 text-[#262626]" strokeWidth={2} />
          </Link>

          {/* DM (나중에 구현) */}
          <Link
            href="/direct"
            className="p-2 hover:opacity-70 transition-opacity"
          >
            <Send className="w-6 h-6 text-[#262626]" strokeWidth={2} />
          </Link>

          {/* 프로필 */}
          <Link
            href={profileHref}
            className="p-2 hover:opacity-70 transition-opacity"
          >
            <User className="w-6 h-6 text-[#262626]" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </header>
  );
}

