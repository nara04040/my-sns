import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { CommentWithUser } from "@/lib/types";

/**
 * 댓글 목록 조회 API
 * GET /api/comments?postId=xxx&limit=2
 *
 * @query postId - 게시물 ID (필수)
 * @query limit - 가져올 댓글 개수 (기본값: 10, 최대: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("postId");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "10", 10),
      100
    );

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 댓글 가져오기 (최신순)
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return NextResponse.json(
        { error: "Failed to fetch comments", details: commentsError.message },
        { status: 500 }
      );
    }

    if (!comments || comments.length === 0) {
      return NextResponse.json({ comments: [] });
    }

    // 작성자 정보 가져오기
    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError.message },
        { status: 500 }
      );
    }

    // users를 맵으로 변환
    const usersMap = new Map(users?.map((u) => [u.id, u]) || []);

    // 댓글 데이터 구성
    const commentsWithUser: CommentWithUser[] = comments.map((comment) => {
      const user = usersMap.get(comment.user_id);
      if (!user) {
        throw new Error(`User not found for comment ${comment.id}`);
      }

      return {
        ...comment,
        user,
      };
    });

    return NextResponse.json({ comments: commentsWithUser });
  } catch (error) {
    console.error("Error in GET /api/comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

