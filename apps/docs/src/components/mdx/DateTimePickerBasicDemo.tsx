/**
 * @author Ryan He
 * @date 2026-04-24
 * @description 实现文档站 MDX 示例组件 DateTimePickerBasicDemo（受控日期时间 + 显示当前值）。
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DateTimePicker } from '@/components/timeui-client';

function fmt(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function DateTimePickerBasicDemo() {
  const [value, setValue] = useState<Date | null>(null);
  const params = useParams<{ locale?: string }>();
  const isZh = params?.locale === 'zh';

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
      <DateTimePicker
        value={value}
        onChange={setValue}
        locale={isZh ? 'zh-CN' : 'en-US'}
        placeholder={isZh ? '选择日期时间' : 'Pick a date and time'}
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
