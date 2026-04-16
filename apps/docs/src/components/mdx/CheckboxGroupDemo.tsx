/** @jsxImportSource @emotion/react */
'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { Checkbox, CheckboxGroup } from '@timeui/react';

const OPTIONS = [
  { value: 'ts', label: 'TypeScript' },
  { value: 'react', label: 'React' },
  { value: 'emotion', label: 'Emotion' },
  { value: 'storybook', label: 'Storybook' },
];

export function CheckboxGroupDemo() {
  const [value, setValue] = useState<string[]>(['ts', 'react']);

  return (
    <div
      css={css`
        width: min(360px, 100%);
        display: flex;
        flex-direction: column;
        gap: 12px;
      `}
    >
      <CheckboxGroup
        label="你用过哪些技术？"
        description="可多选。下面的数组会实时更新。"
        value={value}
        onChange={setValue}
      >
        {OPTIONS.map((o) => (
          <Checkbox key={o.value} value={o.value}>
            {o.label}
          </Checkbox>
        ))}
      </CheckboxGroup>
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
        value = {JSON.stringify(value)}
      </div>
    </div>
  );
}
