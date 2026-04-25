/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现应用布局结构与页面壳逻辑。
 */

import { TopNav } from '@/components/layout/TopNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { TableOfContents } from '@/components/layout/TableOfContents';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { ReadingProgress } from '@/components/layout/ReadingProgress';
import { getNavigation } from '@/lib/navigation';
import { getDocsMessages } from '@/lib/docs-i18n';
import type { Locale } from '@timeui/react';

export const dynamic = 'force-dynamic';

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DocsLayout({ children, params }: Props) {
  const { locale } = await params;
  const lc = (locale === 'en' ? 'en' : 'zh') as Locale;
  const messages = getDocsMessages(lc);
  const navigation = getNavigation(lc);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>
      <ReadingProgress />
      <TopNav navigation={navigation} messages={messages} locale={lc} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px minmax(0, 1fr) 220px',
          maxWidth: 1440,
          margin: '0 auto',
          gap: 48,
          padding: '0 32px',
        }}
      >
        <aside
          style={{
            position: 'sticky',
            top: 48,
            alignSelf: 'start',
            height: 'calc(100vh - 48px)',
            overflow: 'hidden',
          }}
        >
          <Sidebar navigation={navigation} messages={messages} />
        </aside>

        <main
          style={{
            minWidth: 0,
            maxWidth: 760,
            padding: '64px 0 160px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          <Breadcrumb messages={messages} />
          <article className="mdx-article">{children}</article>
        </main>

        <aside>
          <TableOfContents label={messages.nav.onThisPage} />
        </aside>
      </div>
    </div>
  );
}
