/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 Breadcrumb 布局组件。
 */

'use client';

import { usePathname } from 'next/navigation';
import { css } from '@emotion/react';
import type { DocsMessages } from '@/lib/docs-i18n';

export function Breadcrumb({ messages }: { messages: DocsMessages }) {
  const pathname = usePathname();
  const match = pathname.match(/\/docs\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  const [, section] = match;

  return (
    <div
      css={css`
        font-family: var(--docs-sans);
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0;
        color: var(--c-accent);
        margin-bottom: 16px;
      `}
    >
      {messages.sections[section] ?? section}
    </div>
  );
}
