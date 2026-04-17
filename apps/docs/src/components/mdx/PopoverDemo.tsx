/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 PopoverDemo（演示 click 触发 + header + footer）。
 */

'use client';

import { useState } from 'react';
import { Popover, Button } from '@/components/timeui-client';

export function PopoverDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Popover
      isOpen={open}
      onOpenChange={setOpen}
      placement="bottom"
      header="Share this page"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="solid" color="primary" size="sm" onClick={() => setOpen(false)}>
            Copy link
          </Button>
        </div>
      }
      anchor={<Button variant="solid">Open popover</Button>}
    >
      <div style={{ display: 'grid', gap: 6 }}>
        <span>Anyone with the link can view this page.</span>
        <span style={{ color: 'var(--c-text-tertiary, #888)' }}>
          Press Esc or click outside to dismiss.
        </span>
      </div>
    </Popover>
  );
}
