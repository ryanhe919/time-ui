/**
 * @author Ryan He
 * @date 2026-04-17
 * @description Demo: Tag 的可关闭与可点击交互 —— 必须在 Client Component 内定义函数 prop。
 */

'use client';

import { Tag, Flex } from '@/components/timeui-client';

export function TagClosableDemo() {
  return (
    <Flex gap={8} align="center">
      <Tag isClosable onClose={() => {}}>
        React
      </Tag>
      <Tag isClosable color="primary" onClose={() => {}}>
        TypeScript
      </Tag>
    </Flex>
  );
}

export function TagInteractiveDemo() {
  return (
    <Tag isInteractive onPress={() => {}}>
      Filter: React
    </Tag>
  );
}
