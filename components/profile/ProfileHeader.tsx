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

import { useEffect, useState, useCallback } from "react";
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
  
  // 팔로우 상태 관리
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null); // null = 로딩 중
  const [isLoading, setIsLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(profileData.followers_count);

  // 통계 숫자 포맷팅 (1,234 형식)
  const formatNumber = (num: number): string => {
    return num.toLocaleString("ko-KR");
  };

  // 팔로우 상태 확인 API 호출 (useCallback으로 메모이제이션)
  const checkFollowStatus = useCallback(
    async (followingId: string): Promise<boolean> => {
      const response = await fetch(`/api/follows?followingId=${followingId}`);
      if (!response.ok) {
        throw new Error("Failed to check follow status");
      }
      const data = await response.json();
      return data.isFollowing;
    },
    []
  );

  // 본인 프로필인지 확인
  useEffect(() => {
    if (isClerkLoaded && currentClerkUserId) {
      setIsOwnProfile(currentClerkUserId === userId);
    } else {
      setIsOwnProfile(false);
    }
  }, [isClerkLoaded, currentClerkUserId, userId]);

  // 초기 팔로우 상태 로드 (다른 사용자 프로필일 때만)
  useEffect(() => {
    if (!isOwnProfile && isClerkLoaded && currentClerkUserId) {
      checkFollowStatus(userId)
        .then((following) => {
          setIsFollowing(following);
        })
        .catch((error) => {
          console.error("Error checking follow status:", error);
          // 에러 발생 시 기본값으로 false 설정
          setIsFollowing(false);
        });
    } else if (isOwnProfile) {
      // 본인 프로필인 경우 팔로우 상태 불필요
      setIsFollowing(null);
    }
  }, [userId, isOwnProfile, isClerkLoaded, currentClerkUserId, checkFollowStatus]);

  // 팔로우 추가 API 호출
  const followUser = async (followingId: string): Promise<void> => {
    const response = await fetch("/api/follows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ followingId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to follow user");
    }
  };

  // 언팔로우 API 호출
  const unfollowUser = async (followingId: string): Promise<void> => {
    const response = await fetch(`/api/follows?followingId=${followingId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to unfollow user");
    }
  };

  // 팔로우 토글 핸들러 (Optimistic UI)
  const handleFollowToggle = async () => {
    // 로딩 중이거나 상태가 아직 확인되지 않은 경우 무시
    if (isLoading || isFollowing === null) {
      return;
    }

    const previousIsFollowing = isFollowing;
    const previousFollowersCount = followersCount;

    // Optimistic UI 업데이트
    setIsFollowing(!previousIsFollowing);
    setFollowersCount(
      previousIsFollowing
        ? previousFollowersCount - 1
        : previousFollowersCount + 1
    );
    setIsLoading(true);

    try {
      if (previousIsFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch (error) {
      // 에러 발생 시 롤백
      setIsFollowing(previousIsFollowing);
      setFollowersCount(previousFollowersCount);
      console.error("Failed to toggle follow:", error);
      // TODO: 사용자에게 에러 메시지 표시 (토스트 등)
    } finally {
      setIsLoading(false);
    }
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
                {formatNumber(followersCount)}
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
              <>
                {isFollowing === null ? (
                  // 로딩 중: 비활성화된 버튼 표시
                  <Button
                    variant="default"
                    disabled
                    className="opacity-50 cursor-not-allowed"
                  >
                    팔로우
                  </Button>
                ) : isFollowing ? (
                  // 팔로우 중: 회색 버튼, hover 시 빨간 테두리 + "언팔로우" 텍스트
                  <Button
                    variant="outline"
                    onClick={handleFollowToggle}
                    disabled={isLoading}
                    className="border-[#dbdbdb] bg-white text-[#262626] hover:border-red-500 hover:text-red-500 transition-colors group"
                  >
                    <span className="group-hover:hidden">팔로잉</span>
                    <span className="hidden group-hover:inline">언팔로우</span>
                  </Button>
                ) : (
                  // 미팔로우: 파란색 버튼
                  <Button
                    variant="default"
                    onClick={handleFollowToggle}
                    disabled={isLoading}
                    style={{
                      backgroundColor: "var(--instagram-blue)",
                    }}
                    className="text-white hover:opacity-90"
                  >
                    팔로우
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

