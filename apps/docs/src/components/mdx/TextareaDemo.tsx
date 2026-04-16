/** @jsxImportSource @emotion/react */
'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { Textarea } from '@timeui/react';

/**
 * Textarea 的受控 + auto-size + showCount 演示。
 * 绑定一个 state，实时反映字符数并触发 warning/danger 色切换。
 */
export function TextareaDemo() {
  const [value, setValue] = useState('');

  return (
    <div
      css={css`
        width: min(520px, 100%);
      `}
    >
      <Textarea
        label="反馈 / Feedback"
        placeholder="说说你的想法…（最多 120 字）"
        description="按 Enter 换行；输入超过 120 字会标红。"
        value={value}
        onChange={setValue}
        minRows={3}
        maxRows={8}
        maxLength={120}
        showCount
        fullWidth
      />
    </div>
  );
}
