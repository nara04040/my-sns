"use client";

/**
 * @file CreatePostModal.tsx
 * @description 게시물 작성 모달 컴포넌트
 *
 * 이미지 업로드 및 캡션 입력을 통해 새 게시물을 작성하는 모달입니다.
 *
 * 주요 기능:
 * 1. 이미지 업로드 (드래그 앤 드롭 또는 파일 선택)
 * 2. 이미지 미리보기
 * 3. 캡션 입력 (최대 2,200자)
 * 4. 파일 검증 (이미지 타입, 최대 5MB)
 * 5. 게시물 작성 API 호출
 * 6. 에러 핸들링 및 진행 상태 표시
 *
 * @dependencies
 * - @/components/ui/dialog: Dialog 컴포넌트
 * - @/components/ui/button: Button 컴포넌트
 * - @/components/ui/textarea: Textarea 컴포넌트
 * - @/components/ui/input: Input 컴포넌트
 */

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CAPTION_LENGTH = 2200;
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export function CreatePostModal({
  open,
  onOpenChange,
}: CreatePostModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 검증
  const validateFile = useCallback((file: File): string | null => {
    // 파일 타입 검증
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "지원하지 않는 파일 형식입니다. JPEG, PNG, GIF, WebP만 업로드 가능합니다.";
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return "파일 크기는 5MB를 초과할 수 없습니다.";
    }

    return null;
  }, []);

  // 파일 선택 처리
  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setSelectedFile(file);

      // 미리보기 URL 생성
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    },
    [validateFile]
  );

  // 파일 입력 변경 처리
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 드래그 앤 드롭 처리
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 파일 선택 버튼 클릭
  const handleSelectFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 이미지 제거
  const handleRemoveImage = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  // 모달 닫기
  const handleClose = useCallback(() => {
    if (isUploading) return; // 업로드 중에는 닫을 수 없음

    // 상태 초기화
    handleRemoveImage();
    setCaption("");
    setError(null);
    onOpenChange(false);
  }, [isUploading, handleRemoveImage, onOpenChange]);

  // 게시물 작성
  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      setError("이미지를 선택해주세요.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "게시물 작성에 실패했습니다. 다시 시도해주세요."
        );
      }

      // 성공 시 모달 닫기 및 페이지 새로고침
      handleClose();
      window.location.reload();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(errorMessage);
      console.error("Error creating post:", err);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, caption, handleClose]);

  // 캡션 변경 처리
  const handleCaptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_CAPTION_LENGTH) {
        setCaption(value);
        setError(null);
      }
    },
    []
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-6 py-4 border-b border-[var(--instagram-border)]">
          <DialogTitle className="text-center text-base font-semibold text-[#262626]">
            새 게시물 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* 이미지 업로드 영역 */}
          {!previewUrl ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                isDragging
                  ? "border-[var(--instagram-blue)] bg-[var(--instagram-blue)]/5"
                  : "border-[var(--instagram-border)] bg-[var(--instagram-background)]",
                "cursor-pointer hover:border-[var(--instagram-blue)]/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleSelectFileClick}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
              <p className="text-base font-semibold text-[#262626] mb-2">
                사진과 동영상을 여기에 끌어다 놓으세요
              </p>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                또는 파일을 선택하세요
              </p>
              <Button
                type="button"
                variant="default"
                className="bg-[var(--instagram-blue)] text-white hover:bg-[var(--instagram-blue)]/90"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectFileClick();
                }}
              >
                컴퓨터에서 선택
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              {/* 이미지 미리보기 */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[var(--instagram-background)]">
                <img
                  src={previewUrl}
                  alt="미리보기"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 캡션 입력 영역 */}
              <div className="mt-4">
                <Textarea
                  placeholder="캡션 작성..."
                  value={caption}
                  onChange={handleCaptionChange}
                  maxLength={MAX_CAPTION_LENGTH}
                  rows={4}
                  className="resize-none text-sm"
                  disabled={isUploading}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-[var(--text-secondary)]">
                    {caption.length} / {MAX_CAPTION_LENGTH}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedFile || isUploading}
              className="flex-1 bg-[var(--instagram-blue)] text-white hover:bg-[var(--instagram-blue)]/90 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  업로드 중...
                </>
              ) : (
                "공유하기"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

