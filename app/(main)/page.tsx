/**
 * @file (main)/page.tsx
 * @description 홈 피드 페이지
 *
 * Instagram 스타일의 홈 피드 페이지
 * 게시물 목록을 표시하는 메인 페이지
 *
 * @dependencies
 * - @/components/post/PostFeed: 게시물 피드 컴포넌트
 */

import { PostFeed } from "@/components/post/PostFeed";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--instagram-background)] py-4">
      <PostFeed />
    </div>
  );
}

