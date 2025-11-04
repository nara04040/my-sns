import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 댓글 삭제 API
 * DELETE /api/comments/[commentId]
 *
 * 본인 댓글만 삭제 가능
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await context.params;
    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 현재 사용자 Supabase users.id 조회
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

    // 본인 댓글만 삭제
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete comment", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/comments/[commentId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


