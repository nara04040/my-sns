"use client";

/**
 * @file ProfileHeader.tsx
 * @description 프로필 헤더 컴포넌트
 *
 * 사용자 프로필 정보를 표시하는 헤더 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 프로필 이미지 (150px 데스크톱 / 90px 모바일)
 * 2. 사용자명 표시
 * 3. 통계 표시 (게시물 수, 팔로워 수, 팔로잉 수)
 * 4. 팔로우/팔로잉 버튼 (다른 사용자 프로필일 때만)
 *
 * @dependencies
 * - @/components/ui/avatar: 아바타 컴포넌트
 * - @/components/ui/button: 버튼 컴포넌트
 * - @/lib/types: 타입 정의
 */

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { UserWithStats } from "@/lib/types";
import { useState, useEffect } from "react";

interface ProfileHeaderProps {
  /** 사용자 정보 (통계 포함) */
  user: UserWithStats;
  /** 현재 사용자의 프로필인지 여부 */
  isOwnProfile: boolean;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false);
  const [followersCount, setFollowersCount] = useState(user.followers_count);
  const [followingCount, setFollowingCount] = useState(user.following_count);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // prop 변경 시 상태 동기화 (예: 다른 사용자가 팔로우/언팔로우한 경우)
  useEffect(() => {
    setIsFollowing(user.isFollowing ?? false);
    setFollowersCount(user.followers_count);
    setFollowingCount(user.following_count);
  }, [user.id, user.isFollowing, user.followers_count, user.following_count]);

  // 팔로우/언팔로우 핸들러
  const handleFollowToggle = async () => {
    if (isLoading) return; // 중복 요청 방지

    // Optimistic UI 업데이트
    const previousIsFollowing = isFollowing;
    const previousFollowersCount = followersCount;

    setIsFollowing(!previousIsFollowing);
    setFollowersCount(
      previousIsFollowing
        ? previousFollowersCount - 1
        : previousFollowersCount + 1
    );
    setIsLoading(true);

    try {
      const url = `/api/follows`;
      const method = previousIsFollowing ? "DELETE" : "POST";

      let response: Response;
      if (previousIsFollowing) {
        // 언팔로우: DELETE 요청
        response = await fetch(`${url}?followingId=${user.id}`, {
          method,
        });
      } else {
        // 팔로우: POST 요청
        response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followingId: user.id }),
        });
      }

      if (!response.ok) {
        // 롤백
        setIsFollowing(previousIsFollowing);
        setFollowersCount(previousFollowersCount);
        const errorData = await response.json().catch(() => ({}));
        console.error("Error toggling follow:", errorData);
        setIsLoading(false);
        return;
      }

      // 성공 시 서버에서 최신 사용자 정보 가져오기
      try {
        const userResponse = await fetch(`/api/users/${user.id}`, {
          cache: "no-store",
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          const updatedUser = userData.user;

          // 최신 상태로 업데이트
          setIsFollowing(updatedUser.isFollowing ?? false);
          setFollowersCount(updatedUser.followers_count);
          setFollowingCount(updatedUser.following_count);
        }
      } catch (refreshError) {
        // 통계 새로고침 실패해도 팔로우는 성공했으므로 Optimistic UI 유지
        console.error("Error refreshing user stats:", refreshError);
      }

      setIsLoading(false);
    } catch (error) {
      // 롤백
      setIsFollowing(previousIsFollowing);
      setFollowersCount(previousFollowersCount);
      setIsLoading(false);
      console.error("Error toggling follow:", error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 px-4 py-6 md:py-8">
      {/* 프로필 이미지 */}
      <div className="flex justify-center md:justify-start">
        <Avatar className="w-[90px] h-[90px] md:w-[150px] md:h-[150px]">
          <AvatarImage
            src={undefined} // Clerk 프로필 이미지는 추후 연동
            alt={user.name}
          />
          <AvatarFallback className="text-2xl md:text-4xl">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* 프로필 정보 */}
      <div className="flex-1 space-y-4">
        {/* 사용자명 및 액션 버튼 */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h1 className="text-xl md:text-2xl font-light">{user.name}</h1>

          {!isOwnProfile && (
            <div className="flex gap-2">
              <Button
                onClick={handleFollowToggle}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                disabled={isLoading}
                variant={isFollowing ? "outline" : "default"}
                className={
                  isFollowing
                    ? "bg-white text-black border border-[var(--instagram-border)] hover:bg-[#fafafa] hover:border-red-500 hover:text-red-500 disabled:opacity-50"
                    : "bg-[var(--instagram-blue)] text-white hover:bg-[var(--instagram-blue)]/90 disabled:opacity-50"
                }
                size="sm"
              >
                {isLoading
                  ? "처리 중..."
                  : isFollowing && isHovering
                    ? "언팔로우"
                    : isFollowing
                      ? "팔로잉"
                      : "팔로우"}
              </Button>
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="flex gap-6 md:gap-8">
          <div className="flex flex-col md:flex-row md:gap-1">
            <span className="font-semibold">{user.posts_count}</span>
            <span className="text-[var(--text-secondary)]">게시물</span>
          </div>
          <div className="flex flex-col md:flex-row md:gap-1">
            <span className="font-semibold">{followersCount}</span>
            <span className="text-[var(--text-secondary)]">팔로워</span>
          </div>
          <div className="flex flex-col md:flex-row md:gap-1">
            <span className="font-semibold">{followingCount}</span>
            <span className="text-[var(--text-secondary)]">팔로잉</span>
          </div>
        </div>
      </div>
    </div>
  );
}

