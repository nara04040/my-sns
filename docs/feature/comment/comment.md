# 댓글 기능

## 댓글 컴포넌트

- [x] `components/comment/CommentList.tsx` - 댓글 목록
- [x] `components/comment/CommentForm.tsx` - 댓글 작성 폼
- [x] PostCard에 댓글 미리보기 (최신 2개)

## 댓글 API

- [x] `app/api/comments/route.ts` - POST (댓글 작성)
- [x] `app/api/comments/[commentId]/route.ts` - DELETE (댓글 삭제)
- [x] `app/api/comments/route.ts` - GET (댓글 목록, postId 쿼리)

## 댓글 기능

- [x] 댓글 작성 (Enter 또는 "게시" 버튼)
- [x] 댓글 삭제 (본인만, hover 시 삭제 버튼 표시)
- [x] 댓글 Optimistic UI 업데이트


- [x] 댓글 컴포넌트 구현
  - [x] `components/comment/CommentList.tsx` - 댓글 목록 표시 및 삭제
  - [x] `components/comment/CommentForm.tsx` - 댓글 작성 폼
- [x] 댓글 API 구현
  - [x] `app/api/comments/route.ts` - POST (댓글 작성)
  - [x] `app/api/comments/[commentId]/route.ts` - DELETE (댓글 삭제)
- [x] 댓글 기능 구현
  - [x] 댓글 작성 (Enter 또는 "게시" 버튼)
  - [x] 댓글 삭제 (본인만, hover 시 삭제 버튼 표시)
  - [x] Optimistic UI 업데이트