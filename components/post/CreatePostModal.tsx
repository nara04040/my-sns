"use client";

/**
 * @file CreatePostModal.tsx
 * @description 게시물 작성 모달(UI 전용)
 *
 * 기능 범위(이번 단계):
 * - 이미지 선택(드래그·드롭/파일 선택)
 * - 이미지 미리보기(1:1)
 * - 캡션 입력(최대 2,200자) + 글자 수 카운터
 * - 파일 검증(MIME 이미지, 5MB 이하) 및 에러 표시
 * - 모달 닫힐 때 상태 초기화
 *
 * 업로드/API 연동은 다음 단계에서 처리
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_CAPTION_LENGTH = 2200;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  // 상태 초기화
  const resetState = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setCaption("");
    setError(null);
    setIsDragActive(false);
  }, []);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const validateFile = (f: File): string | null => {
    if (!f.type.startsWith("image/")) return "이미지 파일만 업로드할 수 있어요.";
    if (f.size > MAX_FILE_BYTES) return "파일 크기는 최대 5MB까지 가능합니다.";
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const picked = files[0];
    const err = validateFile(picked);
    if (err) {
      setError(err);
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setError(null);
    setFile(picked);
    const url = URL.createObjectURL(picked);
    setPreviewUrl(url);
  };

  // 드래그 앤 드롭 핸들러
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files ?? null);
  };

  const pickFile = () => inputRef.current?.click();

  const removeImage = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const captionCount = useMemo(() => caption.length, [caption]);
  const isPostDisabled = !file || !!error;

  const getBucket = () => process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads";

  const extractExtension = (name: string): string => {
    const idx = name.lastIndexOf(".");
    return idx >= 0 ? name.slice(idx) : "";
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }
    // 재검증
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }

    try {
      setIsUploading(true);
      const clerkId = user.id;
      const ext = extractExtension(file.name);
      const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
      const path = `${clerkId}/${uuid}${ext}`;
      const bucket = getBucket();

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: false,
        cacheControl: "3600",
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = data.publicUrl;

      // 게시물 생성 API 호출
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: publicUrl, caption: caption || undefined }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "게시물 생성에 실패했어요.");
      }
      const json = await res.json().catch(() => null);
      // eslint-disable-next-line no-console
      console.log("post created:", json?.post);

      // 성공: 상태 초기화 및 모달 닫기 (상위에서 피드 갱신은 별도 처리)
      handleOpenChange(false);
    } catch (e: any) {
      setError(e?.message || "업로드에 실패했어요. 나중에 다시 시도해 주세요.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>새 게시물 만들기</DialogTitle>
          <DialogDescription>
            이미지를 선택하고 캡션을 입력해 보세요.
          </DialogDescription>
        </DialogHeader>

        {/* 본문 */}
        <div className="px-6 pb-2">
          {!previewUrl ? (
            <div
              className={
                "border-2 border-dashed rounded-lg h-64 flex flex-col items-center justify-center gap-3 text-sm " +
                (isDragActive ? "border-(--instagram-blue) bg-[#f6fafe]" : "border-[#dbdbdb]")
              }
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onClick={pickFile}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") pickFile();
              }}
              aria-label="이미지 업로드"
            >
              <p className="text-[#8e8e8e]">이미지를 드래그하여 추가</p>
              <Button
                type="button"
                variant="default"
                className="bg-(--instagram-blue) text-white hover:bg-(--instagram-blue)/90"
              >
                컴퓨터에서 선택
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.currentTarget.files)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 미리보기 1:1 */}
              <div className="w-full">
                <div className="relative w-full pt-[100%] bg-[#fafafa] rounded-lg overflow-hidden border border-[#dbdbdb]">
                  {previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="미리보기"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={pickFile}>
                    다른 이미지 선택
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
                    제거
                  </Button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.currentTarget.files)}
                  />
                </div>
              </div>

              {/* 캡션 */}
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-2 text-[#262626]">캡션</label>
                <Textarea
                  value={caption}
                  onChange={(e) => {
                    const next = e.currentTarget.value;
                    if (next.length <= MAX_CAPTION_LENGTH) setCaption(next);
                  }}
                  placeholder="문구 입력..."
                  className="min-h-40 resize-y"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-[#8e8e8e]">
                  <span>{captionCount} / {MAX_CAPTION_LENGTH}</span>
                  {error && <span className="text-red-500">{error}</span>}
                </div>
              </div>
            </div>
          )}

          {/* 에러 (이미지 선택 전에도 표기) */}
          {!previewUrl && error && (
            <p className="mt-3 text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading}>
            취소
          </Button>
          <Button
            type="button"
            disabled={isPostDisabled || isUploading}
            className="bg-(--instagram-blue) text-white hover:bg-(--instagram-blue)/90"
            onClick={handleUpload}
          >
            {isUploading ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                업로드 중...
              </span>
            ) : (
              "게시"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreatePostModal;


