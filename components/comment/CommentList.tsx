"use client";

/**
 * @file CommentList.tsx
 * @description 특정 게시물(postId)의 댓글 목록을 표시하는 컴포넌트
 *
 * 기능:
 * - /api/comments?postId=... API를 호출해 최신 댓글을 불러와 렌더링
 * - 초기 로딩/에러 상태 표시
 * - 필요 시 상위에서 새로고침 트리거(onRefetchSignal)로 재요청 가능
 *
 * 의존성:
 * - shadcn/ui Avatar
 * - 프로젝트 타입: CommentWithUser
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CommentWithUser } from "@/lib/types";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase/client";

interface CommentListProps {
  /** 댓글을 조회할 게시물 ID */
  postId: string;
  /** 한번에 가져올 최대 개수 (기본 10) */
  limit?: number;
  /** 외부에서 갱신을 유도하고 싶을 때 증가시켜 전달 (의존성 트리거) */
  refetchKey?: number;
  /** 비어있을 때 표시할 문구 (선택) */
  emptyText?: string;
  /** 삭제 기능 활성화 여부 (본인 댓글만 노출) */
  enableDelete?: boolean;
  /** 목록 변경(작성/삭제) 시 부모에 알림 */
  onMutated?: () => void;
}

export function CommentList({
  postId,
  limit = 10,
  refetchKey,
  emptyText = "아직 댓글이 없습니다.",
  enableDelete = true,
  onMutated,
}: CommentListProps) {
  const { user } = useUser();
  const [comments, setComments] = useState<CommentWithUser[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeBump, setRealtimeBump] = useState(0);

  const requestUrl = useMemo(() => `/api/comments?postId=${postId}&limit=${limit}`, [postId, limit]);

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(requestUrl);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "댓글을 불러오지 못했습니다.");
        }
        const data = (await res.json()) as { comments: CommentWithUser[] };
        if (!isCancelled) {
          setComments(data.comments ?? []);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
        if (!isCancelled) {
          setError(message);
        }
        // eslint-disable-next-line no-console
        console.error("CommentList load error:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      isCancelled = true;
    };
  }, [requestUrl, refetchKey, realtimeBump]);

  // Supabase Realtime 구독 (INSERT/DELETE on comments for this post)
  useEffect(() => {
    const channel = supabase
      .channel(`comments-post-${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => setRealtimeBump((v) => v + 1)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => setRealtimeBump((v) => v + 1)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const handleDelete = useCallback(
    async (commentId: string) => {
      try {
        const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '댓글 삭제에 실패했습니다.');
        }
        setComments((prev) => (prev ? prev.filter((c) => c.id !== commentId) : prev));
        setRealtimeBump((v) => v + 1);
        if (onMutated) onMutated();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Comment delete error:', err);
        alert(err instanceof Error ? err.message : '댓글 삭제 중 오류가 발생했습니다.');
      }
    },
    [onMutated]
  );

  if (isLoading && !comments) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 animate-pulse rounded" />
        <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3" />
      </div>
    );
  }

  if (error && !comments) {
    return <p className="text-sm text-[var(--text-secondary)]">{error}</p>;
  }

  if (!comments || comments.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">{emptyText}</p>;
  }

  return (
    <ul className="space-y-2">
      {comments.map((comment) => (
        <li key={comment.id} className="flex items-start gap-3">
          <Link href={`/profile/${comment.user.id}`}>
            <Avatar className="w-6 h-6 mt-0.5">
              <AvatarImage src={undefined} alt={comment.user.name} />
              <AvatarFallback className="text-[10px]">
                {comment.user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 flex items-start justify-between gap-3">
            <div className="text-sm leading-5">
              <Link
                href={`/profile/${comment.user.id}`}
                className="font-semibold hover:opacity-50 transition-opacity mr-2"
              >
                {comment.user.name}
              </Link>
              <span>{comment.content}</span>
            </div>
            {enableDelete && user?.id && comment.user.clerk_id === user.id && (
              <button
                className="text-xs text-[var(--text-secondary)] hover:text-black"
                onClick={() => handleDelete(comment.id)}
                aria-label="댓글 삭제"
              >
                삭제
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}


