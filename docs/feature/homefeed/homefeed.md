# 홈 피드 페이지

## 타입 정의

- [x] `lib/types.ts` - Post, User, Like, Comment, Follow 타입

## PostCard 컴포넌트

- [x] `components/post/PostCard.tsx` - 게시물 카드 전체 구조
- [x] PostCard 헤더 (프로필 이미지 32px, 사용자명, 시간, ⋯ 메뉴)
- [x] PostCard 이미지 영역 (1:1 정사각형)
- [x] PostCard 액션 버튼 (좋아요 ❤️, 댓글 💬, 공유 ✈️, 북마크 🔖)
- [x] PostCard 컨텐츠 (좋아요 수, 캡션, 댓글 미리보기 2개)

## 로딩 UI

- [x] `components/ui/skeleton.tsx` - Skeleton 컴포넌트
- [x] `components/post/PostCardSkeleton.tsx` - PostCard 스켈레톤

## PostFeed 컴포넌트

- [x] `components/post/PostFeed.tsx` - 게시물 피드 목록
- [x] 무한 스크롤 (Intersection Observer, 10개씩)

## API 라우트

- [x] `app/api/posts/route.ts` - GET (페이지네이션)
- [x] `app/api/posts/route.ts` - POST (게시물 작성)
- [x] `app/api/posts/[postId]/route.ts` - GET (상세)
- [x] `app/api/posts/[postId]/route.ts` - DELETE (삭제)
