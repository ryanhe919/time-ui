/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现当前路由页面的渲染逻辑。
 */

import ZhContent from './zh.mdx';
import EnContent from './en.mdx';

export default async function PopoverDocPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return locale === 'en' ? <EnContent /> : <ZhContent />;
}
