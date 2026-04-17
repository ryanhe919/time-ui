/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 DrawerBasicDemo（4 个 placement 各一个按钮）。
 */

'use client';

import { useState } from 'react';
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader, Button } from '@/components/timeui-client';

type Placement = 'left' | 'right' | 'top' | 'bottom';

const PLACEMENTS: Placement[] = ['left', 'right', 'top', 'bottom'];

export function DrawerBasicDemo() {
  const [active, setActive] = useState<Placement | null>(null);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {PLACEMENTS.map((p) => (
          <Button key={p} variant="bordered" size="sm" onClick={() => setActive(p)}>
            placement = {p}
          </Button>
        ))}
      </div>
      <Drawer
        isOpen={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
        placement={active ?? 'right'}
        header={<DrawerHeader>Notifications</DrawerHeader>}
        footer={
          <DrawerFooter>
            <Button variant="ghost" onClick={() => setActive(null)}>
              Close
            </Button>
            <Button variant="solid" color="primary" onClick={() => setActive(null)}>
              Mark all as read
            </Button>
          </DrawerFooter>
        }
      >
        <DrawerBody>
          You have 3 new notifications. The drawer slides in from the {active ?? 'right'} edge,
          locks body scroll, and traps focus until dismissed.
        </DrawerBody>
      </Drawer>
    </>
  );
}
