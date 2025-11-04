"use client";

/**
 * @file PostGrid.tsx
 * @description 프로필 페이지용 게시물 그리드 컴포넌트
 *
 * 3열 그리드 레이아웃으로 게시물 썸네일을 표시합니다.
 *
 * 주요 기능:
 * 1. 3열 그리드 레이아웃 (반응형: 모바일 3열, 태블릿 3열, 데스크톱 3열)
 * 2. 게시물 썸네일 (1:1 정사각형)
 * 3. Hover 시 좋아요/댓글 수 표시
 * 4. 클릭 시 게시물 상세 페이지로 이동
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - next/link: 라우팅
 * - lucide-react: 아이콘
 * - @/lib/types: 타입 정의
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import type { PostWithUserAndStats } from "@/lib/types";

interface PostGridProps {
  /** 사용자 ID (특정 사용자의 게시물만 표시) */
  userId: string;
}

interface PostThumbnail {
  id: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
}

export function PostGrid({ userId }: PostGridProps) {
  const [posts, setPosts] = useState<PostThumbnail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // 게시물 목록 불러오기
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/posts?userId=${userId}&limit=30&offset=0`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data = await response.json();
        const postThumbnails: PostThumbnail[] = data.posts.map(
          (post: PostWithUserAndStats) => ({
            id: post.id,
            image_url: post.image_url,
            likes_count: post.likes_count,
            comments_count: post.comments_count,
          })
        );

        setPosts(postThumbnails);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [userId]);

  // 게시물이 없는 경우
  if (!isLoading && posts.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[var(--text-secondary)]">
        게시물이 없습니다.
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      {/* 3열 그리드 */}
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {posts.map((post) => (
          <PostThumbnailItem key={post.id} post={post} />
        ))}
      </div>

      {/* 로딩 중 */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface PostThumbnailItemProps {
  post: PostThumbnail;
}

function PostThumbnailItem({ post }: PostThumbnailItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={`/post/${post.id}`}
      className="relative aspect-square bg-gray-100 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 이미지 */}
      <Image
        src={post.image_url}
        alt="게시물 썸네일"
        fill
        className="object-cover"
        sizes="(max-width: 768px) 33vw, 210px"
      />

      {/* Hover 오버레이 (좋아요/댓글 수 표시) */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-6 text-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-white" />
            <span className="font-semibold">{post.likes_count}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 fill-white" />
            <span className="font-semibold">{post.comments_count}</span>
          </div>
        </div>
      )}
    </Link>
  );
}

