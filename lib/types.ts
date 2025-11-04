/**
 * @file types.ts
 * @description SNS 프로젝트의 데이터베이스 타입 정의
 *
 * Supabase 데이터베이스 스키마를 기반으로 한 TypeScript 타입 정의입니다.
 * 모든 UUID는 string으로, TIMESTAMPTZ는 ISO 8601 형식의 string으로 표현됩니다.
 *
 * @see {@link /supabase/migrations/sns_schema.sql} - 데이터베이스 스키마
 */

/**
 * 사용자 타입
 * @see users 테이블
 */
export interface User {
  /** 사용자 고유 ID (UUID) */
  id: string;
  /** Clerk 인증 사용자 ID */
  clerk_id: string;
  /** 사용자 이름 */
  name: string;
  /** 생성 일시 (ISO 8601 형식) */
  created_at: string;
}

/**
 * 게시물 타입
 * @see posts 테이블
 */
export interface Post {
  /** 게시물 고유 ID (UUID) */
  id: string;
  /** 작성자 사용자 ID (UUID) */
  user_id: string;
  /** 이미지 URL (Supabase Storage) */
  image_url: string;
  /** 게시물 캡션 (최대 2,200자, nullable) */
  caption: string | null;
  /** 생성 일시 (ISO 8601 형식) */
  created_at: string;
  /** 수정 일시 (ISO 8601 형식) */
  updated_at: string;
}

/**
 * 좋아요 타입
 * @see likes 테이블
 */
export interface Like {
  /** 좋아요 고유 ID (UUID) */
  id: string;
  /** 게시물 ID (UUID) */
  post_id: string;
  /** 좋아요한 사용자 ID (UUID) */
  user_id: string;
  /** 생성 일시 (ISO 8601 형식) */
  created_at: string;
}

/**
 * 댓글 타입
 * @see comments 테이블
 */
export interface Comment {
  /** 댓글 고유 ID (UUID) */
  id: string;
  /** 게시물 ID (UUID) */
  post_id: string;
  /** 작성자 사용자 ID (UUID) */
  user_id: string;
  /** 댓글 내용 */
  content: string;
  /** 생성 일시 (ISO 8601 형식) */
  created_at: string;
  /** 수정 일시 (ISO 8601 형식) */
  updated_at: string;
}

/**
 * 팔로우 타입
 * @see follows 테이블
 */
export interface Follow {
  /** 팔로우 관계 고유 ID (UUID) */
  id: string;
  /** 팔로우하는 사용자 ID (UUID) */
  follower_id: string;
  /** 팔로우받는 사용자 ID (UUID) */
  following_id: string;
  /** 생성 일시 (ISO 8601 형식) */
  created_at: string;
}

/**
 * 게시물 통계 타입
 * @see post_stats 뷰
 */
export interface PostStats {
  /** 게시물 ID (UUID) */
  post_id: string;
  /** 작성자 사용자 ID (UUID) */
  user_id: string;
  /** 이미지 URL */
  image_url: string;
  /** 게시물 캡션 */
  caption: string | null;
  /** 생성 일시 */
  created_at: string;
  /** 좋아요 수 */
  likes_count: number;
  /** 댓글 수 */
  comments_count: number;
}

/**
 * 게시물 + 사용자 정보
 */
export interface PostWithUser extends Post {
  /** 작성자 사용자 정보 */
  user: User;
}

/**
 * 게시물 + 통계 정보
 */
export interface PostWithStats extends Post {
  /** 좋아요 수 */
  likes_count: number;
  /** 댓글 수 */
  comments_count: number;
}

/**
 * 게시물 + 사용자 정보 + 통계 정보
 */
export interface PostWithUserAndStats extends Post {
  /** 작성자 사용자 정보 */
  user: User;
  /** 좋아요 수 */
  likes_count: number;
  /** 댓글 수 */
  comments_count: number;
  /** 현재 사용자의 좋아요 여부 (선택적) */
  isLiked?: boolean;
}

/**
 * 댓글 + 사용자 정보
 */
export interface CommentWithUser extends Comment {
  /** 작성자 사용자 정보 */
  user: User;
}

