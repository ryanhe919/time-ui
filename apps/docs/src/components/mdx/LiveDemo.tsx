/** @jsxImportSource @emotion/react */
'use client';

import { useState, type ReactNode } from 'react';
import { css } from '@emotion/react';
import { CodeBlock } from '@timeui/react/code-block';

export interface LiveDemoProps {
  children: ReactNode;
  code?: string;
  language?: string;
}

/**
 * Apple-flavored preview card. Pure white surface in light mode (off-white in
 * dark), generously rounded corners, soft drop shadow, no grid pattern. Lets
 * the colorful TimeUI components inside become the visual focus.
 */
export function LiveDemo({ children, code, language = 'tsx' }: LiveDemoProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div
      css={css`
        margin: 32px 0;
        border-radius: var(--r-card);
        overflow: hidden;
        background: var(--c-bg);
        border: 1px solid var(--c-hairline);
        box-shadow: var(--c-shadow-card);
        font-family: var(--docs-sans);
      `}
    >
      <div
        css={css`
          padding: 56px 32px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 16px;
          min-height: 160px;
          background: var(--c-bg-secondary);
        `}
      >
        {children}
      </div>
      {code && (
        <>
          <div
            css={css`
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 10px 16px;
              border-top: 1px solid var(--c-hairline);
              background: var(--c-bg);
            `}
          >
            <span
              css={css`
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                color: var(--c-text-tertiary);
              `}
            >
              Preview
            </span>
            <button
              type="button"
              onClick={() => setShowCode((v) => !v)}
              css={css`
                font-family: var(--docs-sans);
                font-size: 12px;
                font-weight: 500;
                color: var(--c-accent);
                background: transparent;
                border: none;
                padding: 4px 10px;
                cursor: pointer;
                border-radius: var(--r-cta);
                transition:
                  background 200ms,
                  color 200ms;
                &:hover {
                  background: rgba(0, 113, 227, 0.08);
                  color: var(--c-accent-hover);
                }
              `}
            >
              {showCode ? 'Hide code' : 'Show code'}
            </button>
          </div>
          {showCode && (
            <div
              css={css`
                border-top: 1px solid var(--c-hairline);
              `}
            >
              <CodeBlock code={code.trim()} language={language} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
