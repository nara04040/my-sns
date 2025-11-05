"use client";

/**
 * @file PostDetailContent.tsx
 * @description 게시물 상세 컨텐츠 컴포넌트
 *
 * 게시물 상세 페이지의 메인 컨텐츠를 표시하는 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 데스크톱 레이아웃: 이미지 영역 (50%) + 댓글 영역 (50%, 스크롤 가능)
 * 2. 모바일/태블릿 레이아웃: 세로 스택 레이아웃
 * 3. 좋아요 기능
 * 4. 댓글 목록 및 작성
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증
 * - next/image: 이미지 최적화
 * - lucide-react: 아이콘
 * - @/components/comment/CommentList: 댓글 목록
 * - @/components/comment/CommentForm: 댓글 작성 폼
 * - @/lib/types: 타입 정의
 */

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { PostWithUserAndStats, CommentWithUser } from "@/lib/types";

interface PostDetailContentProps {
  /** 게시물 정보 (사용자 정보, 통계 포함) */
  post: PostWithUserAndStats;
}

export function PostDetailContent({ post }: PostDetailContentProps) {
  const router = useRouter();
  const { userId: clerkUserId, isLoaded: isClerkLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isAnimating, setIsAnimating] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnPost, setIsOwnPost] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 더블탭 좋아요 관련 상태
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [doubleTapHeartType, setDoubleTapHeartType] = useState<
    "like" | "unlike"
  >("like");
  const lastTapTimeRef = useRef<number>(0);
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 댓글 영역 스크롤 참조
  const commentsScrollRef = useRef<HTMLDivElement>(null);

  // 캡션 표시 여부 결정
  const shouldShowMore = post.caption && post.caption.length > 100;

  // Clerk 사용자 ID로 Supabase user ID 조회 및 본인 게시물 확인
  useEffect(() => {
    if (!isClerkLoaded || !clerkUserId) {
      setCurrentUserId(null);
      setIsOwnPost(false);
      return;
    }

    const fetchCurrentUserId = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", clerkUserId)
          .single();

        if (error) {
          console.error("Error fetching current user ID:", error);
          setCurrentUserId(null);
          setIsOwnPost(false);
          return;
        }

        const userId = data?.id || null;
        setCurrentUserId(userId);
        setIsOwnPost(userId === post.user_id);
      } catch (error) {
        console.error("Error fetching current user ID:", error);
        setCurrentUserId(null);
        setIsOwnPost(false);
      }
    };

    fetchCurrentUserId();
  }, [isClerkLoaded, clerkUserId, supabase, post.user_id]);

  // 더블탭 감지 및 좋아요 처리
  const handleDoubleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      if (showDoubleTapHeart) {
        return;
      }

      const willLike = !isLiked;
      setDoubleTapHeartType(willLike ? "like" : "unlike");
      setShowDoubleTapHeart(true);

      handleLike();

      setTimeout(() => {
        setShowDoubleTapHeart(false);
      }, 1000);

      lastTapTimeRef.current = 0;
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
        doubleTapTimeoutRef.current = null;
      }
    } else {
      lastTapTimeRef.current = now;

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
          body: previousIsLiked
            ? undefined
            : JSON.stringify({ postId: post.id }),
        }
      );

      if (!response.ok) {
        setIsLiked(previousIsLiked);
        setLikesCount(previousLikesCount);
        const error = await response.json();
        console.error("Failed to toggle like:", error);
      }
    } catch (error) {
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      console.error("Error toggling like:", error);
    } finally {
      setTimeout(() => setIsAnimating(false), 150);
    }
  };

  // 댓글 불러오기 (전체)
  useEffect(() => {
    fetch(`/api/comments?postId=${post.id}&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        if (data.comments) {
          // 최신순이므로 역순으로 정렬하여 오래된 댓글이 위에 오도록
          setComments([...data.comments].reverse());
        }
      })
      .catch((error) => {
        console.error("Error fetching comments:", error);
      });
  }, [post.id]);

  // 댓글 추가 핸들러
  const handleCommentAdded = (comment: CommentWithUser) => {
    // 최신 댓글을 맨 아래에 추가 (오래된 댓글이 위에, 최신 댓글이 아래에)
    setComments((prev) => [...prev, comment]);
    setCommentsCount((prev) => prev + 1);
    // 댓글 작성 후 스크롤을 맨 아래로 이동하여 새 댓글 확인 가능
    setTimeout(() => {
      if (commentsScrollRef.current) {
        commentsScrollRef.current.scrollTop =
          commentsScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // 댓글 삭제 핸들러
  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));
  };

  // 게시물 삭제 핸들러
  const handleDeletePost = async () => {
    if (!isOwnPost || isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to delete post:", error);
        alert("게시물 삭제에 실패했습니다.");
        setIsDeleting(false);
        return;
      }

      // 삭제 성공 시 피드로 리다이렉트
      router.push("/");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("게시물 삭제 중 오류가 발생했습니다.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-[935px] mx-auto">
      <article className="bg-[var(--instagram-card-background)] border border-[var(--instagram-border)] rounded-sm overflow-hidden">
        {/* 데스크톱 레이아웃 (1024px+) */}
        <div className="hidden lg:flex lg:flex-row lg:h-[600px]">
          {/* 이미지 영역 (50%) */}
          <div className="w-1/2 relative bg-gray-100">
            <div
              className="relative w-full h-full cursor-pointer"
              onClick={handleDoubleTap}
            >
              <Image
                src={post.image_url}
                alt={post.caption || "게시물 이미지"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 467px"
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
          </div>

          {/* 댓글 영역 (50%, 스크롤 가능) */}
          <div className="w-1/2 flex flex-col">
            {/* 헤더 영역 (60px) */}
            <header className="flex items-center justify-between px-4 py-3 h-[60px] border-b border-[var(--instagram-border)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <Link href={`/profile/${post.user.id}`}>
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={undefined}
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
              {isOwnPost && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1 hover:opacity-50 transition-opacity"
                      aria-label="더보기 메뉴"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </header>

            {/* 댓글 목록 영역 (스크롤 가능) */}
            <div
              ref={commentsScrollRef}
              className="flex-1 overflow-y-auto px-4 py-2 space-y-4"
            >
              {/* 캡션 */}
              {post.caption && (
                <div className="text-sm pb-2">
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

              {/* 댓글 목록 */}
              {comments.length > 0 ? (
                <CommentList
                  postId={post.id}
                  initialComments={comments}
                  onCommentDeleted={handleCommentDeleted}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-[var(--text-secondary)]">
                    댓글이 없습니다. 첫 댓글을 작성해보세요!
                  </p>
                </div>
              )}
            </div>

            {/* 액션 버튼 영역 (48px) */}
            <div className="flex items-center justify-between px-4 py-2 h-[48px] border-t border-[var(--instagram-border)] flex-shrink-0">
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
                      isLiked
                        ? "fill-[var(--like)] text-[var(--like)]"
                        : "text-black"
                    )}
                  />
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

            {/* 좋아요 수 */}
            {likesCount > 0 && (
              <div className="px-4 py-1 flex-shrink-0">
                <div className="font-semibold text-sm">
                  좋아요 {likesCount.toLocaleString()}개
                </div>
              </div>
            )}

            {/* 댓글 작성 폼 */}
            <div className="flex-shrink-0">
              <CommentForm
                postId={post.id}
                onCommentAdded={handleCommentAdded}
              />
            </div>
          </div>
        </div>

        {/* 모바일/태블릿 레이아웃 (<1024px) */}
        <div className="lg:hidden">
          {/* 헤더 영역 (60px) */}
          <header className="flex items-center justify-between px-4 py-3 h-[60px] border-b border-[var(--instagram-border)]">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.user.id}`}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={undefined} alt={post.user.name} />
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
            {isOwnPost && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 hover:opacity-50 transition-opacity"
                    aria-label="더보기 메뉴"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>

          {/* 이미지 영역 */}
          <div className="relative w-full aspect-square bg-gray-100">
            <div
              className="relative w-full h-full cursor-pointer"
              onClick={handleDoubleTap}
            >
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
                    isLiked
                      ? "fill-[var(--like)] text-[var(--like)]"
                      : "text-black"
                  )}
                />
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
                <button
                  className="text-sm text-[var(--text-secondary)] hover:text-black"
                  aria-label="댓글 모두 보기"
                >
                  댓글 {commentsCount}개 모두 보기
                </button>
                <CommentList
                  postId={post.id}
                  initialComments={comments.slice(-2)}
                  onCommentDeleted={handleCommentDeleted}
                />
              </div>
            )}
          </div>

          {/* 댓글 작성 폼 */}
          <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
        </div>
      </article>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시물 삭제</DialogTitle>
            <DialogDescription>
              정말 이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePost}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

