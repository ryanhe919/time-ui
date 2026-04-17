/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 DatePickerBasicDemo（受控单日期 + 显示当前值）。
 */

'use client';

import { useState } from 'react';
import { DatePicker } from '@/components/timeui-client';

export function DatePickerBasicDemo() {
  const [value, setValue] = useState<Date | null>(null);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        minWidth: 280,
      }}
    >
      <DatePicker
        value={value}
        onChange={setValue}
        placeholder="Pick a date"
        isClearable
        showTodayButton
      />
      <div
        style={{ fontSize: 12, color: 'var(--c-text-tertiary)', fontFamily: 'var(--docs-mono)' }}
      >
        value = {value ? value.toISOString().slice(0, 10) : 'null'}
      </div>
    </div>
  );
}
