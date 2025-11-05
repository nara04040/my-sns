/**
 * @file (main)/profile/[userId]/page.tsx
 * @description 사용자 프로필 페이지
 *
 * 특정 사용자의 프로필을 표시하는 페이지입니다.
 *
 * 주요 구성:
 * 1. 프로필 헤더 영역 (프로필 이미지, 사용자명, 통계, 팔로우 버튼 등)
 * 2. 게시물 그리드 영역 (3열 그리드 레이아웃)
 *
 * 레이아웃:
 * - 데스크톱 (1024px+): 프로필 이미지 150px, 최대 630px 중앙 정렬
 * - 모바일 (<768px): 프로필 이미지 90px, 전체 너비
 *
 * @dependencies
 * - @/components/profile/ProfileHeader: 프로필 헤더 컴포넌트
 * - @/lib/types: UserWithStats 타입
 */

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { PostGrid } from "@/components/profile/PostGrid";
import type { UserWithStats } from "@/lib/types";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

/**
 * 프로필 데이터 가져오기 (API 호출)
 * @param clerkUserId - Clerk user ID
 * @returns 프로필 데이터 또는 null
 */
async function fetchProfileData(
  clerkUserId: string
): Promise<UserWithStats | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    const response = await fetch(`${baseUrl}/api/users/${clerkUserId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch profile");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

export default async function UserProfilePage({
  params,
}: ProfilePageProps) {
  const { userId } = await params;

  // userId는 Clerk user ID
  // 프로필 데이터 가져오기 (API 호출)
  const profileData = await fetchProfileData(userId);

  // 사용자를 찾을 수 없는 경우 404
  if (!profileData) {
    notFound();
  }

  return (
    <div className="w-full py-4 lg:py-8">
      {/* 프로필 헤더 영역 */}
      <ProfileHeader userId={userId} profileData={profileData} />

      {/* 탭 영역 (향후 게시물/릴스/태그됨 탭 추가 예정) */}
      <div className="w-full border-t border-[#dbdbdb] pt-4 mb-4">
        <div className="flex gap-8 justify-center">
          <button className="text-sm font-semibold text-[#262626] border-t-2 border-[#262626] pt-4 -mt-4">
            게시물
          </button>
          {/* 향후 릴스, 태그됨 탭 추가 */}
        </div>
      </div>

      {/* 게시물 그리드 영역 */}
      <div className="w-full">
        <PostGrid userId={userId} />
      </div>
    </div>
  );
}

