import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { UserWithStats } from "@/lib/types";

/**
 * 사용자 프로필 조회 API
 * GET /api/users/[userId]
 *
 * @param userId - 사용자 ID (UUID 또는 'me'로 현재 사용자)
 *
 * @returns 사용자 프로필 정보 (통계 포함)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: paramUserId } = await params;
    const { userId: clerkUserId } = await auth();

    const supabase = getServiceRoleClient();

    // 'me'인 경우 현재 사용자 ID로 변환
    let targetUserId: string;
    if (paramUserId === "me") {
      if (!clerkUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Clerk userId로 Supabase users 테이블에서 id 찾기
      const { data: currentUser, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (userError || !currentUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      targetUserId = currentUser.id;
    } else {
      targetUserId = paramUserId;
    }

    // user_stats 뷰에서 사용자 정보와 통계 가져오기
    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", targetUserId)
      .single();

    if (statsError || !userStats) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // users 테이블에서 추가 정보 가져오기 (created_at 등)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 현재 사용자가 이 사용자를 팔로우하는지 확인
    let isFollowing = false;
    if (clerkUserId) {
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerkUserId)
        .single();

      if (currentUser && currentUser.id !== targetUserId) {
        const { data: follow } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", targetUserId)
          .maybeSingle();

        isFollowing = Boolean(follow);
      }
    }

    const responseUser: UserWithStats = {
      ...user,
      posts_count: Number(userStats.posts_count) || 0,
      followers_count: Number(userStats.followers_count) || 0,
      following_count: Number(userStats.following_count) || 0,
      isFollowing,
    };

    return NextResponse.json({ user: responseUser });
  } catch (error) {
    console.error("Error in GET /api/users/[userId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

