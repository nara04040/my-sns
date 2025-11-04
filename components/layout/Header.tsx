"use client";

/**
 * @file Header.tsx
 * @description 모바일 헤더 컴포넌트
 *
 * 모바일(<768px)에서만 표시되는 상단 헤더
 * 높이: 60px
 * 내용: Instagram 로고 + (인증된 경우: 알림 + DM + 프로필) / (인증되지 않은 경우: 로그인 + 회원가입)
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증 상태
 * - lucide-react: 아이콘
 * - next/link: 라우팅
 * - @/components/ui/button: 버튼 컴포넌트
 */

import { Heart, Send, User } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

        {/* 우측 영역 */}
        {isLoaded && !user ? (
          /* 인증되지 않은 경우: 로그인/회원가입 버튼 */
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button
                variant="default"
                size="sm"
                className="bg-[var(--instagram-blue)] text-white hover:bg-[var(--instagram-blue)]/90 h-8 px-4 text-sm"
              >
                로그인
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--instagram-blue)] hover:bg-[#fafafa] h-8 px-4 text-sm"
              >
                회원가입
              </Button>
            </Link>
          </div>
        ) : (
          /* 인증된 경우: 기존 UI (알림 + DM + 프로필) */
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
        )}
      </div>
    </header>
  );
}

