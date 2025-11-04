"use client";

/**
 * @file CommentForm.tsx
 * @description 댓글 작성 입력 폼. Enter 또는 버튼 클릭으로 제출.
 *
 * 아직 서버의 POST /api/comments 구현이 없을 수 있으므로,
 * API가 준비되면 동일한 엔드포인트와 페이로드로 연동됩니다.
 */

import { useCallback, useRef, useState, useEffect } from "react";

interface CommentFormProps {
  /** 댓글을 작성할 게시물 ID */
  postId: string;
  /** 작성 완료 후 상위에서 목록 재요청 등의 처리를 위한 콜백 */
  onSubmitted?: () => void;
  /** placeholder 텍스트 (선택) */
  placeholder?: string;
  /** 버튼 라벨 (선택) */
  submitLabel?: string;
  /** 열릴 때 입력창 자동 포커스 */
  autoFocus?: boolean;
}

export function CommentForm({
  postId,
  onSubmitted,
  placeholder = "댓글 달기...",
  submitLabel = "게시",
  autoFocus,
}: CommentFormProps) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const disabled = isSubmitting || value.trim().length === 0;

  const submit = useCallback(async () => {
    if (disabled) return;
    const content = value.trim();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "댓글 작성에 실패했습니다.");
      }
      setValue("");
      if (onSubmitted) onSubmitted();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("CommentForm submit error:", err);
      // 간단한 사용자 알림 (필요 시 Toast로 교체 가능)
      alert(err instanceof Error ? err.message : "댓글 작성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  }, [disabled, postId, value, onSubmitted]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  // 자동 포커스
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div className="flex items-center gap-3 border-t border-[var(--instagram-border)] pt-3">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 text-sm outline-none placeholder:text-[var(--text-secondary)]"
        aria-label="댓글 입력"
      />
      <button
        onClick={submit}
        disabled={disabled}
        className={`text-sm font-semibold ${disabled ? "text-[var(--text-secondary)]" : "text-[var(--instagram-blue)]"}`}
        aria-disabled={disabled}
      >
        {isSubmitting ? "게시중..." : submitLabel}
      </button>
    </div>
  );
}


