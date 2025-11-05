# 게시물 작성 기능

## 게시물 작성 모달

- [x] `components/post/CreatePostModal.tsx` - 모달 컴포넌트
- [x] 이미지 업로드 UI (드래그 앤 드롭 또는 파일 선택)
- [x] 이미지 미리보기
- [x] 캡션 입력 필드 (최대 2,200자)
- [x] 파일 크기 검증 (최대 5MB)

## 이미지 업로드

- [x] Supabase Storage 업로드 로직
- [x] 파일 형식 검증 (이미지 파일만)
- [x] 업로드 진행 상태 표시

## 게시물 작성 API

- [x] `app/api/posts/route.ts` - POST (이미지 업로드 + 게시물 생성)
- [x] 에러 핸들링
