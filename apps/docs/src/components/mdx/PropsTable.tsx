/** @jsxImportSource @emotion/react */
'use client';

import { Code } from '@timeui/react';
import { css } from '@emotion/react';

export interface PropDef {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

export interface PropsTableProps {
  props: PropDef[];
}

/** Apple-style props reference: hairline-divided rows, generous breathing. */
export function PropsTable({ props }: PropsTableProps) {
  return (
    <div
      css={css`
        margin: 32px 0;
        border-top: 1px solid var(--c-hairline);
        border-bottom: 1px solid var(--c-hairline);
        font-family: var(--docs-sans);
      `}
    >
      <div
        css={css`
          display: grid;
          grid-template-columns: minmax(120px, auto) minmax(140px, 1.4fr) minmax(80px, auto) 1.8fr;
          gap: 20px;
          padding: 14px 4px;
          border-bottom: 1px solid var(--c-hairline);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--c-text-tertiary);
        `}
      >
        <div>Name</div>
        <div>Type</div>
        <div>Default</div>
        <div>Description</div>
      </div>

      {props.map((p, i) => (
        <div
          key={p.name}
          css={css`
            display: grid;
            grid-template-columns: minmax(120px, auto) minmax(140px, 1.4fr) minmax(80px, auto) 1.8fr;
            gap: 20px;
            padding: 18px 4px;
            align-items: start;
            border-top: ${i === 0 ? 'none' : '1px solid var(--c-hairline)'};
            font-size: 14px;
          `}
        >
          <div>
            <Code>{p.name}</Code>
            {p.required && (
              <span
                css={css`
                  display: inline-block;
                  margin-left: 8px;
                  font-size: 10px;
                  font-weight: 600;
                  padding: 2px 8px;
                  border-radius: var(--r-cta);
                  background: rgba(0, 113, 227, 0.1);
                  color: var(--c-accent);
                  letter-spacing: 0.02em;
                  text-transform: uppercase;
                `}
              >
                Required
              </span>
            )}
          </div>
          <div
            css={css`
              word-break: break-word;
            `}
          >
            <Code>{p.type}</Code>
          </div>
          <div>
            {p.default ? (
              <Code>{p.default}</Code>
            ) : (
              <span
                css={css`
                  color: var(--c-text-tertiary);
                  font-family: var(--docs-mono);
                `}
              >
                —
              </span>
            )}
          </div>
          <div
            css={css`
              color: var(--c-text-secondary);
              line-height: 1.5;
              font-size: 14px;
            `}
          >
            {p.description}
          </div>
        </div>
      ))}
    </div>
  );
}
