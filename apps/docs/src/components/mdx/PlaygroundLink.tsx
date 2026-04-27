/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-27
 * @description PlaygroundLink —— 在组件文档页面里的"在 Playground 中试用"按钮。
 *              点击跳转到 /[locale]/playground/[slug]，那里才是完整的可编辑实时预览页。
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { css } from '@emotion/react';

export interface PlaygroundLinkProps {
  /** 组件 slug，例如 'button' / 'date-picker'。 */
  slug: string;
  /** 自定义按钮文本。默认按 locale 自动选择。 */
  label?: string;
}

export function PlaygroundLink({ slug, label }: PlaygroundLinkProps) {
  const pathname = usePathname();
  const locale = pathname?.startsWith('/en') ? 'en' : 'zh';
  const text = label ?? (locale === 'zh' ? '在 Playground 中试用 →' : 'Try in Playground →');
  const href = `/${locale}/playground/${slug}`;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      css={css`
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin: 8px 0 24px;
        padding: 8px 14px;
        font-family: var(--docs-sans);
        font-size: 13px;
        font-weight: 500;
        color: var(--c-accent);
        background: rgba(0, 113, 227, 0.08);
        border: 1px solid rgba(0, 113, 227, 0.2);
        border-radius: var(--r-cta);
        text-decoration: none;
        transition:
          background 200ms,
          color 200ms,
          border-color 200ms;
        &:hover {
          background: rgba(0, 113, 227, 0.16);
          color: var(--c-accent-hover);
          border-color: rgba(0, 113, 227, 0.35);
        }
      `}
    >
      {text}
    </Link>
  );
}
