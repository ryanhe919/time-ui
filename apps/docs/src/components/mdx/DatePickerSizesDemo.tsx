/**
 * @author Ryan He
 * @date 2026-04-24
 * @description 展示 DatePicker 弹出日历面板的不同 panelSize。
 */

'use client';

import { useParams } from 'next/navigation';
import { DatePicker } from '@/components/timeui-client';
import type { ComponentProps, ComponentType } from 'react';

type PanelSize = 'sm' | 'md' | 'lg';

const SIZES: PanelSize[] = ['sm', 'md', 'lg'];
const DatePickerWithPanelSize = DatePicker as ComponentType<
  ComponentProps<typeof DatePicker> & { panelSize?: PanelSize }
>;

export function DatePickerSizesDemo() {
  const params = useParams<{ locale?: string }>();
  const isZh = params?.locale === 'zh';
  const locale = isZh ? 'zh-CN' : 'en-US';

  return (
    <div
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        alignItems: 'start',
      }}
    >
      {SIZES.map((panelSize) => (
        <div
          key={panelSize}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--c-text-secondary)',
              fontFamily: 'var(--docs-mono)',
            }}
          >
            panelSize="{panelSize}"
          </div>
          <DatePickerWithPanelSize
            locale={locale}
            panelSize={panelSize}
            placeholder={isZh ? `选择日期 (${panelSize})` : `Pick a date (${panelSize})`}
            isClearable
            showTodayButton
          />
        </div>
      ))}
    </div>
  );
}
