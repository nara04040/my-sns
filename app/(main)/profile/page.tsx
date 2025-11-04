/**
 * @file (main)/profile/page.tsx
 * @description 내 프로필 페이지
 *
 * 현재 로그인한 사용자의 프로필 페이지입니다.
 * '/profile' 경로로 접근하면 현재 사용자의 프로필을 표시합니다.
 *
 * @dependencies
 * - @/components/profile/ProfileHeader: 프로필 헤더 컴포넌트
 * - @/lib/types: 타입 정의
 */

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PostGrid } from "@/components/profile/PostGrid";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { UserWithStats } from "@/lib/types";

async function getMyProfile(): Promise<UserWithStats> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  // 서버 사이드에서 직접 Supabase 클라이언트 사용
  const supabase = getServiceRoleClient();

  // Clerk userId로 Supabase users 테이블에서 id 찾기
  const { data: currentUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (userError || !currentUser) {
    throw new Error("User not found");
  }

  // user_stats 뷰에서 사용자 정보와 통계 가져오기
  const { data: userStats, error: statsError } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", currentUser.id)
    .single();

  if (statsError || !userStats) {
    throw new Error("User stats not found");
  }

  // users 테이블에서 추가 정보 가져오기
  const { data: user, error: userDetailError } = await supabase
    .from("users")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (userDetailError || !user) {
    throw new Error("User details not found");
  }

  return {
    ...user,
    posts_count: Number(userStats.posts_count) || 0,
    followers_count: Number(userStats.followers_count) || 0,
    following_count: Number(userStats.following_count) || 0,
    isFollowing: false, // 내 프로필이므로 항상 false
  };
}

export default async function MyProfilePage() {
  const user = await getMyProfile();

  return (
    <div className="min-h-screen bg-[var(--instagram-background)]">
      <div className="bg-[var(--instagram-card-background)] border-b border-[var(--instagram-border)]">
        <ProfileHeader user={user} isOwnProfile={true} />
      </div>
      {/* 게시물 그리드 */}
      <PostGrid userId={user.id} />
    </div>
  );
}

