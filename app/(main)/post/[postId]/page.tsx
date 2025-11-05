/**
 * @file (main)/post/[postId]/page.tsx
 * @description 게시물 상세 페이지
 *
 * 게시물의 상세 정보를 표시하는 페이지입니다.
 *
 * 주요 기능:
 * 1. 게시물 상세 정보 표시 (이미지, 캡션, 작성자 정보)
 * 2. 좋아요 기능
 * 3. 댓글 목록 표시 및 작성
 *
 * 레이아웃:
 * - 데스크톱 (1024px+): 이미지 영역 (50%) + 댓글 영역 (50%, 스크롤 가능)
 * - 모바일/태블릿 (<1024px): 세로 스택 레이아웃
 *
 * @dependencies
 * - @/components/post/PostDetailContent: 게시물 상세 컨텐츠 컴포넌트
 * - @/lib/types: PostWithUserAndStats 타입
 */

import { Suspense } from "react";
import { headers } from "next/headers";
import { PostDetailContent } from "@/components/post/PostDetailContent";
import { PostDetailSkeleton } from "@/components/post/PostDetailSkeleton";
import { notFound } from "next/navigation";

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

async function fetchPost(postId: string) {
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    const response = await fetch(`${baseUrl}/api/posts/${postId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch post");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}

export default async function PostDetailPage({
  params,
}: PostDetailPageProps) {
  const { postId } = await params;

  if (!postId) {
    notFound();
  }

  const post = await fetchPost(postId);

  if (!post) {
    notFound();
  }

  return (
    <div className="w-full py-4 lg:py-8">
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostDetailContent post={post} />
      </Suspense>
    </div>
  );
}

