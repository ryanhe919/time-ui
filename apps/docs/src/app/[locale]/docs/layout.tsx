/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现应用布局结构与页面壳逻辑。
 */

import { TopNav } from '@/components/layout/TopNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { TableOfContents } from '@/components/layout/TableOfContents';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { getNavigation } from '@/lib/navigation';
import { getDocsMessages } from '@/lib/docs-i18n';
import timeuiPkg from '@timeui/react/package.json';

const timeuiVersion = timeuiPkg.version;
import type { Locale } from '@timeui/react';
import Link from 'next/link';

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
      <TopNav navigation={navigation} messages={messages} locale={lc} version={timeuiVersion} />

      <details className="docs-mobile-navigation">
        <summary>{lc === 'en' ? 'Browse documentation' : '浏览文档'}</summary>
        <nav aria-label={lc === 'en' ? 'Documentation' : '文档导航'}>
          {navigation.sections.map((section) => (
            <div key={section.slug}>
              <strong>{messages.sections[section.slug] ?? section.slug}</strong>
              {section.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  {messages.pages[item.slug] ?? item.slug}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </details>

      <div className="docs-layout">
        <aside
          className="docs-sidebar"
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

        <main className="docs-main">
          <Breadcrumb messages={messages} />
          <article className="mdx-article">{children}</article>
        </main>

        <aside className="docs-toc">
          <TableOfContents label={messages.nav.onThisPage} />
        </aside>
      </div>
    </div>
  );
}
