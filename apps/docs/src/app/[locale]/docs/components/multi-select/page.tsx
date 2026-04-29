/**
 * @author Ryan He
 * @date 2026-04-29
 * @description 实现 MultiSelect 文档路由：根据 locale 渲染 zh / en MDX。
 */

import ZhContent from './zh.mdx';
import EnContent from './en.mdx';

export default async function MultiSelectDocPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return locale === 'en' ? <EnContent /> : <ZhContent />;
}
