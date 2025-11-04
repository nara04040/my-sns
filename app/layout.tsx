/**
 * @file layout.tsx
 * @description 루트 레이아웃 컴포넌트
 *
 * 모든 페이지에 공통으로 적용되는 루트 레이아웃
 * - ClerkProvider: 인증 제공
 * - SyncUserProvider: 사용자 동기화
 * - 전역 스타일 설정
 *
 * @dependencies
 * - @clerk/nextjs: ClerkProvider
 * - components/providers/sync-user-provider: SyncUserProvider
 */

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono } from "next/font/google";

import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mini Instagram - 바이브 코딩 SNS",
  description: "Instagram UI 기반 SNS 프로젝트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>{children}</SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
