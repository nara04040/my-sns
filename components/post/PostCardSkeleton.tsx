/**
 * @file PostCardSkeleton.tsx
 * @description PostCard의 로딩 스켈레톤 컴포넌트
 *
 * 게시물 데이터가 로딩 중일 때 표시되는 스켈레톤 UI입니다.
 * PostCard와 동일한 레이아웃 구조를 가지며, Shimmer 애니메이션 효과를 포함합니다.
 *
 * @dependencies
 * - @/components/ui/skeleton: Skeleton 컴포넌트
 */

import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <article className="bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] rounded-sm mb-4">
      {/* 헤더 영역 (60px) */}
      <header className="flex items-center justify-between px-4 py-3 h-[60px]">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 스켈레톤 */}
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex flex-col gap-2">
            {/* 사용자명 스켈레톤 */}
            <Skeleton className="h-4 w-24" />
            {/* 시간 스켈레톤 */}
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        {/* 메뉴 버튼 스켈레톤 */}
        <Skeleton className="w-5 h-5 rounded" />
      </header>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div className="relative w-full aspect-square bg-gray-100">
        <Skeleton className="w-full h-full" />
      </div>

      {/* 액션 버튼 영역 (48px) */}
      <div className="flex items-center justify-between px-4 py-2 h-[48px]">
        <div className="flex items-center gap-4">
          {/* 좋아요, 댓글, 공유 버튼 스켈레톤 */}
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>
        {/* 북마크 버튼 스켈레톤 */}
        <Skeleton className="w-6 h-6 rounded" />
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 스켈레톤 */}
        <Skeleton className="h-4 w-24" />

        {/* 캡션 스켈레톤 */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* 댓글 미리보기 스켈레톤 */}
        <div className="space-y-2 pt-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </article>
  );
}

