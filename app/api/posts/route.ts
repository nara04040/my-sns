import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { PostWithUserAndStats } from "@/lib/types";

/**
 * 게시물 목록 조회 API
 * GET /api/posts
 *
 * @query limit - 가져올 게시물 개수 (기본값: 10)
 * @query offset - 건너뛸 개수 (기본값: 0)
 *
 * @returns 게시물 목록 (사용자 정보, 통계 포함)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = getServiceRoleClient();

    // posts 테이블과 post_stats 뷰를 조인하여 게시물과 통계 가져오기
    // post_stats 뷰에는 updated_at이 없으므로 posts 테이블과 조인 필요
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [], hasMore: false });
    }

    // post_stats에서 통계 가져오기
    const postIds = posts.map((p) => p.id);
    const { data: postStats, error: statsError } = await supabase
      .from("post_stats")
      .select("*")
      .in("post_id", postIds);

    if (statsError) {
      console.error("Error fetching post stats:", statsError);
      return NextResponse.json(
        { error: "Failed to fetch post stats", details: statsError.message },
        { status: 500 }
      );
    }

    // 통계를 맵으로 변환
    const statsMap = new Map(
      (postStats || []).map((s) => [s.post_id, s])
    );

    // 각 게시물의 작성자 정보 가져오기
    const userIds = [...new Set(posts.map((p) => p.user_id))];
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

    // 현재 사용자의 좋아요 여부 확인
    const { userId } = await auth();
    let userLikes: string[] = [];

    if (userId) {
      // Clerk userId로 Supabase users 테이블에서 id 찾기
      const { data: currentUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", userId)
        .single();

      if (currentUser) {
        const { data: likes } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", currentUser.id)
          .in("post_id", postIds);

        if (likes) {
          userLikes = likes.map((l) => l.post_id);
        }
      }
    }

    // users를 맵으로 변환
    const usersMap = new Map(users?.map((u) => [u.id, u]) || []);

    // 게시물 데이터 구성
    const postsWithStats: PostWithUserAndStats[] = posts.map((post) => {
      const user = usersMap.get(post.user_id);
      if (!user) {
        throw new Error(`User not found for post ${post.id}`);
      }

      const stat = statsMap.get(post.id);

      return {
        ...post,
        user,
        likes_count: stat ? Number(stat.likes_count) || 0 : 0,
        comments_count: stat ? Number(stat.comments_count) || 0 : 0,
      };
    });

    // 다음 페이지 존재 여부 확인
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });
    const hasMore = (count || 0) > offset + limit;

    // 각 게시물에 isLiked 속성 추가
    const postsWithLikedStatus = postsWithStats.map((post) => ({
      ...post,
      isLiked: userLikes.includes(post.id),
    }));

    return NextResponse.json({
      posts: postsWithLikedStatus,
      hasMore,
    });
  } catch (error) {
    console.error("Error in GET /api/posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

