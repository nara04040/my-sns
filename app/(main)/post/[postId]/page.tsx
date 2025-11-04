"use client";

/**
 * @file (main)/post/[postId]/page.tsx
 * @description 게시물 상세 페이지
 *
 * 모든 환경(데스크톱/태블릿/모바일)에서 게시물 상세를 보여주는 전체 페이지입니다.
 *
 * 레이아웃 구조:
 * - 뒤로가기 버튼
 * - 이미지 영역 (전체 너비, 1:1 정사각형)
 * - 작성자 헤더
 * - 액션 버튼 + 좋아요 수 + 캡션
 * - 댓글 목록
 * - 댓글 입력
 *
 * @dependencies
 * - next/navigation: 라우팅
 * - @/components/comment/CommentList: 댓글 목록
 * - @/components/comment/CommentForm: 댓글 입력
 * - @/lib/types: 타입 정의
 */

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PostWithUserAndStats } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const router = useRouter();
  const { user } = useUser();
  const [postId, setPostId] = useState<string>("");
  const [post, setPost] = useState<PostWithUserAndStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsRefetchKey, setCommentsRefetchKey] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 본인 게시물인지 확인
  const isOwnPost = user?.id && post?.user.clerk_id === user.id;

  // params에서 postId 추출
  useEffect(() => {
    params.then((resolvedParams) => {
      setPostId(resolvedParams.postId);
    });
  }, [params]);

  // 게시물 데이터 로드
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || "게시물을 불러오지 못했어요.");
        }
        const json = (await res.json()) as { post: PostWithUserAndStats };
        if (cancelled) return;
        setPost(json.post);
        setIsLiked(Boolean(json.post.isLiked));
        setLikesCount(json.post.likes_count ?? 0);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "오류가 발생했어요.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  // 좋아요 토글
  const handleLike = async () => {
    if (!post) return;
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try {
      const url = `/api/likes`;
      const method = prevLiked ? "DELETE" : "POST";
      const response = await fetch(prevLiked ? `${url}?postId=${post.id}` : url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: prevLiked ? undefined : JSON.stringify({ postId: post.id }),
      });
      if (!response.ok) {
        setIsLiked(prevLiked);
        setLikesCount(prevCount);
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  // 뒤로가기
  const handleBack = () => {
    router.back();
  };

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!post) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "게시물 삭제에 실패했어요.");
      }

      // 삭제 성공 시 피드로 리다이렉트
      router.push("/");
    } catch (e: any) {
      setError(e?.message || "게시물 삭제 중 오류가 발생했어요.");
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--instagram-background)] flex items-center justify-center">
        <p className="text-sm text-[var(--text-secondary)]">불러오는 중...</p>
      </div>
    );
  }

  // 에러 상태
  if (error || !post) {
    return (
      <div className="min-h-screen bg-[var(--instagram-background)] flex flex-col items-center justify-center px-4">
        <p className="text-sm text-red-500 mb-4">{error || "게시물을 찾을 수 없습니다."}</p>
        <button
          onClick={handleBack}
          className="text-sm text-[var(--instagram-blue)] hover:opacity-70"
        >
          뒤로가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--instagram-background)]">
      {/* 뒤로가기 버튼 */}
      <div className="sticky top-0 z-10 bg-[var(--instagram-background)] border-b border-[var(--instagram-border)] px-4 py-3">
        <button
          type="button"
          onClick={handleBack}
          className="p-1 hover:opacity-70"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* 이미지 영역 */}
      <div className="relative w-full aspect-square bg-black">
        <Image
          src={post.image_url}
          alt={post.caption || "게시물 이미지"}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>

      {/* 작성자 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--instagram-border)] bg-[var(--instagram-card-background)]">
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
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 hover:opacity-50 transition-opacity"
              aria-label="더보기 메뉴"
              aria-expanded={isMenuOpen}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[var(--instagram-border)] rounded shadow-lg z-20">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 text-red-600 font-semibold"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 액션 버튼 + 좋아요 수 + 캡션 */}
      <div className="px-4 py-2 border-b border-[var(--instagram-border)] bg-[var(--instagram-card-background)]">
        <div className="flex items-center justify-between h-[48px] mb-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label={isLiked ? "좋아요 취소" : "좋아요"}
              onClick={handleLike}
              className="hover:opacity-70"
            >
              <Heart
                className={cn(
                  "w-6 h-6",
                  isLiked ? "fill-[var(--like)] text-[var(--like)]" : "text-black"
                )}
              />
            </button>
            <button type="button" aria-label="댓글" className="hover:opacity-70">
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>
          <button type="button" aria-label="북마크" className="hover:opacity-70">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>
        {likesCount > 0 && (
          <div className="font-semibold text-sm mb-2">
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
            <span>{post.caption}</span>
          </div>
        )}
      </div>

      {/* 댓글 목록 */}
      <div className="px-4 py-3 bg-[var(--instagram-card-background)] min-h-[200px]">
        <CommentList
          postId={post.id}
          limit={50}
          refetchKey={commentsRefetchKey}
          enableDelete
          onMutated={() => setCommentsRefetchKey((v) => v + 1)}
        />
      </div>

      {/* 댓글 입력 */}
      <div className="px-4 py-3 bg-[var(--instagram-card-background)] border-t border-[var(--instagram-border)]">
        <CommentForm
          postId={post.id}
          autoFocus={false}
          onSubmitted={() => setCommentsRefetchKey((v) => v + 1)}
        />
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>게시물 삭제</DialogTitle>
            <DialogDescription>
              게시물을 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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

