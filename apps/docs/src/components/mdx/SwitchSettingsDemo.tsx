/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 MDX 示例组件 SwitchSettingsDemo。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { Switch } from '@timeui/react';

interface Setting {
  key: string;
  label: string;
  hint: string;
}

const SETTINGS: Setting[] = [
  { key: 'notifications', label: '启用通知', hint: '新消息会推送到系统通知中心。' },
  { key: 'autoSync', label: '自动同步', hint: 'WiFi 下后台同步到云端。' },
  { key: 'beta', label: '加入 Beta 通道', hint: '提前体验实验性功能，可能有 bug。' },
];

export function SwitchSettingsDemo() {
  const [state, setState] = useState<Record<string, boolean>>({
    notifications: true,
    autoSync: true,
    beta: false,
  });

  return (
    <div
      css={css`
        width: min(480px, 100%);
        border: 1px solid var(--c-hairline);
        border-radius: 12px;
        background: var(--c-bg);
        overflow: hidden;
      `}
    >
      {SETTINGS.map((s, i) => (
        <label
          key={s.key}
          css={css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 14px 16px;
            border-top: ${i === 0 ? 'none' : '1px solid var(--c-hairline)'};
            cursor: pointer;
          `}
        >
          <span
            css={css`
              display: flex;
              flex-direction: column;
              gap: 2px;
            `}
          >
            <span
              css={css`
                font-size: 14px;
                font-weight: 500;
                color: var(--c-text);
              `}
            >
              {s.label}
            </span>
            <span
              css={css`
                font-size: 12px;
                color: var(--c-text-tertiary);
              `}
            >
              {s.hint}
            </span>
          </span>
          <Switch
            aria-label={s.label}
            isSelected={state[s.key]}
            onChange={(checked) => setState((prev) => ({ ...prev, [s.key]: checked }))}
          />
        </label>
      ))}
    </div>
  );
}
