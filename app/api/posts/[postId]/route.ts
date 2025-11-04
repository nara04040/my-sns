import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { PostWithUserAndStats } from "@/lib/types";

/**
 * 단일 게시물 상세 조회
 * GET /api/posts/[postId]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const supabase = getServiceRoleClient();

    // 게시물 본문
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 통계
    const { data: stat } = await supabase
      .from("post_stats")
      .select("*")
      .eq("post_id", postId)
      .single();

    // 작성자
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", post.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 현재 사용자 좋아요 여부
    const { userId } = await auth();
    let isLiked = false;
    if (userId) {
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
          .maybeSingle();
        isLiked = Boolean(like);
      }
    }

    const responsePost: PostWithUserAndStats = {
      ...post,
      user,
      likes_count: stat ? Number(stat.likes_count) || 0 : 0,
      comments_count: stat ? Number(stat.comments_count) || 0 : 0,
      isLiked,
    } as PostWithUserAndStats;

    return NextResponse.json({ post: responsePost });
  } catch (error) {
    console.error("Error in GET /api/posts/[postId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 게시물 삭제 (본인 게시물만)
 * DELETE /api/posts/[postId]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const supabase = getServiceRoleClient();

    // 현재 사용자 조회
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 본인 게시물만 삭제
    const { error: deleteError, count } = await supabase
      .from("posts")
      .delete({ count: "exact" })
      .eq("id", postId)
      .eq("user_id", currentUser.id);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete post", details: deleteError.message },
        { status: 500 }
      );
    }

    if (!count) {
      // 소유권 불일치 또는 이미 삭제
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/posts/[postId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


