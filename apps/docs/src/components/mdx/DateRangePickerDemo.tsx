/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 DateRangePickerDemo（受控 range + presets）。
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
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

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function DateRangePickerDemo() {
  const [value, setValue] = useState<DateRangeValue | null>(null);
  const params = useParams<{ locale?: string }>();
  const isZh = params?.locale === 'zh';
  const today = startOfDay(new Date());
  const presets: DateRangePresetEntry[] = [
    { label: isZh ? '今天' : 'Today', value: { start: today, end: today } },
    {
      label: isZh ? '近 7 天' : 'Last 7 days',
      value: { start: addDays(today, -6), end: today },
    },
    {
      label: isZh ? '近 30 天' : 'Last 30 days',
      value: { start: addDays(today, -29), end: today },
    },
    {
      label: isZh ? '本月' : 'This month',
      value: { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today },
    },
  ];

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
        locale={isZh ? 'zh-CN' : 'en-US'}
        presets={presets}
        placeholder={isZh ? '选择日期范围' : 'Select a range'}
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
