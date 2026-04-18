/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 文档站 MDX 示例：Card isPressable + onPress + 计数器，演示键盘 / 鼠标统一走 onPress。
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardBody, CardFooter, Text, Button } from '@/components/timeui-client';

export function CardPressableDemo() {
  const [count, setCount] = useState(0);
  const params = useParams<{ locale?: string }>();
  const isZh = params?.locale !== 'en';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(340px, 100%)' }}>
      <Card
        isPressable
        color="primary"
        onPress={() => setCount((c) => c + 1)}
        aria-label={isZh ? '可按卡片，点击增加计数' : 'Pressable card, click to increment count'}
      >
        <CardHeader
          title={isZh ? '可按卡片' : 'Pressable card'}
          subtitle={
            isZh ? '点击 / Enter / Space 触发 onPress' : 'Click / Enter / Space fires onPress'
          }
        />
        <CardBody>
          <Text size="sm" color="secondary">
            {isZh ? '已触发次数' : 'Press count'}: <strong>{count}</strong>
          </Text>
        </CardBody>
      </Card>
      <Card isHoverable>
        <CardHeader
          title={isZh ? '仅 hover' : 'Hoverable only'}
          subtitle={
            isZh
              ? 'isHoverable 只加视觉，没有键盘语义'
              : 'isHoverable is visual only, no keyboard semantics'
          }
        />
        <CardFooter justify="end">
          <Button size="sm" variant="bordered" onClick={() => setCount(0)}>
            {isZh ? '重置计数' : 'Reset'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
