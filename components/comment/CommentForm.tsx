"use client";

/**
 * @file CommentForm.tsx
 * @description 댓글 작성 폼 컴포넌트
 *
 * 게시물에 댓글을 작성하는 폼 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 댓글 입력 필드
 * 2. Enter 키 또는 "게시" 버튼으로 제출
 * 3. 댓글 작성 후 입력 필드 초기화
 * 4. Optimistic UI로 즉시 댓글 목록에 추가
 *
 * @dependencies
 * - @clerk/nextjs: 현재 사용자 인증 확인
 * - @/components/ui/button: 버튼 컴포넌트
 * - @/lib/types: CommentWithUser 타입
 */

import { useState, KeyboardEvent } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CommentWithUser } from "@/lib/types";

interface CommentFormProps {
  /** 게시물 ID */
  postId: string;
  /** 댓글 추가 시 콜백 */
  onCommentAdded?: (comment: CommentWithUser) => void;
  /** 입력 필드 placeholder (기본값: "댓글 달기...") */
  placeholder?: string;
  /** 추가 클래스명 */
  className?: string;
}

export function CommentForm({
  postId,
  onCommentAdded,
  placeholder = "댓글 달기...",
  className,
}: CommentFormProps) {
  const { isLoaded, userId } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 댓글 작성
  const handleSubmit = async () => {
    if (!isLoaded || !userId) {
      alert("로그인이 필요합니다.");
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: trimmedContent,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to create comment:", error);
        alert("댓글 작성에 실패했습니다.");
        return;
      }

      const data = await response.json();
      const newComment: CommentWithUser = data.comment;

      // 입력 필드 초기화
      setContent("");

      // 콜백 호출
      if (onCommentAdded) {
        onCommentAdded(newComment);
      }
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("댓글 작성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enter 키 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isLoaded) {
    return null;
  }

  if (!userId) {
    return (
      <div className={cn("px-4 py-3 text-sm text-[var(--text-secondary)]", className)}>
        댓글을 작성하려면 로그인이 필요합니다.
      </div>
    );
  }

  return (
    <div className={cn("border-t border-[var(--instagram-border)] px-4 py-3", className)}>
      <div className="flex items-center gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none border-none outline-none text-sm placeholder:text-[var(--text-secondary)] bg-transparent"
          disabled={isSubmitting}
        />
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          variant="ghost"
          size="sm"
          className={cn(
            "text-[var(--instagram-blue)] font-semibold px-2",
            (!content.trim() || isSubmitting) && "opacity-50 cursor-not-allowed"
          )}
        >
          게시
        </Button>
      </div>
    </div>
  );
}

