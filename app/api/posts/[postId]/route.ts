import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { PostWithUserAndStats } from "@/lib/types";

/**
 * 게시물 상세 조회 API
 * GET /api/posts/[postId]
 *
 * @param postId - 게시물 ID (UUID)
 *
 * @returns 게시물 상세 정보 (사용자 정보, 통계 포함)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 게시물 조회
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("Error fetching post:", postError);
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: "User not found" },
        { status: 500 }
      );
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

    return NextResponse.json(postWithUserAndStats);
  } catch (error) {
    console.error("Error in GET /api/posts/[postId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 게시물 삭제 API
 * DELETE /api/posts/[postId]
 *
 * @param postId - 게시물 ID (UUID)
 *
 * @returns 삭제 성공 메시지
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Clerk userId로 Supabase users 테이블에서 id 찾기
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !currentUser) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 게시물 조회 및 작성자 확인
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      console.error("Error fetching post:", postError);
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // 작성자 확인
    if (post.user_id !== currentUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own posts" },
        { status: 403 }
      );
    }

    // Storage에서 이미지 삭제
    // image_url에서 파일 경로 추출
    const STORAGE_BUCKET =
      process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads";
    const imageUrl = post.image_url;

    // Public URL에서 파일 경로 추출
    // 예: https://xxx.supabase.co/storage/v1/object/public/uploads/user_id/filename.jpg
    // → uploads/user_id/filename.jpg
    const urlPattern = new RegExp(
      `/${STORAGE_BUCKET}/([^/]+/.+)$`
    );
    const match = imageUrl.match(urlPattern);

    if (match) {
      const filePath = `${match[1]}`;
      const { error: deleteImageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (deleteImageError) {
        console.error("Error deleting image:", deleteImageError);
        // 이미지 삭제 실패해도 게시물은 삭제 진행
      }
    }

    // 게시물 삭제 (CASCADE로 인해 likes, comments도 자동 삭제됨)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete post", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/posts/[postId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


