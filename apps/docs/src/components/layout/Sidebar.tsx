/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 Sidebar 布局组件。支持 section 内按 group 渲染分类小标题。
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { css } from '@emotion/react';
import type { NavItem, Navigation } from '@/lib/navigation';
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

  const renderItem = (item: NavItem) => {
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
  };

  // 统一成 [{ label?, items }] 列表：未分组时只产出一组无标题。
  const blocks: { label?: string; items: NavItem[] }[] = currentSection.groups
    ? currentSection.groups.map((g) => ({
        label: messages.groups[g.slug] ?? g.slug,
        items: g.items,
      }))
    : [{ items: currentSection.items }];

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

      {blocks.map((block, idx) => (
        <div
          key={block.label ?? `block-${idx}`}
          css={css`
            & + & {
              margin-top: 20px;
            }
          `}
        >
          {block.label ? (
            <div
              css={css`
                font-size: 11px;
                font-weight: 500;
                letter-spacing: 0.04em;
                color: var(--c-text-tertiary);
                padding: 0 12px;
                margin-bottom: 6px;
              `}
            >
              {block.label}
            </div>
          ) : null}
          <ul
            css={css`
              list-style: none;
              padding: 0;
              margin: 0;
              display: flex;
              flex-direction: column;
            `}
          >
            {block.items.map(renderItem)}
          </ul>
        </div>
      ))}
    </nav>
  );
}
