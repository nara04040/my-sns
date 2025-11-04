/**
 * @file (main)/layout.tsx
 * @description 메인 레이아웃 컴포넌트
 *
 * 인증된 사용자를 위한 메인 레이아웃
 * 
 * 반응형 레이아웃:
 * - 데스크톱 (1024px+): Sidebar (244px) + 메인 콘텐츠 (최대 630px, 중앙 정렬)
 * - 태블릿 (768px~1023px): Sidebar (72px) + 메인 콘텐츠 (전체 너비)
 * - 모바일 (<768px): Header (60px) + 메인 콘텐츠 (전체 너비) + BottomNav (50px)
 *
 * @dependencies
 * - components/layout/Sidebar
 * - components/layout/Header
 * - components/layout/BottomNav
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* 데스크톱/태블릿 사이드바 */}
      <Sidebar />

      {/* 모바일 헤더 */}
      <Header />

      {/* 메인 콘텐츠 영역 */}
      <main className="min-h-screen bg-[#fafafa] pt-[60px] md:pt-0 md:pl-[72px] lg:pl-[244px] pb-[50px] md:pb-0">
        {/* 콘텐츠 컨테이너 */}
        {/* 
          데스크톱 (1024px+): 최대 630px 중앙 정렬
          태블릿 (768px~1023px): 전체 너비 (Sidebar 72px 제외)
          모바일 (<768px): 전체 너비 (좌우 패딩 추가)
        */}
        <div className="w-full md:max-w-none lg:max-w-[630px] lg:mx-auto px-4 md:px-6 lg:px-0">
          {children}
        </div>
      </main>

      {/* 모바일 하단 네비게이션 */}
      <BottomNav />
    </>
  );
}

