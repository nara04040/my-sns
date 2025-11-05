/**
 * @file (auth)/sign-up/[[...rest]]/page.tsx
 * @description 회원가입 페이지 (Catch-all route)
 *
 * Clerk의 SignUp 컴포넌트를 사용한 회원가입 페이지
 * Catch-all route로 설정하여 Clerk가 필요로 하는 모든 하위 경로를 처리합니다.
 * 예: /sign-up, /sign-up/continue, /sign-up/verify-email 등
 *
 * 회원가입 성공 시 홈(/)으로 리다이렉트
 *
 * @dependencies
 * - @clerk/nextjs: SignUp 컴포넌트
 */

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-full max-w-md px-4">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-none border border-[#dbdbdb]",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignInUrl="/"
          afterSignUpUrl="/"
        />
      </div>
    </div>
  );
}

