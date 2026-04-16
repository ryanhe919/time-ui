/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 MDX 示例组件 SearchDialogDemo。
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/react';
import { Search } from '@timeui/react';

interface Item {
  label: string;
  hint: string;
}

const ITEMS: Item[] = [
  { label: '按钮 Button', hint: '/zh/docs/components/button' },
  { label: '搜索 Search', hint: '/zh/docs/components/search' },
  { label: '提示块 Callout', hint: '/zh/docs/components/callout' },
  { label: '代码块 CodeBlock', hint: '/zh/docs/components/code-block' },
  { label: '主题系统 Theming', hint: '/docs/guides/theming' },
  { label: '快速开始 Introduction', hint: '/zh/docs/getting-started/introduction' },
  { label: '安装 Installation', hint: '/zh/docs/getting-started/installation' },
];

export function SearchDialogDemo() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const filtered = query.trim()
    ? ITEMS.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : ITEMS;

  return (
    <div>
      <Search
        placeholder="点击打开命令面板…"
        shortcut="⌘K"
        onClick={() => setOpen(true)}
        aria-label="打开命令面板"
      />

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="命令面板"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          css={css`
            position: fixed;
            inset: 0;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.32);
            backdrop-filter: saturate(180%) blur(4px);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding-top: 15vh;
            animation: fadeIn 160ms ease-out;
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}
        >
          <div
            css={css`
              width: min(560px, 92vw);
              background: var(--c-bg, #ffffff);
              border-radius: 16px;
              box-shadow:
                0 24px 48px rgba(0, 0, 0, 0.18),
                0 0 0 1px rgba(0, 0, 0, 0.06);
              overflow: hidden;
              font-family: var(--docs-sans, -apple-system, BlinkMacSystemFont, sans-serif);
            `}
          >
            <div
              css={css`
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 14px 18px;
                border-bottom: 1px solid var(--c-hairline, rgba(0, 0, 0, 0.08));
              `}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                css={css`
                  color: var(--c-text-tertiary, #86868b);
                `}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入关键词…试试 button / search / theme"
                css={css`
                  flex: 1;
                  border: none;
                  outline: none;
                  font-size: 15px;
                  background: transparent;
                  color: var(--c-text, #1d1d1f);
                  &::placeholder {
                    color: var(--c-text-tertiary, #86868b);
                  }
                `}
              />
              <kbd
                aria-hidden
                css={css`
                  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                  font-size: 10px;
                  padding: 2px 6px;
                  border: 1px solid var(--c-hairline, rgba(0, 0, 0, 0.1));
                  border-radius: 4px;
                  color: var(--c-text-tertiary, #86868b);
                `}
              >
                ESC
              </kbd>
            </div>
            <ul
              css={css`
                list-style: none;
                margin: 0;
                padding: 6px;
                max-height: 360px;
                overflow: auto;
              `}
            >
              {filtered.length === 0 ? (
                <li
                  css={css`
                    padding: 16px;
                    text-align: center;
                    color: var(--c-text-tertiary, #86868b);
                    font-size: 13px;
                  `}
                >
                  没有匹配的结果
                </li>
              ) : (
                filtered.map((it) => (
                  <li key={it.label}>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      css={css`
                        width: 100%;
                        text-align: left;
                        background: transparent;
                        border: none;
                        padding: 10px 12px;
                        border-radius: 8px;
                        font-family: inherit;
                        font-size: 14px;
                        color: var(--c-text, #1d1d1f);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: pointer;
                        &:hover,
                        &:focus-visible {
                          background: var(--c-bg-secondary, rgba(0, 0, 0, 0.04));
                          outline: none;
                        }
                      `}
                    >
                      <span>{it.label}</span>
                      <span
                        css={css`
                          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                          font-size: 11px;
                          color: var(--c-text-tertiary, #86868b);
                        `}
                      >
                        {it.hint}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
