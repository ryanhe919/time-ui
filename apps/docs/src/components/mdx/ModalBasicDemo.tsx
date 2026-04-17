/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 ModalBasicDemo（演示打开 / 关闭 + title + footer）。
 */

'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/timeui-client';

export function ModalBasicDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="solid" color="primary" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal
        isOpen={open}
        onOpenChange={setOpen}
        title="Update available"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Later
            </Button>
            <Button variant="solid" color="primary" onClick={() => setOpen(false)}>
              Install
            </Button>
          </>
        }
      >
        TimeUI 1.4 is ready to install. The update introduces revamped Modal, Popover, and Tooltip
        primitives. Do you want to install it now?
      </Modal>
    </>
  );
}
