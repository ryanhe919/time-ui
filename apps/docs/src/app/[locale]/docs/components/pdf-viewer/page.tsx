/**
 * @author Ryan He
 * @description 实现 PdfViewer 路由页面的渲染逻辑。
 */

import ZhContent from './zh.mdx';
import EnContent from './en.mdx';

export default async function PdfViewerDocPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return locale === 'en' ? <EnContent /> : <ZhContent />;
}
