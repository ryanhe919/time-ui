/**
 * @author Ryan He
 * @date 2026-04-27
 * @description 单组件 Playground 页面：从 docs 站组件页跳转过来，
 *              提供整页的 Sandpack 编辑器 + 预览，方便长时间调试 props。
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LivePlayground } from '@/components/mdx/LivePlayground';
import { getStarter, PLAYGROUND_STARTERS } from '@/lib/playground-starters';

export function generateStaticParams() {
  return Object.keys(PLAYGROUND_STARTERS).flatMap((slug) => [
    { locale: 'zh', slug },
    { locale: 'en', slug },
  ]);
}

export default async function PlaygroundPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const starter = getStarter(slug);
  if (!starter) notFound();

  const isZh = locale !== 'en';
  const title = isZh ? starter.zhName : starter.enName;
  const backHref = `/${locale}/docs/components/${slug}`;
  const backLabel = isZh ? '返回文档' : 'Back to docs';
  const subtitle = isZh
    ? '在右侧编辑代码，左侧实时预览。改 props、加交互、试主题，都可以。'
    : 'Edit on the right, preview on the left in real time. Tweak props, add interactions, try themes.';

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: '24px 32px',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <Link
          href={backHref}
          style={{
            fontSize: 13,
            color: 'var(--c-text-tertiary)',
            textDecoration: 'none',
          }}
        >
          ← {backLabel}
        </Link>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{title} · Playground</h1>
      </div>
      <p style={{ margin: 0, color: 'var(--c-text-secondary)', fontSize: 14 }}>{subtitle}</p>
      <div style={{ flex: 1, minHeight: 0 }}>
        <LivePlayground code={starter.code} locale={isZh ? 'zh' : 'en'} editorHeight={620} />
      </div>
    </main>
  );
}
