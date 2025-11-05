"use client";

/**
 * @file components/profile/PostGrid.tsx
 * @description 프로필 페이지 게시물 그리드 컴포넌트
 *
 * 특정 사용자의 게시물을 3열 그리드 레이아웃으로 표시하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 3열 그리드 레이아웃 (모바일/데스크톱 모두 3열)
 * 2. 게시물 썸네일 (1:1 정사각형)
 * 3. Hover 시 좋아요/댓글 수 표시 (데스크톱)
 * 4. 클릭 시 게시물 상세 페이지 이동
 *
 * 레이아웃:
 * - 그리드: 3열 고정 (`grid-cols-3`)
 * - 간격: 모바일 `gap-1`, 데스크톱 `gap-4`
 * - 썸네일: `aspect-square` (1:1 정사각형)
 *
 * @dependencies
 * - next/image: Image 컴포넌트
 * - next/link: Link 컴포넌트
 * - lucide-react: 아이콘 (Heart, MessageCircle)
 * - @/lib/types: PostWithUserAndStats 타입
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import type { PostWithUserAndStats } from "@/lib/types";

interface PostGridProps {
  /** Clerk user ID */
  userId: string;
}

export function PostGrid({ userId }: PostGridProps) {
  const [posts, setPosts] = useState<PostWithUserAndStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 게시물 목록 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/posts?userId=${userId}&limit=100`);

        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data = await response.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError("게시물을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchPosts();
    }
  }, [userId]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1 md:gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square bg-gray-200 rounded-sm animate-pulse"
            role="presentation"
          />
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8e8e8e]">{error}</p>
      </div>
    );
  }

  // 게시물이 없는 경우
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8e8e8e]">게시물이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4">
      {posts.map((post) => (
        <PostGridItem key={post.id} post={post} />
      ))}
    </div>
  );
}

interface PostGridItemProps {
  post: PostWithUserAndStats;
}

function PostGridItem({ post }: PostGridItemProps) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="relative aspect-square group cursor-pointer"
    >
      {/* 이미지 */}
      <div className="relative w-full h-full bg-gray-100 rounded-sm overflow-hidden">
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 33vw, 210px"
        />

        {/* Hover 오버레이 (데스크톱만) */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden md:flex items-center justify-center gap-6">
          {/* 좋아요 수 */}
          <div className="flex items-center gap-2 text-white">
            <Heart className="w-6 h-6 fill-white" />
            <span className="font-semibold text-sm">
              {post.likes_count.toLocaleString()}
            </span>
          </div>

          {/* 댓글 수 */}
          <div className="flex items-center gap-2 text-white">
            <MessageCircle className="w-6 h-6 fill-white" />
            <span className="font-semibold text-sm">
              {post.comments_count.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

