/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 文档站 MDX 示例：StatCard delta 三态并排 + 按钮切换数据让 arrow tick 动画重播。
 */

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { StatCard, Button, Flex, Stack } from '@/components/timeui-client';

interface Snapshot {
  mrr: { value: string; delta: string; dir: 'up' | 'down' | 'flat' };
  churn: { value: string; delta: string; dir: 'up' | 'down' | 'flat' };
  nps: { value: string; delta: string; dir: 'up' | 'down' | 'flat' };
}

const SNAPSHOTS: Snapshot[] = [
  {
    mrr: { value: '$128,402', delta: '+12.4%', dir: 'up' },
    churn: { value: '2.1%', delta: '-0.4pp', dir: 'down' },
    nps: { value: '54', delta: '0', dir: 'flat' },
  },
  {
    mrr: { value: '$134,920', delta: '+5.1%', dir: 'up' },
    churn: { value: '2.6%', delta: '+0.5pp', dir: 'up' },
    nps: { value: '49', delta: '-5', dir: 'down' },
  },
];

export function StatCardDeltaDemo() {
  const [idx, setIdx] = useState(0);
  const snap = SNAPSHOTS[idx];
  const params = useParams<{ locale?: string }>();
  const isZh = params?.locale !== 'en';

  return (
    <Stack spacing={12}>
      <Flex gap={12} wrap="wrap" align="stretch">
        <div style={{ minWidth: 180, flex: 1 }}>
          <StatCard
            label={isZh ? '月度经常性收入' : 'MRR'}
            value={snap.mrr.value}
            delta={{ value: snap.mrr.delta, direction: snap.mrr.dir }}
          />
        </div>
        <div style={{ minWidth: 180, flex: 1 }}>
          <StatCard
            label={isZh ? '客户流失率' : 'Churn rate'}
            value={snap.churn.value}
            delta={{ value: snap.churn.delta, direction: snap.churn.dir }}
          />
        </div>
        <div style={{ minWidth: 180, flex: 1 }}>
          <StatCard
            label={isZh ? 'NPS' : 'NPS'}
            value={snap.nps.value}
            delta={{ value: snap.nps.delta, direction: snap.nps.dir }}
          />
        </div>
      </Flex>
      <Flex gap={8}>
        <Button
          size="sm"
          variant="bordered"
          onClick={() => setIdx((i) => (i + 1) % SNAPSHOTS.length)}
        >
          {isZh ? '切换快照触发 arrow tick' : 'Toggle snapshot to replay tick'}
        </Button>
      </Flex>
    </Stack>
  );
}
