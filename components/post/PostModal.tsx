"use client";

/**
 * @file PostModal.tsx
 * @description 데스크톱 전용 게시물 상세 모달 컴포넌트.
 * 좌측 50% 이미지, 우측 50% 정보/댓글/액션을 표시합니다.
 *
 * 데이터는 `/api/posts/[postId]`에서 로드하며 댓글은 기존 `CommentList`와 `CommentForm`을 사용합니다.
 */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Heart, MessageCircle, Bookmark } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentList } from "@/components/comment/CommentList";
import { CommentForm } from "@/components/comment/CommentForm";
import type { PostWithUserAndStats } from "@/lib/types";
import { cn, formatRelativeTime } from "@/lib/utils";

interface PostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

export function PostModal({ open, onOpenChange, postId }: PostModalProps) {
  const [post, setPost] = useState<PostWithUserAndStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsRefetchKey, setCommentsRefetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!open) return;
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
  }, [open, postId]);

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

  const postCaption = useMemo(() => post?.caption ?? "", [post]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(1024px,95vw)] p-0 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--instagram-border)]">
          <button
            type="button"
            aria-label="닫기"
            className="p-1 hover:opacity-70"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문: 좌우 50% */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* 좌: 이미지 */}
          <div className="relative bg-[#111] aspect-square lg:min-h-[560px]">
            {post?.image_url && (
              <Image
                src={post.image_url}
                alt={postCaption || "게시물 이미지"}
                fill
                className="object-contain bg-black"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            )}
          </div>

          {/* 우: 메타/댓글/액션 */}
          <div className="flex flex-col min-h-[560px] max-h-[80vh]">
            {/* 작성자 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--instagram-border)]">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={undefined} alt={post?.user?.name || "user"} />
                  <AvatarFallback className="text-xs">
                    {post?.user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{post?.user?.name}</span>
                  {post && (
                    <span className="text-xs text-[var(--text-secondary)]">
                      {formatRelativeTime(post.created_at)}
                    </span>
                  )}
                </div>
              </div>
              <div aria-hidden>
                {/* ⋯ 자리 */}
              </div>
            </div>

            {/* 액션 + 좋아요수 + 캡션 */}
            <div className="px-4 py-2 border-b border-[var(--instagram-border)]">
              <div className="flex items-center justify-between h-[48px] mb-2">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label={isLiked ? "좋아요 취소" : "좋아요"}
                    onClick={handleLike}
                    className="hover:opacity-70"
                  >
                    <Heart className={cn("w-6 h-6", isLiked ? "fill-[var(--like)] text-[var(--like)]" : "text-black")} />
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
                <div className="font-semibold text-sm mb-2">좋아요 {likesCount.toLocaleString()}개</div>
              )}
              {/* 캡션 */}
              {post?.caption && (
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
            <div className="px-4 py-3 overflow-y-auto flex-1">
              {isLoading && <p className="text-sm text-[var(--text-secondary)]">불러오는 중...</p>}
              {error && <p className="text-sm text-red-500">{error}</p>}
              {!isLoading && post && (
                <CommentList
                  postId={post.id}
                  limit={20}
                  refetchKey={commentsRefetchKey}
                  enableDelete
                  onMutated={() => setCommentsRefetchKey((v) => v + 1)}
                />
              )}
            </div>

            {/* 댓글 입력 */}
            <div className="px-4 py-3">
              {post && (
                <CommentForm
                  postId={post.id}
                  autoFocus={false}
                  onSubmitted={() => setCommentsRefetchKey((v) => v + 1)}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PostModal;


