import type { Metadata } from 'next';
import { Instrument_Serif, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// Editorial serif for h1/display. Four weights/styles — kept subset-narrow.
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--docs-serif',
  display: 'swap',
});

// Refined body sans. Variable font; we pull only Latin for size and leave
// CJK to the system fallback chain declared in globals.css.
const sans = Geist({
  subsets: ['latin'],
  variable: '--docs-sans-body',
  display: 'swap',
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
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
