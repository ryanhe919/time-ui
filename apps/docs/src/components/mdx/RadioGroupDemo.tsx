/** @jsxImportSource @emotion/react */
'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { Radio, RadioGroup } from '@timeui/react';

export function RadioGroupDemo() {
  const [value, setValue] = useState('standard');

  return (
    <div
      css={css`
        width: min(420px, 100%);
        display: flex;
        flex-direction: column;
        gap: 12px;
      `}
    >
      <RadioGroup
        label="选择配送方式"
        description="下单后会收到邮件确认。"
        value={value}
        onChange={setValue}
      >
        <Radio value="standard" description="3-5 个工作日送达，免费。">
          标准配送
        </Radio>
        <Radio value="express" description="次日送达，收费 ¥20。">
          次日达
        </Radio>
        <Radio value="pickup" description="到最近的自提点自取。">
          门店自提
        </Radio>
      </RadioGroup>
      <div
        css={css`
          font-family: var(--docs-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
          font-size: 12px;
          color: var(--c-text-tertiary);
          padding: 8px 12px;
          border: 1px dashed var(--c-hairline);
          border-radius: 8px;
          background: var(--c-bg-secondary);
        `}
      >
        value = &quot;{value}&quot;
      </div>
    </div>
  );
}
