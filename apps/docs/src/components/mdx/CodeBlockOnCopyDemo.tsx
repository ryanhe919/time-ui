/** @jsxImportSource @emotion/react */
'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { CodeBlock } from '@timeui/react/code-block';

export interface CodeBlockOnCopyDemoProps {
  hint?: string;
}

/**
 * Wraps CodeBlock with an onCopy handler in client scope — MDX pages are RSC,
 * so function props can't be passed inline. This demo shows the callback firing
 * by surfacing the copied length below the block.
 */
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
