/**
 * @file (main)/profile/page.tsx
 * @description 내 프로필 페이지
 *
 * 현재 로그인한 사용자의 프로필 페이지로 리다이렉트합니다.
 *
 * 동작:
 * 1. 인증되지 않은 경우: /sign-in으로 리다이렉트
 * 2. 인증된 경우: /profile/[userId]로 리다이렉트 (userId는 Clerk user ID)
 *
 * @dependencies
 * - @clerk/nextjs/server: auth() 함수
 * - next/navigation: redirect 함수
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  // 현재 사용자 인증 확인
  const { userId } = await auth();

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!userId) {
    redirect("/sign-in");
  }

  // 인증된 경우 해당 사용자의 프로필 페이지로 리다이렉트
  redirect(`/profile/${userId}`);
}

