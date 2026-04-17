/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 ToastBasicDemo（4 个 status 触发按钮 + 一个带 action 的）。
 */

'use client';

import { ToastProvider, useToast, Button } from '@/components/timeui-client';

function Inner() {
  const toast = useToast();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Button
        variant="bordered"
        size="sm"
        onClick={() =>
          toast.show({
            status: 'success',
            title: 'Saved successfully',
            description: 'Your changes are now live.',
          })
        }
      >
        success
      </Button>
      <Button
        variant="bordered"
        size="sm"
        onClick={() =>
          toast.show({
            status: 'danger',
            title: 'Could not save',
            description: 'Check your connection and retry.',
          })
        }
      >
        error
      </Button>
      <Button
        variant="bordered"
        size="sm"
        onClick={() =>
          toast.show({
            status: 'warning',
            title: 'Storage almost full',
            description: '92% used — upgrade your plan.',
          })
        }
      >
        warning
      </Button>
      <Button
        variant="bordered"
        size="sm"
        onClick={() =>
          toast.show({
            status: 'info',
            title: 'A new comment was posted',
            description: '"Looks good to me!" — Ada',
          })
        }
      >
        info
      </Button>
      <Button
        variant="bordered"
        size="sm"
        onClick={() =>
          toast.show({
            status: 'info',
            title: 'Item moved to Trash',
            action: { label: 'Undo', onPress: () => toast.success('Restored') },
          })
        }
      >
        with action
      </Button>
    </div>
  );
}

export function ToastBasicDemo() {
  return (
    <ToastProvider placement="top-right">
      <Inner />
    </ToastProvider>
  );
}
