"use client";

/**
 * @file PostFeed.tsx
 * @description 게시물 피드 목록 컴포넌트
 *
 * 게시물 목록을 표시하고 무한 스크롤 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 게시물 목록 표시 (PostCard 사용)
 * 2. 무한 스크롤 (Intersection Observer)
 * 3. 로딩 상태 관리 (PostCardSkeleton 사용)
 * 4. 에러 핸들링
 *
 * @dependencies
 * - @/components/post/PostCard: 게시물 카드 컴포넌트
 * - @/components/post/PostCardSkeleton: 로딩 스켈레톤
 * - @/lib/types: 타입 정의
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";
import type { PostWithUserAndStats } from "@/lib/types";

interface PostFeedResponse {
  posts: PostWithUserAndStats[];
  hasMore: boolean;
}

export function PostFeed() {
  const [posts, setPosts] = useState<PostWithUserAndStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  const LIMIT = 10;
  const isLoadingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  // 게시물 데이터 로드 함수
  const loadPosts = useCallback(
    async (currentOffset: number, isInitial: boolean = false) => {
      // 중복 요청 방지
      if ((isInitial && isLoadingRef.current) || (!isInitial && isLoadingMoreRef.current)) {
        return;
      }

      try {
        if (isInitial) {
          isLoadingRef.current = true;
          setIsLoading(true);
          setError(null);
        } else {
          isLoadingMoreRef.current = true;
          setIsLoadingMore(true);
        }

        const response = await fetch(
          `/api/posts?limit=${LIMIT}&offset=${currentOffset}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || "게시물을 불러오는데 실패했습니다."
          );
        }

        const data: PostFeedResponse = await response.json();

        if (isInitial) {
          setPosts(data.posts);
          setOffset(data.posts.length);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
          setOffset((prev) => prev + data.posts.length);
        }

        setHasMore(data.hasMore);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
        setError(errorMessage);
        console.error("Error loading posts:", err);
      } finally {
        if (isInitial) {
          isLoadingRef.current = false;
          setIsLoading(false);
        } else {
          isLoadingMoreRef.current = false;
          setIsLoadingMore(false);
        }
      }
    },
    [] // 의존성 배열 비우기 - 함수는 한 번만 생성됨
  );

  // 초기 데이터 로드 (한 번만 실행)
  useEffect(() => {
    loadPosts(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열로 한 번만 실행

  // Intersection Observer 설정
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadPosts(offset, false);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px",
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, isLoadingMore, offset, loadPosts]);

  // 재시도 함수
  const handleRetry = () => {
    setError(null);
    loadPosts(0, true);
  };

  // 초기 로딩 중
  if (isLoading) {
    return (
      <div className="max-w-[630px] mx-auto">
        {Array.from({ length: 3 }).map((_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // 에러 상태
  if (error && posts.length === 0) {
    return (
      <div className="max-w-[630px] mx-auto">
        <div className="bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] rounded-sm p-8 text-center">
          <p className="text-[var(--text-secondary)] mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-[var(--instagram-blue)] text-white rounded-md hover:opacity-90 transition-opacity"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 게시물이 없는 경우
  if (posts.length === 0 && !isLoading) {
    return (
      <div className="max-w-[630px] mx-auto">
        <div className="bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] rounded-sm p-8 text-center">
          <p className="text-[var(--text-secondary)]">
            아직 게시물이 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[630px] mx-auto">
      {/* 게시물 목록 */}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          initialIsLiked={post.isLiked}
        />
      ))}

      {/* 추가 로딩 스켈레톤 */}
      {isLoadingMore && (
        <>
          <PostCardSkeleton />
          <PostCardSkeleton />
        </>
      )}

      {/* Intersection Observer 타겟 */}
      {hasMore && !isLoadingMore && (
        <div ref={observerTarget} className="h-4" aria-hidden="true" />
      )}

      {/* 더 이상 게시물이 없는 경우 */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--text-secondary)]">
            모든 게시물을 불러왔습니다.
          </p>
        </div>
      )}
    </div>
  );
}

