/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 MDX 示例组件 CodeBlockOnCopyDemo。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { CodeBlock } from '@timeui/react/code-block';

export interface CodeBlockOnCopyDemoProps {
  hint?: string;
}

export function CodeBlockOnCopyDemo({ hint = 'copied' }: CodeBlockOnCopyDemoProps) {
  const [last, setLast] = useState<number | null>(null);

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      `}
    >
      <CodeBlock
        code={`git clone git@github.com:timeui/timeui.git`}
        onCopy={(code) => setLast(code.length)}
      />
      <span
        css={css`
          font-size: 12px;
          color: var(--c-text-tertiary);
          min-height: 16px;
          font-family: var(--docs-sans);
        `}
        aria-live="polite"
      >
        {last === null ? '' : `✓ ${hint} ${last} chars`}
      </span>
    </div>
  );
}
