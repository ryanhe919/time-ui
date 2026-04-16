/** @jsxImportSource @emotion/react */
'use client';

import { usePathname } from 'next/navigation';
import { css } from '@emotion/react';
import type { DocsMessages } from '@/lib/docs-i18n';

/**
 * Eyebrow label rendered above the page H1 — Apple's "section + page" pattern.
 * Renders nothing on landing pages without a section/page slug.
 */
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
