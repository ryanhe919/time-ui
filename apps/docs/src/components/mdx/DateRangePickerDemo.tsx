/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 DateRangePickerDemo（受控 range + presets）。
 */

'use client';

import { useState } from 'react';
import { DateRangePicker } from '@/components/timeui-client';
import type { DateRangeValue, DateRangePresetEntry } from '@timeui/react';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const today = startOfDay(new Date());
const PRESETS: DateRangePresetEntry[] = [
  { label: 'Today', value: { start: today, end: today } },
  { label: 'Last 7 days', value: { start: addDays(today, -6), end: today } },
  { label: 'Last 30 days', value: { start: addDays(today, -29), end: today } },
  {
    label: 'This month',
    value: { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today },
  },
];

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function DateRangePickerDemo() {
  const [value, setValue] = useState<DateRangeValue | null>(null);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        minWidth: 320,
      }}
    >
      <DateRangePicker
        value={value}
        onChange={setValue}
        presets={PRESETS}
        placeholder="Select a range"
        isClearable
      />
      <div
        style={{ fontSize: 12, color: 'var(--c-text-tertiary)', fontFamily: 'var(--docs-mono)' }}
      >
        value = {value ? `${fmt(value.start)} → ${fmt(value.end)}` : 'null'}
      </div>
    </div>
  );
}
