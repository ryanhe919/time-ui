/** @jsxImportSource @emotion/react */
'use client';

import { useEffect, useState } from 'react';
import { css } from '@emotion/react';
import { useThemeMode } from '@/app/providers';

const SunIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

interface Props {
  labelLight: string;
  labelDark: string;
}

export function ThemeToggle({ labelLight, labelDark }: Props) {
  const { mode, toggle } = useThemeMode();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mode === 'light' ? labelDark : labelLight}
      css={css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: var(--c-text-secondary);
        cursor: pointer;
        transition:
          background 200ms,
          color 200ms;
        &:hover {
          background: var(--c-bg-tertiary);
          color: var(--c-text);
        }
      `}
    >
      {mounted ? mode === 'light' ? <MoonIcon /> : <SunIcon /> : <SunIcon />}
    </button>
  );
}
