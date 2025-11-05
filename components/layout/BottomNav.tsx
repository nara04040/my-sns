"use client";

/**
 * @file BottomNav.tsx
 * @description 모바일 하단 네비게이션 컴포넌트
 *
 * 모바일(<768px)에서만 표시되는 하단 네비게이션
 * 높이: 50px
 * 메뉴: 홈, 검색, 만들기, 알림, 프로필 (5개)
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증 상태
 * - lucide-react: 아이콘
 * - next/link: 라우팅
 * - @/components/post/CreatePostModal: 게시물 작성 모달
 */

import { useState } from "react";
import { Home, Search, PlusSquare, Heart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { CreatePostModal } from "@/components/post/CreatePostModal";

interface NavItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  label: string;
  isActive?: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  {
    icon: Home,
    href: "/",
    label: "홈",
    isActive: (pathname) => pathname === "/",
  },
  {
    icon: Search,
    href: "/explore",
    label: "검색",
    isActive: (pathname) => pathname.startsWith("/explore"),
  },
  {
    icon: PlusSquare,
    href: "/create",
    label: "만들기",
    isActive: (pathname) => pathname.startsWith("/create"),
  },
  {
    icon: Heart,
    href: "/notifications",
    label: "알림",
    isActive: (pathname) => pathname.startsWith("/notifications"),
  },
  {
    icon: User,
    href: "/profile",
    label: "프로필",
    isActive: (pathname) => pathname.startsWith("/profile"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const profileHref = isLoaded && user ? `/profile/${user.id}` : "/profile";

  return (
    <>
      <CreatePostModal
        open={isCreatePostModalOpen}
        onOpenChange={setIsCreatePostModalOpen}
      />
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t border-[#dbdbdb] z-50">
        <div className="flex items-center justify-around h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.isActive?.(pathname) ??
              (pathname === item.href ||
                (item.href === "/profile" && pathname.startsWith("/profile")));

            // 프로필 링크는 동적으로 설정
            const href = item.href === "/profile" ? profileHref : item.href;

            // "만들기" 메뉴는 모달을 열도록 처리
            if (item.href === "/create") {
              return (
                <button
                  key={item.href}
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full",
                    "hover:bg-[#fafafa] transition-colors",
                    isActive ? "text-[#262626]" : "text-[#262626] opacity-60"
                  )}
                  title={item.label}
                >
                  <Icon
                    className="w-6 h-6"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full",
                  "hover:bg-[#fafafa] transition-colors",
                  isActive ? "text-[#262626]" : "text-[#262626] opacity-60"
                )}
                title={item.label}
              >
                <Icon
                  className="w-6 h-6"
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

