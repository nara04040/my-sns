import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 좋아요 추가 API
 * POST /api/likes
 *
 * @body { postId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Clerk userId로 Supabase users 테이블에서 id 찾기
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 좋아요 추가 (UNIQUE 제약 조건으로 중복 방지)
    const { data, error } = await supabase
      .from("likes")
      .insert({
        post_id: postId,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      // 이미 좋아요한 경우 (UNIQUE 제약 조건 위반)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Already liked" },
          { status: 409 }
        );
      }

      console.error("Error adding like:", error);
      return NextResponse.json(
        { error: "Failed to add like", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, like: data });
  } catch (error) {
    console.error("Error in POST /api/likes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 좋아요 제거 API
 * DELETE /api/likes?postId=xxx
 *
 * @query postId - 게시물 ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Clerk userId로 Supabase users 테이블에서 id 찾기
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 좋아요 제거
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error removing like:", error);
      return NextResponse.json(
        { error: "Failed to remove like", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/likes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

