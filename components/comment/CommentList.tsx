"use client";

/**
 * @file CommentList.tsx
 * @description 댓글 목록 컴포넌트
 *
 * 게시물의 댓글 목록을 표시하고, 댓글 삭제 기능을 제공합니다.
 *
 * 주요 기능:
 * 1. 댓글 목록 표시 (최신순)
 * 2. 각 댓글에 작성자 프로필 이미지, 이름, 내용, 시간 표시
 * 3. 본인 댓글에만 삭제 버튼 표시
 * 4. Optimistic UI로 즉시 업데이트
 *
 * @dependencies
 * - @clerk/nextjs: 현재 사용자 정보
 * - @/components/ui/avatar: 프로필 이미지
 * - @/lib/types: CommentWithUser 타입
 * - @/lib/utils: formatRelativeTime 함수
 */

import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { CommentWithUser } from "@/lib/types";

interface CommentListProps {
  /** 게시물 ID */
  postId: string;
  /** 초기 댓글 목록 */
  initialComments?: CommentWithUser[];
  /** 댓글 추가 시 콜백 */
  onCommentAdded?: (comment: CommentWithUser) => void;
  /** 댓글 삭제 시 콜백 */
  onCommentDeleted?: (commentId: string) => void;
}

export interface CommentListRef {
  /** 외부에서 댓글을 추가하는 함수 */
  addComment: (comment: CommentWithUser) => void;
}

const CommentListComponent = forwardRef<CommentListRef, CommentListProps>(
  function CommentListComponent(
    {
      postId,
      initialComments = [],
      onCommentAdded,
      onCommentDeleted,
    }: CommentListProps,
    ref: React.Ref<CommentListRef>
  ) {
  const { userId: clerkUserId, isLoaded: isClerkLoaded } = useAuth();
  const supabase = useClerkSupabaseClient();
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );

  // Clerk 사용자 ID로 Supabase user ID 조회
  useEffect(() => {
    if (!isClerkLoaded || !clerkUserId) {
      setCurrentUserId(null);
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
          return;
        }

        setCurrentUserId(data?.id || null);
      } catch (error) {
        console.error("Error fetching current user ID:", error);
        setCurrentUserId(null);
      }
    };

    fetchCurrentUserId();
  }, [isClerkLoaded, clerkUserId, supabase]);

  // initialComments가 변경되면 comments 업데이트
  useEffect(() => {
    if (initialComments.length > 0) {
      setComments(initialComments);
    }
  }, [initialComments]);

  // 외부에서 댓글을 추가할 수 있도록 ref 노출
  useImperativeHandle(ref, () => ({
    addComment: (comment: CommentWithUser) => {
      setComments((prev) => [comment, ...prev]);
    },
  }));

  // 댓글 삭제
  const handleDelete = async (commentId: string) => {
    if (!currentUserId) return;

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    // Optimistic UI 업데이트
    const previousComments = comments;
    setComments(comments.filter((c) => c.id !== commentId));
    setDeletingCommentId(commentId);

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // 에러 발생 시 롤백
        setComments(previousComments);
        const error = await response.json();
        console.error("Failed to delete comment:", error);
        alert("댓글 삭제에 실패했습니다.");
      } else {
        // 성공 시 콜백 호출
        if (onCommentDeleted) {
          onCommentDeleted(commentId);
        }
      }
    } catch (error) {
      // 에러 발생 시 롤백
      setComments(previousComments);
      console.error("Error deleting comment:", error);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => {
        const isOwnComment = currentUserId === comment.user_id;
        const isDeleting = deletingCommentId === comment.id;

        return (
          <div
            key={comment.id}
            className={cn(
              "flex items-start gap-2 group",
              isDeleting && "opacity-50"
            )}
          >
            <Link href={`/profile/${comment.user.id}`}>
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage
                  src={undefined} // Clerk 프로필 이미지는 추후 연동
                  alt={comment.user.name}
                />
                <AvatarFallback className="text-xs">
                  {comment.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Link
                    href={`/profile/${comment.user.id}`}
                    className="font-semibold text-sm hover:opacity-50 transition-opacity mr-2"
                  >
                    {comment.user.name}
                  </Link>
                  <span className="text-sm">{comment.content}</span>
                </div>
                {isOwnComment && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={isDeleting}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:opacity-50"
                    aria-label="댓글 삭제"
                  >
                    <Trash2 className="w-4 h-4 text-[var(--text-secondary)]" />
                  </button>
                )}
              </div>
              <div className="mt-1">
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatRelativeTime(comment.created_at)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

CommentListComponent.displayName = "CommentList";

export { CommentListComponent as CommentList };

