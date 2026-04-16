/** @jsxImportSource @emotion/react */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { css } from '@emotion/react';

interface Props {
  locale: 'zh' | 'en';
  label: string;
}

export function LocaleToggle({ locale, label }: Props) {
  const pathname = usePathname();
  const next = locale === 'zh' ? 'en' : 'zh';
  const target = pathname.replace(/^\/(zh|en)/, `/${next}`) || `/${next}`;

  return (
    <Link
      href={target}
      aria-label={label}
      css={css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        height: 28px;
        padding: 0 8px;
        border-radius: 14px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: var(--c-text-secondary);
        background: transparent;
        transition:
          background 200ms,
          color 200ms;
        &:hover {
          background: var(--c-bg-tertiary);
          color: var(--c-text);
        }
      `}
    >
      {next === 'en' ? 'EN' : '中'}
    </Link>
  );
}
