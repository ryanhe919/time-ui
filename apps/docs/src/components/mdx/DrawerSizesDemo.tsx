/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 DrawerSizesDemo（5 个尺寸切换）。
 */

'use client';

import { useState } from 'react';
import { Drawer, DrawerBody, DrawerHeader, Button } from '@/components/timeui-client';

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZES: Size[] = ['sm', 'md', 'lg', 'xl', 'full'];

export function DrawerSizesDemo() {
  const [active, setActive] = useState<Size | null>(null);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {SIZES.map((s) => (
          <Button key={s} variant="bordered" size="sm" onClick={() => setActive(s)}>
            size = {s}
          </Button>
        ))}
      </div>
      <Drawer
        isOpen={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
        size={active ?? 'md'}
        placement="right"
        header={<DrawerHeader>Drawer · {active ?? ''}</DrawerHeader>}
      >
        <DrawerBody>
          A {active ?? ''} drawer. Width tokens scale with the panel; on narrow viewports every size
          collapses to <code>calc(100vw − 32px)</code>.
        </DrawerBody>
      </Drawer>
    </>
  );
}
