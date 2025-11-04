/**
 * @file (main)/profile/[userId]/page.tsx
 * @description 다른 사용자 프로필 페이지
 *
 * 특정 사용자의 프로필 페이지입니다.
 * '/profile/[userId]' 경로로 접근하면 해당 사용자의 프로필을 표시합니다.
 *
 * @dependencies
 * - @/components/profile/ProfileHeader: 프로필 헤더 컴포넌트
 * - @/lib/types: 타입 정의
 */

import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PostGrid } from "@/components/profile/PostGrid";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import type { UserWithStats } from "@/lib/types";

async function getUserProfile(userId: string): Promise<UserWithStats | null> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/users/${userId}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch profile");
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: paramUserId } = await params;
  const { userId: clerkUserId } = await auth();

  // 현재 사용자 ID 가져오기
  let currentUserId: string | null = null;
  if (clerkUserId) {
    const supabase = getServiceRoleClient();
    const { data: currentUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (currentUser) {
      currentUserId = currentUser.id;
    }
  }

  const user = await getUserProfile(paramUserId);

  if (!user) {
    notFound();
  }

  // 현재 사용자와 동일한 프로필인지 확인
  const isOwnProfile = currentUserId === user.id;

  // 내 프로필인 경우 /profile로 리다이렉트
  if (isOwnProfile) {
    redirect("/profile");
  }

  return (
    <div className="min-h-screen bg-[var(--instagram-background)]">
      <div className="bg-[var(--instagram-card-background)] border-b border-[var(--instagram-border)]">
        <ProfileHeader user={user} isOwnProfile={isOwnProfile} />
      </div>
      {/* 게시물 그리드 */}
      <PostGrid userId={user.id} />
    </div>
  );
}

