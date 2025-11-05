import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 팔로우 추가 API
 * POST /api/follows
 *
 * @body { followingId: string } - 팔로우할 사용자의 Clerk user ID
 *
 * @returns 생성된 팔로우 관계 정보
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { followingId } = body;

    // followingId 파라미터 검증
    if (!followingId) {
      return NextResponse.json(
        { error: "followingId is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 현재 사용자 조회 (Clerk userId → Supabase user id)
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (currentUserError || !currentUser) {
      console.error("Error fetching current user:", currentUserError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 대상 사용자 조회 (Clerk userId → Supabase user id)
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", followingId)
      .single();

    if (targetUserError || !targetUser) {
      console.error("Error fetching target user:", targetUserError);
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // 자기 자신 팔로우 방지
    if (currentUser.id === targetUser.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // 팔로우 추가 (UNIQUE 제약 조건으로 중복 방지)
    const { data, error } = await supabase
      .from("follows")
      .insert({
        follower_id: currentUser.id,
        following_id: targetUser.id,
      })
      .select()
      .single();

    if (error) {
      // 이미 팔로우한 경우 (UNIQUE 제약 조건 위반)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Already following" },
          { status: 409 }
        );
      }

      console.error("Error adding follow:", error);
      return NextResponse.json(
        { error: "Failed to add follow", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, follow: data }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/follows:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 팔로우 제거 API
 * DELETE /api/follows?followingId=xxx
 *
 * @query followingId - 언팔로우할 사용자의 Clerk user ID
 *
 * @returns 성공 여부
 */
export async function DELETE(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const followingId = searchParams.get("followingId");

    // followingId 파라미터 검증
    if (!followingId) {
      return NextResponse.json(
        { error: "followingId is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 현재 사용자 조회 (Clerk userId → Supabase user id)
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (currentUserError || !currentUser) {
      console.error("Error fetching current user:", currentUserError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 대상 사용자 조회 (Clerk userId → Supabase user id)
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", followingId)
      .single();

    if (targetUserError || !targetUser) {
      console.error("Error fetching target user:", targetUserError);
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // 팔로우 제거
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", targetUser.id);

    if (error) {
      console.error("Error removing follow:", error);
      return NextResponse.json(
        { error: "Failed to remove follow", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/follows:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * 팔로우 상태 확인 API
 * GET /api/follows?followingId=xxx
 *
 * @query followingId - 확인할 사용자의 Clerk user ID
 *
 * @returns 팔로우 여부
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const followingId = searchParams.get("followingId");

    // followingId 파라미터 검증
    if (!followingId) {
      return NextResponse.json(
        { error: "followingId is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // 현재 사용자 조회 (Clerk userId → Supabase user id)
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (currentUserError || !currentUser) {
      console.error("Error fetching current user:", currentUserError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 대상 사용자 조회 (Clerk userId → Supabase user id)
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", followingId)
      .single();

    if (targetUserError || !targetUser) {
      console.error("Error fetching target user:", targetUserError);
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // 팔로우 관계 확인
    const { data: follow, error: followError } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", targetUser.id)
      .maybeSingle();

    if (followError) {
      console.error("Error checking follow status:", followError);
      return NextResponse.json(
        { error: "Failed to check follow status", details: followError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      isFollowing: !!follow,
    });
  } catch (error) {
    console.error("Error in GET /api/follows:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

