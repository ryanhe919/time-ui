/**
 * @author Ryan He
 * @description 实现 MarkdownViewer 路由页面的渲染逻辑。
 */

import ZhContent from './zh.mdx';
import EnContent from './en.mdx';

export default async function MarkdownViewerDocPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return locale === 'en' ? <EnContent /> : <ZhContent />;
}
