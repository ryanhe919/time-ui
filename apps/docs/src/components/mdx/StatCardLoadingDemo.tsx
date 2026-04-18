/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 文档站 MDX 示例：StatCard isLoading 骨架态 + 切换按钮。
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { StatCard, Button, Stack } from '@/components/timeui-client';

export function StatCardLoadingDemo() {
  const [loading, setLoading] = useState(true);
  const params = useParams<{ locale?: string }>();
  const isZh = params?.locale !== 'en';

  return (
    <Stack spacing={12}>
      <div style={{ width: 'min(320px, 100%)' }}>
        <StatCard
          isLoading={loading}
          label={isZh ? '活跃用户' : 'Active users'}
          value="12,480"
          delta={{ value: '+8.2%', direction: 'up' }}
          icon={<span aria-hidden>U</span>}
        />
      </div>
      <Button size="sm" variant="bordered" onClick={() => setLoading((v) => !v)}>
        {loading ? (isZh ? '加载完成' : 'Finish loading') : isZh ? '再次加载' : 'Reload'}
      </Button>
    </Stack>
  );
}
