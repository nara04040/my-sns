"use client";

/**
 * @file components/profile/ProfileHeader.tsx
 * @description 프로필 헤더 컴포넌트
 *
 * 사용자 프로필 페이지의 헤더 부분을 표시하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 프로필 이미지 표시 (150px 데스크톱 / 90px 모바일)
 * 2. 사용자명 표시
 * 3. 통계 표시 (게시물 수, 팔로워 수, 팔로잉 수)
 * 4. 팔로우/팔로잉 버튼 (다른 사용자 프로필일 때만)
 *
 * 레이아웃:
 * - 모바일 (<768px): 세로 배치, 프로필 이미지 90px
 * - 데스크톱 (≥768px): 가로 배치, 프로필 이미지 150px
 *
 * @dependencies
 * - @/components/ui/avatar: Avatar 컴포넌트
 * - @/components/ui/button: Button 컴포넌트
 * - @/lib/types: UserWithStats 타입
 */

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { UserWithStats } from "@/lib/types";

interface ProfileHeaderProps {
  /** Clerk user ID (URL 파라미터) */
  userId: string;
  /** 프로필 데이터 (사용자 정보 + 통계) */
  profileData: UserWithStats;
}

export function ProfileHeader({ userId, profileData }: ProfileHeaderProps) {
  const { userId: currentClerkUserId, isLoaded: isClerkLoaded } = useAuth();
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // 본인 프로필인지 확인
  useEffect(() => {
    if (isClerkLoaded && currentClerkUserId) {
      setIsOwnProfile(currentClerkUserId === userId);
    } else {
      setIsOwnProfile(false);
    }
  }, [isClerkLoaded, currentClerkUserId, userId]);

  // 통계 숫자 포맷팅 (1,234 형식)
  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  return (
    <div className="w-full mb-8">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center md:items-start">
        {/* 프로필 이미지 영역 */}
        <div className="shrink-0">
          <Avatar className="w-[90px] h-[90px] md:w-[150px] md:h-[150px]">
            <AvatarImage
              src={undefined} // Clerk 프로필 이미지는 추후 연동
              alt={profileData.name}
            />
            <AvatarFallback className="text-2xl md:text-4xl font-semibold bg-gray-200 text-gray-600">
              {profileData.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* 프로필 정보 영역 */}
        <div className="flex-1 w-full">
          {/* 사용자명 */}
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-semibold text-[#262626] mb-2">
              {profileData.name}
            </h1>
          </div>

          {/* 통계 영역 */}
          <div className="flex gap-6 mb-4">
            <div>
              <span className="font-semibold text-[#262626]">
                {formatNumber(profileData.posts_count)}
              </span>{" "}
              <span className="text-[#262626]">게시물</span>
            </div>
            <div>
              <span className="font-semibold text-[#262626]">
                {formatNumber(profileData.followers_count)}
              </span>{" "}
              <span className="text-[#262626]">팔로워</span>
            </div>
            <div>
              <span className="font-semibold text-[#262626]">
                {formatNumber(profileData.following_count)}
              </span>{" "}
              <span className="text-[#262626]">팔로잉</span>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="mt-4">
            {!isOwnProfile && (
              <Button
                variant="default"
                style={{
                  backgroundColor: "var(--instagram-blue)",
                }}
                className="text-white hover:opacity-90"
                // onClick 핸들러는 팔로우 API 연동 시 추가
              >
                팔로우
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

