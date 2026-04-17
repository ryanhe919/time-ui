/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 ThemeToggle 布局组件。
 */

'use client';

import { useEffect, useState } from 'react';
import { SegmentedControl } from '@timeui/react';
import { useThemeMode } from '@/app/providers';
import { SunIcon, MoonIcon } from '@/components/icons/theme';

interface Props {
  labelLight: string;
  labelDark: string;
}

type Mode = 'light' | 'dark';

export function ThemeToggle({ labelLight, labelDark }: Props) {
  const { mode, setMode } = useThemeMode();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 服务端 / 首次渲染默认 light，hydration 后再切真实 mode，避免闪烁与 hydration mismatch。
  const value: Mode = mounted ? mode : 'light';

  return (
    <SegmentedControl<Mode>
      size="sm"
      aria-label="Theme"
      value={value}
      onChange={setMode}
      options={[
        { value: 'light', label: <SunIcon />, 'aria-label': labelLight },
        { value: 'dark', label: <MoonIcon />, 'aria-label': labelDark },
      ]}
    />
  );
}
