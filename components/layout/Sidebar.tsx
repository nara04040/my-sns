"use client";

/**
 * @file Sidebar.tsx
 * @description Instagram 스타일 사이드바 컴포넌트
 *
 * 데스크톱(1024px+): 244px 너비, 아이콘 + 텍스트
 * 태블릿(768px~1023px): 72px 너비, 아이콘만
 * 모바일(<768px): 숨김 (Header + BottomNav 사용)
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증 상태
 * - lucide-react: 아이콘
 * - next/link: 라우팅
 */

import { Home, Search, PlusSquare, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface SidebarItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  href: string;
  isActive?: (pathname: string) => boolean;
}

const menuItems: SidebarItem[] = [
  {
    icon: Home,
    label: "홈",
    href: "/",
    isActive: (pathname) => pathname === "/",
  },
  {
    icon: Search,
    label: "검색",
    href: "/explore", // 나중에 구현
    isActive: (pathname) => pathname.startsWith("/explore"),
  },
  {
    icon: PlusSquare,
    label: "만들기",
    href: "/create", // 나중에 모달로 변경 가능
    isActive: (pathname) => pathname.startsWith("/create"),
  },
  {
    icon: User,
    label: "프로필",
    href: "/profile",
    isActive: (pathname) => pathname.startsWith("/profile"),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  // 프로필 링크는 현재 사용자 ID로 설정
  const profileHref = isLoaded && user ? `/profile/${user.id}` : "/profile";

  return (
    <aside className="fixed left-0 top-0 h-screen bg-white border-r border-[#dbdbdb] z-40 hidden md:block">
      {/* 데스크톱 사이드바 (1024px+) */}
      <div className="hidden lg:block w-[244px] h-full">
        <div className="flex flex-col h-full px-4 pt-8">
          {/* 로고 영역 */}
          <div className="mb-8 px-4">
            <Link href="/" className="text-2xl font-bold text-[#262626]">
              Instagram
            </Link>
          </div>

          {/* 메뉴 아이템 */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.isActive?.(pathname) ??
                (pathname === item.href ||
                  (item.href === "/profile" && pathname.startsWith("/profile")));

              // 프로필 링크는 동적으로 설정
              const href =
                item.href === "/profile" ? profileHref : item.href;

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
                    "hover:bg-[#fafafa]",
                    isActive
                      ? "font-semibold text-[#262626]"
                      : "font-normal text-[#262626]"
                  )}
                >
                  <Icon
                    className="w-6 h-6"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 태블릿 사이드바 (768px~1023px) */}
      <div className="lg:hidden w-[72px] h-full">
        <div className="flex flex-col h-full items-center pt-8">
          {/* 로고 영역 */}
          <div className="mb-8">
            <Link href="/" className="text-xl font-bold text-[#262626]">
              IG
            </Link>
          </div>

          {/* 메뉴 아이템 (아이콘만) */}
          <nav className="flex flex-col gap-4 items-center">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.isActive?.(pathname) ??
                (pathname === item.href ||
                  (item.href === "/profile" && pathname.startsWith("/profile")));

              // 프로필 링크는 동적으로 설정
              const href =
                item.href === "/profile" ? profileHref : item.href;

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={cn(
                    "p-3 rounded-lg transition-colors",
                    "hover:bg-[#fafafa]",
                    isActive && "bg-[#fafafa]"
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
          </nav>
        </div>
      </div>
    </aside>
  );
}

