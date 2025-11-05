/**
 * @file PostDetailSkeleton.tsx
 * @description 게시물 상세 페이지의 로딩 스켈레톤 컴포넌트
 *
 * 게시물 상세 데이터가 로딩 중일 때 표시되는 스켈레톤 UI입니다.
 * 데스크톱과 모바일 레이아웃을 모두 지원합니다.
 *
 * @dependencies
 * - @/components/ui/skeleton: Skeleton 컴포넌트
 */

import { Skeleton } from "@/components/ui/skeleton";

export function PostDetailSkeleton() {
  return (
    <div className="w-full max-w-[935px] mx-auto">
      <article className="bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] rounded-sm overflow-hidden">
        {/* 데스크톱 레이아웃 스켈레톤 (1024px+) */}
        <div className="hidden lg:flex lg:flex-row lg:h-[600px]">
          {/* 이미지 영역 스켈레톤 (50%) */}
          <div className="w-1/2 bg-gray-100">
            <Skeleton className="w-full h-full" />
          </div>

          {/* 댓글 영역 스켈레톤 (50%) */}
          <div className="w-1/2 flex flex-col">
            {/* 헤더 스켈레톤 */}
            <header className="flex items-center justify-between px-4 py-3 h-[60px] border-b border-[var(--instagram-border)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="w-5 h-5 rounded" />
            </header>

            {/* 댓글 목록 스켈레톤 */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 액션 버튼 스켈레톤 */}
            <div className="flex items-center justify-between px-4 py-2 h-[48px] border-t border-[var(--instagram-border)] flex-shrink-0">
              <div className="flex items-center gap-4">
                <Skeleton className="w-6 h-6 rounded" />
                <Skeleton className="w-6 h-6 rounded" />
              </div>
              <Skeleton className="w-6 h-6 rounded" />
            </div>

            {/* 좋아요 수 스켈레톤 */}
            <div className="px-4 py-1 flex-shrink-0">
              <Skeleton className="h-4 w-24" />
            </div>

            {/* 댓글 작성 폼 스켈레톤 */}
            <div className="border-t border-[var(--instagram-border)] px-4 py-3 flex-shrink-0">
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>

        {/* 모바일/태블릿 레이아웃 스켈레톤 (<1024px) */}
        <div className="lg:hidden">
          {/* 헤더 스켈레톤 */}
          <header className="flex items-center justify-between px-4 py-3 h-[60px] border-b border-[var(--instagram-border)]">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="w-5 h-5 rounded" />
          </header>

          {/* 이미지 영역 스켈레톤 */}
          <div className="relative w-full aspect-square bg-gray-100">
            <Skeleton className="w-full h-full" />
          </div>

          {/* 액션 버튼 스켈레톤 */}
          <div className="flex items-center justify-between px-4 py-2 h-[48px]">
            <div className="flex items-center gap-4">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="w-6 h-6 rounded" />
            </div>
            <Skeleton className="w-6 h-6 rounded" />
          </div>

          {/* 컨텐츠 영역 스켈레톤 */}
          <div className="px-4 pb-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>

          {/* 댓글 작성 폼 스켈레톤 */}
          <div className="border-t border-[var(--instagram-border)] px-4 py-3">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </article>
    </div>
  );
}

