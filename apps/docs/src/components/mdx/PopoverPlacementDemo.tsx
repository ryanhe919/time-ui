/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 PopoverPlacementDemo（4×3 网格演示 12 种 placement）。
 */

'use client';

import { Popover, Button } from '@/components/timeui-client';
import type { ComponentProps } from 'react';

type Placement = NonNullable<ComponentProps<typeof Popover>['placement']>;

const PLACEMENTS: Placement[] = [
  'top-start',
  'top',
  'top-end',
  'right-start',
  'right',
  'right-end',
  'bottom-start',
  'bottom',
  'bottom-end',
  'left-start',
  'left',
  'left-end',
];

export function PopoverPlacementDemo() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 12,
        width: 'min(420px, 100%)',
      }}
    >
      {PLACEMENTS.map((p) => (
        <Popover
          key={p}
          placement={p}
          trigger="click"
          anchor={
            <Button variant="bordered" size="sm" isFullWidth>
              {p}
            </Button>
          }
        >
          <div style={{ minWidth: 140 }}>placement = {p}</div>
        </Popover>
      ))}
    </div>
  );
}
