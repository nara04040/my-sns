/**
 * @file (auth)/sign-in/[[...rest]]/page.tsx
 * @description 로그인 페이지 (Catch-all route)
 *
 * Clerk의 SignIn 컴포넌트를 사용한 로그인 페이지
 * Catch-all route로 설정하여 Clerk가 필요로 하는 모든 하위 경로를 처리합니다.
 * 예: /sign-in, /sign-in/factor-one, /sign-in/sso-callback 등
 *
 * 로그인 성공 시 홈(/)으로 리다이렉트
 *
 * @dependencies
 * - @clerk/nextjs: SignIn 컴포넌트
 */

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="w-full max-w-md px-4">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-none border border-[#dbdbdb]",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/"
          afterSignUpUrl="/"
        />
      </div>
    </div>
  );
}

