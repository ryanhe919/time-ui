/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 MDX 示例组件 SelectDemo。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { Select } from '@timeui/react';

const FRAMEWORKS = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
  { value: 'angular', label: 'Angular', isDisabled: true },
];

export function SelectDemo() {
  const [value, setValue] = useState('react');

  return (
    <div
      css={css`
        width: min(360px, 100%);
        display: flex;
        flex-direction: column;
        gap: 12px;
      `}
    >
      <Select
        label="选择你的前端框架"
        description="Angular 暂时不受支持。"
        placeholder="请选择…"
        items={FRAMEWORKS}
        value={value}
        onChange={setValue}
        fullWidth
      />
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
