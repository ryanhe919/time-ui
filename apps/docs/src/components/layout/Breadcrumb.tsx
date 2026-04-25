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

// Stable editorial numbering for known section slugs. Unknown sections
// fall back to '00' so layout stays deterministic.
const SECTION_NUMBERS: Record<string, string> = {
  'getting-started': '01',
  components: '02',
  chat: '03',
};

export function Breadcrumb({ messages }: { messages: DocsMessages }) {
  const pathname = usePathname();
  const match = pathname.match(/\/docs\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  const [, section] = match;
  const number = SECTION_NUMBERS[section] ?? '00';
  const sectionLabel = messages.sections[section] ?? section;

  return (
    <div
      css={css`
        font-family: var(--docs-mono);
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--c-text-tertiary);
        margin-bottom: 28px;
        display: flex;
        align-items: center;
        gap: 12px;
      `}
    >
      <span
        css={css`
          color: var(--c-iris);
          font-weight: 500;
        `}
      >
        {number}
      </span>
      <span
        aria-hidden
        css={css`
          color: var(--c-text-tertiary);
          opacity: 0.6;
        `}
      >
        /
      </span>
      <span
        css={css`
          color: var(--c-text);
          font-weight: 500;
        `}
      >
        {sectionLabel}
      </span>
      <span
        aria-hidden
        css={css`
          flex: 1;
          height: 1px;
          border-bottom: 1px dotted var(--c-leader);
          align-self: center;
          margin-bottom: 2px;
        `}
      />
    </div>
  );
}
