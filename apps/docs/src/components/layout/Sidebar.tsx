/** @jsxImportSource @emotion/react */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { css } from '@emotion/react';
import type { Navigation } from '@/lib/navigation';
import type { DocsMessages } from '@/lib/docs-i18n';

interface SidebarProps {
  navigation: Navigation;
  messages: DocsMessages;
}

export function Sidebar({ navigation, messages }: SidebarProps) {
  const pathname = usePathname();
  const activeSectionSlug = pathname.match(/\/docs\/([^/]+)/)?.[1];

  const currentSection =
    navigation.sections.find((s) => s.slug === activeSectionSlug) ?? navigation.sections[0];

  if (!currentSection) return null;

  return (
    <nav
      aria-label="Documentation navigation"
      css={css`
        height: 100%;
        padding: 40px 0;
        overflow-y: auto;
        font-family: var(--docs-sans);
      `}
    >
      <div
        css={css`
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--c-text-tertiary);
          padding: 0 12px;
          margin-bottom: 16px;
        `}
      >
        {messages.sections[currentSection.slug] ?? currentSection.slug}
      </div>

      <ul
        css={css`
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
        `}
      >
        {currentSection.items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                css={css`
                  position: relative;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  padding: 7px 12px;
                  font-size: 13px;
                  line-height: 1.4;
                  color: ${active ? 'var(--c-accent)' : 'var(--c-text-secondary)'};
                  font-weight: ${active ? 500 : 400};
                  letter-spacing: -0.003em;
                  transition: color 200ms;
                  &:hover {
                    color: var(--c-text);
                  }
                `}
              >
                <span
                  aria-hidden
                  css={css`
                    flex-shrink: 0;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: ${active ? 'var(--c-accent)' : 'transparent'};
                    transition: background 200ms;
                  `}
                />
                <span>{messages.pages[item.slug] ?? item.slug}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
