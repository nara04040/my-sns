import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * 팔로우 추가 API
 * POST /api/follows
 *
 * @body { followingId: string } - 팔로우할 사용자 ID
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: "followingId is required" },
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

    // 자기 자신을 팔로우하는지 확인
    if (user.id === followingId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // 팔로우 추가 (UNIQUE 제약 조건으로 중복 방지)
    const { data, error } = await supabase
      .from("follows")
      .insert({
        follower_id: user.id,
        following_id: followingId,
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

      // 자기 자신 팔로우 시도 (CHECK 제약 조건 위반)
      if (error.code === "23514") {
        return NextResponse.json(
          { error: "Cannot follow yourself" },
          { status: 400 }
        );
      }

      console.error("Error adding follow:", error);
      return NextResponse.json(
        { error: "Failed to add follow", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, follow: data });
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
 * @query followingId - 언팔로우할 사용자 ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const followingId = searchParams.get("followingId");

    if (!followingId) {
      return NextResponse.json(
        { error: "followingId is required" },
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

    // 팔로우 제거
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);

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
 * @query followingId - 확인할 사용자 ID
 * @returns { isFollowing: boolean }
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const followingId = searchParams.get("followingId");

    if (!followingId) {
      return NextResponse.json(
        { error: "followingId is required" },
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

    // 팔로우 관계 확인
    const { data: follow, error: followError } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", followingId)
      .maybeSingle();

    if (followError) {
      console.error("Error checking follow status:", followError);
      return NextResponse.json(
        { error: "Failed to check follow status", details: followError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ isFollowing: Boolean(follow) });
  } catch (error) {
    console.error("Error in GET /api/follows:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

