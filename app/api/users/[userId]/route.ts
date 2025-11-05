import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { UserWithStats } from "@/lib/types";

/**
 * 프로필 정보 조회 API
 * GET /api/users/[userId]
 *
 * @param userId - Clerk user ID (URL 파라미터)
 *
 * @returns 프로필 정보 (사용자 정보 + 통계)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // userId 파라미터 검증
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Clerk user ID로 Supabase user 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // user_stats 뷰에서 통계 조회
    const { data: stats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (statsError) {
      console.error("Error fetching user stats:", statsError);
      // 통계 조회 실패해도 기본값으로 처리
    }

    // 프로필 데이터 구성
    const profileData: UserWithStats = {
      ...user,
      posts_count: stats ? Number(stats.posts_count) || 0 : 0,
      followers_count: stats ? Number(stats.followers_count) || 0 : 0,
      following_count: stats ? Number(stats.following_count) || 0 : 0,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Error in GET /api/users/[userId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

