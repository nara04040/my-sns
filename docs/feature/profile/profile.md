## 8. 프로필 페이지

- [x] 프로필 페이지 라우트
  - [x] `app/(main)/profile/page.tsx` - 내 프로필
  - [x] `app/(main)/profile/[userId]/page.tsx` - 다른 사용자 프로필
- [x] 프로필 헤더
  - [x] `components/profile/ProfileHeader.tsx` - 프로필 헤더
  - [x] 프로필 이미지 (150px 데스크톱 / 90px 모바일)
  - [x] 사용자명, 통계 (게시물 수, 팔로워 수, 팔로잉 수)
  - [x] 팔로우/팔로잉 버튼 (다른 사용자 프로필) - UI 완료 (API 연동은 다음 단계)
- [x] 프로필 API
  - [x] `app/api/users/[userId]/route.ts` - GET (프로필 정보)
- [x] 게시물 그리드
  - [x] `components/profile/PostGrid.tsx` - 3열 그리드 레이아웃
  - [x] 게시물 썸네일 (1:1 정사각형)
  - [x] Hover 시 좋아요/댓글 수 표시
  - [x] 클릭 시 게시물 상세 모달/페이지 이동