/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 SegmentedControlRangeDemo（受控 + 状态显示）。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { SegmentedControl, Text } from '@timeui/react';

type Range = '1d' | '7d' | '1m' | '1y' | 'all';

const LABELS: Record<Range, string> = {
  '1d': 'past day',
  '7d': 'past week',
  '1m': 'past month',
  '1y': 'past year',
  all: 'all time',
};

export function SegmentedControlRangeDemo() {
  const [range, setRange] = useState<Range>('1d');
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
      `}
    >
      <SegmentedControl<Range>
        aria-label="Date range"
        value={range}
        onChange={(v: Range) => setRange(v)}
        options={[
          { value: '1d', label: '1D' },
          { value: '7d', label: '7D' },
          { value: '1m', label: '1M' },
          { value: '1y', label: '1Y' },
          { value: 'all', label: 'All' },
        ]}
      />
      <Text size="sm" muted>
        Showing {LABELS[range]}.
      </Text>
    </div>
  );
}
