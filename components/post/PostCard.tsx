"use client";

/**
 * @file PostCard.tsx
 * @description Instagram 스타일의 게시물 카드 컴포넌트
 *
 * 게시물 정보를 표시하며, 좋아요 기능과 댓글 미리보기를 포함합니다.
 *
 * 주요 기능:
 * 1. 게시물 헤더 (프로필 이미지, 사용자명, 시간, 메뉴)
 * 2. 이미지 영역 (1:1 정사각형)
 * 3. 액션 버튼 (좋아요, 댓글, 공유, 북마크)
 * 4. 컨텐츠 (좋아요 수, 캡션, 댓글 미리보기)
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 정보
 * - next/image: 이미지 최적화
 * - lucide-react: 아이콘
 * - @/lib/types: 타입 정의
 * - @/lib/utils: 유틸리티 함수
 */

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CommentForm } from "@/components/comment/CommentForm";
import { CommentList } from "@/components/comment/CommentList";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { PostWithUserAndStats, CommentWithUser } from "@/lib/types";

interface PostCardProps {
  /** 게시물 정보 (사용자 정보, 통계 포함) */
  post: PostWithUserAndStats;
  /** 초기 좋아요 상태 */
  initialIsLiked?: boolean;
  /** 초기 댓글 목록 (최신 2개) */
  initialComments?: CommentWithUser[];
}

export function PostCard({
  post,
  initialIsLiked,
  initialComments = [],
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked ?? post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  
  // 더블탭 좋아요 관련 상태
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [doubleTapHeartType, setDoubleTapHeartType] = useState<"like" | "unlike">("like");
  const lastTapTimeRef = useRef<number>(0);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 캡션 표시 여부 결정 (2줄 초과 시 "... 더 보기" 표시)
  const captionLines = post.caption?.split("\n") || [];
  const shouldShowMore = post.caption && post.caption.length > 100;

  // 더블탭 감지 및 좋아요 처리
  const handleDoubleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    // 이전 탭으로부터 300ms 이내면 더블탭으로 판단
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // 애니메이션 중이면 무시
      if (showDoubleTapHeart) {
        return;
      }

      // 좋아요 토글 (현재 상태의 반대로 설정)
      const willLike = !isLiked;
      setDoubleTapHeartType(willLike ? "like" : "unlike");
      setShowDoubleTapHeart(true);

      // 좋아요 API 호출
      handleLike();

      // 1초 후 애니메이션 제거
      setTimeout(() => {
        setShowDoubleTapHeart(false);
      }, 1000);

      // 타이머 초기화
      lastTapTimeRef.current = 0;
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
        doubleTapTimeoutRef.current = null;
      }
    } else {
      // 첫 번째 탭이거나 시간이 지난 경우
      lastTapTimeRef.current = now;

      // 300ms 후 타이머 초기화 (더블탭이 아닌 경우)
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
      doubleTapTimeoutRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
      }, 300);
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
    };
  }, []);

  // 좋아요 토글
  const handleLike = async () => {
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    // Optimistic UI 업데이트
    setIsLiked(!previousIsLiked);
    setLikesCount(previousIsLiked ? previousLikesCount - 1 : previousLikesCount + 1);
    setIsAnimating(true);

    try {
      const url = `/api/likes`;
      const method = previousIsLiked ? "DELETE" : "POST";

      const response = await fetch(
        previousIsLiked ? `${url}?postId=${post.id}` : url,
        {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: previousIsLiked ? undefined : JSON.stringify({ postId: post.id }),
        }
      );

      if (!response.ok) {
        // 에러 발생 시 롤백
        setIsLiked(previousIsLiked);
        setLikesCount(previousLikesCount);
        const error = await response.json();
        console.error("Failed to toggle like:", error);
      }
    } catch (error) {
      // 에러 발생 시 롤백
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      console.error("Error toggling like:", error);
    } finally {
      setTimeout(() => setIsAnimating(false), 150);
    }
  };

  // 댓글 불러오기 (최신 2개)
  useEffect(() => {
    if (comments.length === 0 && commentsCount > 0) {
      fetch(`/api/comments?postId=${post.id}&limit=2`)
        .then((res) => res.json())
        .then((data) => {
          if (data.comments) {
            setComments(data.comments);
          }
        })
        .catch((error) => {
          console.error("Error fetching comments:", error);
        });
    }
  }, [post.id, commentsCount, comments.length]);

  return (
    <article className="bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] rounded-sm mb-4">
      {/* 헤더 영역 (60px) */}
      <header className="flex items-center justify-between px-4 py-3 h-[60px]">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user.id}`}>
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={undefined} // Clerk 프로필 이미지는 추후 연동
                alt={post.user.name}
              />
              <AvatarFallback className="text-xs">
                {post.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex flex-col">
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold text-sm hover:opacity-50 transition-opacity"
            >
              {post.user.name}
            </Link>
            <span className="text-xs text-[var(--text-secondary)]">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        </div>
        <button
          className="p-1 hover:opacity-50 transition-opacity"
          aria-label="더보기 메뉴"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div className="relative w-full aspect-square bg-gray-100 cursor-pointer" onClick={handleDoubleTap}>
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 630px"
          priority
        />
        
        {/* 더블탭 하트 애니메이션 */}
        {showDoubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              className={cn(
                "w-24 h-24",
                doubleTapHeartType === "like"
                  ? "fill-[var(--like)] text-[var(--like)]"
                  : "text-white stroke-2",
                "animate-[heartPulse_1s_ease-out_forwards]"
              )}
            />
          </div>
        )}
      </div>

      {/* 액션 버튼 영역 (48px) */}
      <div className="flex items-center justify-between px-4 py-2 h-[48px]">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={cn(
              "transition-all duration-150",
              isAnimating && "scale-125"
            )}
            aria-label={isLiked ? "좋아요 취소" : "좋아요"}
          >
            <Heart
              className={cn(
                "w-6 h-6 transition-colors",
                isLiked ? "fill-[var(--like)] text-[var(--like)]" : "text-black"
              )}
            />
          </button>
          <button
            onClick={() => setShowCommentForm(!showCommentForm)}
            className={cn(
              "hover:opacity-50 transition-opacity",
              showCommentForm && "opacity-50"
            )}
            aria-label="댓글"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <button
            className="hover:opacity-50 transition-opacity"
            aria-label="공유"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <button
          className="hover:opacity-50 transition-opacity"
          aria-label="북마크"
        >
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 */}
        {likesCount > 0 && (
          <div className="font-semibold text-sm">
            좋아요 {likesCount.toLocaleString()}개
          </div>
        )}

        {/* 캡션 */}
        {post.caption && (
          <div className="text-sm">
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold hover:opacity-50 transition-opacity mr-2"
            >
              {post.user.name}
            </Link>
            <span>
              {showFullCaption || !shouldShowMore
                ? post.caption
                : `${post.caption.slice(0, 100)}...`}
            </span>
            {shouldShowMore && !showFullCaption && (
              <button
                onClick={() => setShowFullCaption(true)}
                className="text-[var(--text-secondary)] hover:text-black ml-1"
              >
                더 보기
              </button>
            )}
          </div>
        )}

        {/* 댓글 미리보기 */}
        {commentsCount > 0 && (
          <div className="space-y-1">
            {comments.length > 2 && (
              <button
                className="text-sm text-[var(--text-secondary)] hover:text-black"
                aria-label="댓글 모두 보기"
              >
                댓글 {commentsCount}개 모두 보기
              </button>
            )}
            <CommentList
              postId={post.id}
              initialComments={comments.slice(0, 2)}
              onCommentDeleted={(commentId) => {
                // 댓글 삭제 시 목록에서 제거
                setComments((prev) => prev.filter((c) => c.id !== commentId));
                // 댓글 수 감소
                setCommentsCount((prev) => Math.max(0, prev - 1));
              }}
            />
          </div>
        )}
      </div>

      {/* 댓글 작성 폼 */}
      {showCommentForm && (
        <CommentForm
          postId={post.id}
          onCommentAdded={(comment) => {
            // 댓글 목록에 추가 (최신순이므로 맨 앞에 추가)
            setComments((prev) => [comment, ...prev]);
            // 댓글 수 증가
            setCommentsCount((prev) => prev + 1);
            // 댓글 작성 완료 후 폼 닫기
            setShowCommentForm(false);
          }}
        />
      )}
    </article>
  );
}

