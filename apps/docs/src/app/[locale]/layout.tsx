/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现应用布局结构与页面壳逻辑。
 */

import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Providers } from '../providers';
import type { Locale } from '@timeui/react';

const SUPPORTED: Locale[] = ['zh', 'en'];

export function generateStaticParams() {
  return SUPPORTED.map((locale) => ({ locale }));
}

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!SUPPORTED.includes(locale as Locale)) notFound();
  return <Providers locale={locale as Locale}>{children}</Providers>;
}
