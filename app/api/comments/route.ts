import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { CommentWithUser } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";

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

/**
 * 댓글 작성 API
 * POST /api/comments
 *
 * @body postId: string, content: string
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const postId: string | undefined = body?.postId;
    const content: string | undefined = body?.content;

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Clerk userId로 Supabase users.id 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 댓글 생성
    const { data: inserted, error: insertError } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      console.error("Error creating comment:", insertError);
      return NextResponse.json(
        { error: "Failed to create comment", details: insertError?.message },
        { status: 500 }
      );
    }

    // 응답에 작성자 정보 포함시키기 위한 조인 (간단히 users 다시 조합)
    const response: CommentWithUser = {
      ...inserted,
      user: {
        id: user.id,
        clerk_id: "", // 필요 시 확장 가능 (UI에 사용하지 않음)
        name: user.name,
        created_at: "", // 필요 시 확장 가능
      },
    } as CommentWithUser;

    return NextResponse.json({ success: true, comment: response });
  } catch (error) {
    console.error("Error in POST /api/comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

