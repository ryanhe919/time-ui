/**
 * @author Ryan He
 * @date 2026-07-25
 * @description 实现文档站 MDX 示例组件 ModalDraggableDemo（演示拖动标题栏 + 八向缩放 + rect 回调）。
 */

'use client';

import { useState } from 'react';
import { Button, Modal, Flex } from '@/components/timeui-client';
import type { ModalRect } from '@timeui/react';

export function ModalDraggableDemo() {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<ModalRect | null>(null);

  return (
    <>
      <Flex gap={8} align="center">
        <Button variant="solid" color="primary" onClick={() => setOpen(true)}>
          Open draggable modal
        </Button>
        {rect ? (
          <code style={{ fontSize: 12, opacity: 0.7 }}>
            x {rect.x} · y {rect.y} · {rect.width} × {rect.height}
          </code>
        ) : null}
      </Flex>

      <Modal
        isOpen={open}
        onOpenChange={setOpen}
        title="Drag me by the header"
        isDraggable
        isResizable
        onRectChange={(next) => setRect(next)}
        footer={
          <Button variant="solid" color="primary" onClick={() => setOpen(false)}>
            Done
          </Button>
        }
      >
        Drag the title bar to move this dialog, or drag any edge / corner to resize it. Keyboard
        users can move it with Ctrl/⌘ + arrow keys and resize it with Ctrl/⌘ + Shift + arrow keys.
        The panel is always kept inside the viewport.
      </Modal>
    </>
  );
}
