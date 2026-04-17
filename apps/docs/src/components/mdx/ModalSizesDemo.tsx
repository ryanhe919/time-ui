/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 ModalSizesDemo（5 个按钮分别打开不同 size 的 Modal）。
 */

'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/timeui-client';
import type { ComponentProps } from 'react';

type Size = NonNullable<ComponentProps<typeof Modal>['size']>;

const SIZES: Size[] = ['sm', 'md', 'lg', 'xl', 'full'];

const WIDTHS: Record<Size, string> = {
  sm: '420px',
  md: '560px',
  lg: '720px',
  xl: '960px',
  full: 'calc(100vw − 32px)',
};

export function ModalSizesDemo() {
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
      <Modal
        isOpen={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
        size={active ?? 'md'}
        title={active ? `Modal · ${active}` : ''}
        footer={
          <Button variant="solid" color="primary" onClick={() => setActive(null)}>
            Got it
          </Button>
        }
      >
        Width is {active ? WIDTHS[active] : ''}. The panel is centered both horizontally and
        vertically; on small viewports it falls back to
        <code> calc(100vw − 32px)</code>.
      </Modal>
    </>
  );
}
