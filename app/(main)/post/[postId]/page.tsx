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
 * - @/lib/supabase/service-role: Supabase service role 클라이언트
 * - @clerk/nextjs/server: Clerk 인증
 */

import { Suspense } from "react";
import { PostDetailContent } from "@/components/post/PostDetailContent";
import { PostDetailSkeleton } from "@/components/post/PostDetailSkeleton";
import { notFound } from "next/navigation";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { auth } from "@clerk/nextjs/server";
import type { PostWithUserAndStats } from "@/lib/types";

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

async function fetchPost(postId: string): Promise<PostWithUserAndStats | null> {
  try {
    const supabase = getServiceRoleClient();

    // 게시물 조회
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("Error fetching post:", postError);
      return null;
    }

    // 통계 정보 가져오기
    const { data: stat, error: statError } = await supabase
      .from("post_stats")
      .select("*")
      .eq("post_id", postId)
      .single();

    if (statError) {
      console.error("Error fetching post stats:", statError);
      // 통계 조회 실패해도 게시물은 반환
    }

    // 작성자 정보 가져오기
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", post.user_id)
      .single();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return null;
    }

    // 현재 사용자의 좋아요 여부 확인
    const { userId } = await auth();
    let isLiked = false;

    if (userId) {
      // Clerk userId로 Supabase users 테이블에서 id 찾기
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .single();

      if (currentUser) {
        const { data: like } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", currentUser.id)
          .single();

        isLiked = !!like;
      }
    }

    // 응답 데이터 구성
    const postWithUserAndStats: PostWithUserAndStats = {
      ...post,
      user,
      likes_count: stat ? Number(stat.likes_count) || 0 : 0,
      comments_count: stat ? Number(stat.comments_count) || 0 : 0,
      isLiked,
    };

    return postWithUserAndStats;
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

