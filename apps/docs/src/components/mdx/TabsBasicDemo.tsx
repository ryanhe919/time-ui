/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现文档站 MDX 示例组件 TabsBasicDemo（数据驱动 items + panel 内容切换）。
 */

'use client';

import { css } from '@emotion/react';
import { Tabs } from '@/components/timeui-client';

const PANEL: ReturnType<typeof css> = css`
  font-size: 14px;
  line-height: 1.55;
  color: var(--c-text-primary);
  padding: 12px 0;
`;

export function TabsBasicDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <Tabs
        aria-label="Account settings"
        defaultSelectedKey="profile"
        items={[
          {
            key: 'profile',
            label: 'Profile',
            content: (
              <div css={PANEL}>
                Update your display name, avatar and short bio. Changes are visible to your team
                immediately.
              </div>
            ),
          },
          {
            key: 'security',
            label: 'Security',
            content: (
              <div css={PANEL}>
                Manage two-factor authentication, active sessions and your recovery codes.
              </div>
            ),
          },
          {
            key: 'billing',
            label: 'Billing',
            content: (
              <div css={PANEL}>
                Review invoices, swap payment methods and download tax receipts.
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
