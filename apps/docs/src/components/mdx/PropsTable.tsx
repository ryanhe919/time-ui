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
      {/*
        Grid column recipe — each column carries a `minmax(N, Xfr)` so Type/
        Description can grow, but also `min-width: 0` on every cell below so
        their content is allowed to wrap *inside* the cell instead of forcing
        the track wider (default grid behavior is the opposite).
      */}
      <div
        css={css`
          display: grid;
          grid-template-columns:
            minmax(110px, 0.9fr) minmax(160px, 1.6fr)
            minmax(72px, 0.7fr) minmax(200px, 2.2fr);
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
            grid-template-columns:
              minmax(110px, 0.9fr) minmax(160px, 1.6fr)
              minmax(72px, 0.7fr) minmax(200px, 2.2fr);
            gap: 20px;
            padding: 18px 4px;
            align-items: start;
            border-top: ${i === 0 ? 'none' : '1px solid var(--c-hairline)'};
            font-size: 14px;
            /* Let every child cell shrink below its content-size so long
               union types wrap inside the Type column instead of bleeding
               over the next column. */
            & > * {
              min-width: 0;
            }
          `}
        >
          <div
            css={css`
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              gap: 8px;
            `}
          >
            <Code>{p.name}</Code>
            {p.required && (
              <span
                css={css`
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
              /* Inline code inherits the global wrap rules; ensure the
                 wrapper itself doesn't prop the grid track open. */
              overflow-wrap: anywhere;
              line-height: 1.65;
            `}
          >
            <Code>{p.type}</Code>
          </div>
          <div
            css={css`
              overflow-wrap: anywhere;
            `}
          >
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
              line-height: 1.55;
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
