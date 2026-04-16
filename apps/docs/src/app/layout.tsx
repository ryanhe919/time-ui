import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TimeUI — 现代 React 组件库',
  description: '灵活、可访问、可主题化的 React 组件库',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" data-theme="light" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
