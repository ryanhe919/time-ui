/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 Sidebar 布局组件。支持 section 内按 group 渲染分类小标题，并可按 group 折叠。
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { css } from '@emotion/react';
import type { NavItem, Navigation } from '@/lib/navigation';
import type { DocsMessages } from '@/lib/docs-i18n';

interface SidebarProps {
  navigation: Navigation;
  messages: DocsMessages;
}

const STORAGE_KEY = 'docs-sidebar-collapsed';

export function Sidebar({ navigation, messages }: SidebarProps) {
  const pathname = usePathname();
  const activeSectionSlug = pathname.match(/\/docs\/([^/]+)/)?.[1];

  const currentSection =
    navigation.sections.find((s) => s.slug === activeSectionSlug) ?? navigation.sections[0];

  // 折叠状态：key 形如 "<sectionSlug>:<groupSlug>"，值为 true 表示已折叠。
  // SSR 阶段统一为全部展开，挂载后从 localStorage 同步，避免 hydration mismatch。
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setCollapsed(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota / privacy mode errors
      }
      return next;
    });
  };

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

  // 统一成 [{ slug?, label?, items }] 列表：未分组时只产出一组无标题。
  const blocks: { slug?: string; label?: string; items: NavItem[] }[] = currentSection.groups
    ? currentSection.groups.map((g) => ({
        slug: g.slug,
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

        /* Firefox */
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
        &:hover {
          scrollbar-color: var(--c-hairline-strong) transparent;
        }

        /* WebKit */
        &::-webkit-scrollbar {
          width: 6px;
        }
        &::-webkit-scrollbar-track {
          background: transparent;
        }
        &::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 3px;
          transition: background 200ms;
        }
        &:hover::-webkit-scrollbar-thumb {
          background: var(--c-hairline-strong);
        }
        &::-webkit-scrollbar-thumb:hover {
          background: var(--c-text-tertiary);
        }
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

      {blocks.map((block, idx) => {
        const collapsible = Boolean(block.slug && block.label);
        const key = block.slug ? `${currentSection.slug}:${block.slug}` : `block-${idx}`;
        // 在 hydrate 之前一律展开，避免 SSR/CSR 状态不一致闪烁。
        const isCollapsed = hydrated && collapsible ? Boolean(collapsed[key]) : false;
        const listId = `sidebar-group-${key.replace(/[^a-z0-9-]/gi, '-')}`;

        return (
          <div
            key={key}
            css={css`
              & + & {
                margin-top: 20px;
              }
            `}
          >
            {collapsible ? (
              <button
                type="button"
                onClick={() => toggleGroup(key)}
                aria-expanded={!isCollapsed}
                aria-controls={listId}
                css={css`
                  appearance: none;
                  background: transparent;
                  border: 0;
                  width: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 8px;
                  padding: 4px 12px;
                  margin-bottom: 6px;
                  font: inherit;
                  font-size: 11px;
                  font-weight: 500;
                  letter-spacing: 0.04em;
                  color: var(--c-text-tertiary);
                  text-align: left;
                  cursor: pointer;
                  border-radius: 4px;
                  transition:
                    color 200ms,
                    background 200ms;
                  &:hover {
                    color: var(--c-text-secondary);
                  }
                  &:focus-visible {
                    outline: 2px solid var(--c-accent);
                    outline-offset: 2px;
                  }
                `}
              >
                <span>{block.label}</span>
                <svg
                  aria-hidden
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  css={css`
                    flex-shrink: 0;
                    transform: rotate(${isCollapsed ? -90 : 0}deg);
                    transition: transform 200ms;
                  `}
                >
                  <path
                    d="M2 3.5 L5 6.5 L8 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
            <div
              id={listId}
              css={css`
                display: grid;
                grid-template-rows: ${isCollapsed ? '0fr' : '1fr'};
                transition: grid-template-rows 220ms ease;
                overflow: hidden;
              `}
            >
              <ul
                css={css`
                  list-style: none;
                  padding: 0;
                  margin: 0;
                  min-height: 0;
                  display: flex;
                  flex-direction: column;
                `}
              >
                {block.items.map(renderItem)}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
