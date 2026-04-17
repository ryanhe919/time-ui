/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 SegmentedControlIconOnlyDemo（纯图标 → 正圆 segment）。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { SegmentedControl } from '@timeui/react';
import { SunIcon, MoonIcon } from '@/components/icons/theme';

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const ColumnsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 4h7v16H4zM13 4h7v16h-7z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

type ThemeMode = 'light' | 'dark';
type View = 'list' | 'grid' | 'columns';

export function SegmentedControlIconOnlyDemo() {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [view, setView] = useState<View>('list');

  return (
    <div
      css={css`
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        align-items: center;
        justify-content: center;
      `}
    >
      <SegmentedControl<ThemeMode>
        size="sm"
        aria-label="Theme"
        value={mode}
        onChange={(v: ThemeMode) => setMode(v)}
        options={[
          { value: 'light', label: <SunIcon />, 'aria-label': 'Light' },
          { value: 'dark', label: <MoonIcon />, 'aria-label': 'Dark' },
        ]}
      />
      <SegmentedControl<View>
        aria-label="View"
        value={view}
        onChange={(v: View) => setView(v)}
        options={[
          { value: 'list', label: <ListIcon />, 'aria-label': 'List' },
          { value: 'grid', label: <GridIcon />, 'aria-label': 'Grid' },
          { value: 'columns', label: <ColumnsIcon />, 'aria-label': 'Columns' },
        ]}
      />
    </div>
  );
}
