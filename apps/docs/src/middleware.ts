import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED = ['zh', 'en'] as const;
const DEFAULT_LOCALE = 'zh';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/' || pathname.startsWith('/docs')) {
    const url = req.nextUrl.clone();
    url.pathname =
      pathname === '/'
        ? `/${DEFAULT_LOCALE}/docs/getting-started/introduction`
        : `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && !SUPPORTED.includes(first as (typeof SUPPORTED)[number])) {
    const url = req.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|api|favicon.ico|_vercel|assets|images|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|xml)).*)',
  ],
};
