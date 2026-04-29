/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-29
 * @description 受控 MultiSelect 文档示例：演示 value + onChange 双向绑定，
 *              并实时把当前 value 数组用 monospace 文本回显，便于读者直观看到
 *              受控状态如何流动。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { MultiSelect, Stack } from '@timeui/react';

const FRAMEWORKS = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
  { value: 'angular', label: 'Angular', isDisabled: true },
];

export function MultiSelectControlledDemo() {
  const [value, setValue] = useState<string[]>(['react']);
  return (
    <div
      css={css`
        width: min(420px, 100%);
        display: flex;
        flex-direction: column;
        gap: 12px;
      `}
    >
      <Stack spacing={12}>
        <MultiSelect
          aria-label="Controlled frameworks"
          value={value}
          onChange={setValue}
          showSelectAllInToolbar
          items={FRAMEWORKS}
          isFullWidth
        />
        <code
          css={css`
            display: block;
            font-family: var(--docs-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
            font-size: 12px;
            color: var(--c-text-tertiary);
            padding: 8px 12px;
            border: 1px dashed var(--c-hairline);
            border-radius: 8px;
            background: var(--c-bg-secondary);
            white-space: pre-wrap;
            word-break: break-word;
          `}
        >
          value = {JSON.stringify(value)}
        </code>
      </Stack>
    </div>
  );
}
