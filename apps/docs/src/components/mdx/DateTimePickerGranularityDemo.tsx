/**
 * @author Ryan He
 * @date 2026-04-24
 * @description 实现文档站 MDX 示例组件 DateTimePickerGranularityDemo：通过 showMinute / showSecond
 *              切换时 / 分 / 秒粒度，关闭的字段在 value 中恒为 0。
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DateTimePicker, SegmentedControl } from '@/components/timeui-client';

type Granularity = 'hour' | 'minute' | 'second';

function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function DateTimePickerGranularityDemo() {
  const [granularity, setGranularity] = useState<Granularity>('minute');
  const [value, setValue] = useState<Date | null>(null);
  const params = useParams<{ locale?: string }>();
  const isZh = params?.locale === 'zh';

  const options: { value: Granularity; label: string }[] = [
    { value: 'hour', label: isZh ? '仅时' : 'Hour only' },
    { value: 'minute', label: isZh ? '时 + 分' : 'Hour + minute' },
    { value: 'second', label: isZh ? '时 + 分 + 秒' : 'Hour + minute + second' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        minWidth: 320,
      }}
    >
      <SegmentedControl
        value={granularity}
        onChange={(v) => setGranularity(v as Granularity)}
        options={options}
        size="sm"
      />
      <DateTimePicker
        value={value}
        onChange={setValue}
        locale={isZh ? 'zh-CN' : 'en-US'}
        placeholder={isZh ? '选择日期时间' : 'Pick a date and time'}
        showMinute={granularity !== 'hour'}
        showSecond={granularity === 'second'}
        isClearable
      />
      <div
        style={{ fontSize: 12, color: 'var(--c-text-tertiary)', fontFamily: 'var(--docs-mono)' }}
      >
        value = {value ? fmt(value) : 'null'}
      </div>
    </div>
  );
}
