/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 文档站 MDX 示例：StatCard 整卡可按（href / onPress），演示 isHoverable 与链接语义。
 */

'use client';

import { useParams } from 'next/navigation';
import { StatCard, Flex } from '@/components/timeui-client';

export function StatCardPressableDemo() {
  const params = useParams<{ locale?: string }>();
  const isZh = params?.locale !== 'en';

  return (
    <Flex gap={12} wrap="wrap" align="stretch">
      <div style={{ minWidth: 200, flex: 1 }}>
        <StatCard
          isHoverable
          href="#revenue"
          aria-label={isZh ? '跳转到营收详情' : 'Go to revenue details'}
          label={isZh ? '营收' : 'Revenue'}
          value="$1.2M"
          description={isZh ? '点击查看详情' : 'Click to drill down'}
          delta={{ value: '+14%', direction: 'up' }}
          accentBar="start"
          color="primary"
        />
      </div>
      <div style={{ minWidth: 200, flex: 1 }}>
        <StatCard
          isPressable
          isHoverable
          onPress={() => {
            console.log('stat pressed');
          }}
          label={isZh ? '订单量' : 'Orders'}
          value="3,248"
          description={isZh ? '按下触发 onPress' : 'Press fires onPress'}
          delta={{ value: '-2.1%', direction: 'down' }}
          variant="elevated"
        />
      </div>
    </Flex>
  );
}
