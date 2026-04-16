/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现应用布局结构与页面壳逻辑。
 */

import type { Metadata } from 'next';
import { Inter, Fraunces, Noto_Sans_SC, Geist_Mono } from 'next/font/google';
import './globals.css';

const sans = Inter({
  subsets: ['latin'],
  variable: '--docs-sans-body',
  display: 'swap',
});

const serif = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--docs-serif',
  display: 'swap',
});

const cjk = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--docs-sans-cjk',
  display: 'swap',
  preload: false,
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--docs-mono-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TimeUI — 现代 React 组件库',
  description: '灵活、可访问、可主题化的 React 组件库',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh"
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`${serif.variable} ${sans.variable} ${cjk.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
