/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-26
 * @description 实现文档站 MDX 示例组件 RichTextEditorVariantsDemo
 *              （三个 variant 并排 + 三档 size 并排）。
 */

'use client';

import { css, useTheme } from '@emotion/react';
import type { Theme } from '@emotion/react';
import { RichTextEditor } from '@timeui/react/rich-text-editor';
import type { RichTextEditorSize, RichTextEditorVariant } from '@timeui/react/rich-text-editor';

const SAMPLE_HTML = '<p>The quick <strong>brown</strong> fox jumps over the <em>lazy</em> dog.</p>';

const VARIANTS: { variant: RichTextEditorVariant; label: string }[] = [
  { variant: 'flat', label: 'flat' },
  { variant: 'bordered', label: 'bordered (default)' },
  { variant: 'faded', label: 'faded' },
];

const SIZES: { size: RichTextEditorSize; label: string }[] = [
  { size: 'sm', label: 'sm' },
  { size: 'md', label: 'md (default)' },
  { size: 'lg', label: 'lg' },
];

const captionCss = (theme: Theme) => css`
  font-family: ${theme.typography.fontFamily.sans};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.semibold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${theme.colors.text.muted};
`;

const groupCss = (theme: Theme) => css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  width: 100%;
`;

const rowCss = (theme: Theme) => css`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${theme.spacing[4]};
  width: 100%;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const cellCss = (theme: Theme) => css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
  min-width: 0;
`;

export function RichTextEditorVariantsDemo() {
  const theme = useTheme();
  return (
    <div
      css={css`
        ${groupCss(theme)};
        gap: ${theme.spacing[6]};
      `}
    >
      <div css={groupCss(theme)}>
        <span css={captionCss(theme)}>Variants</span>
        <div css={rowCss(theme)}>
          {VARIANTS.map(({ variant, label }) => (
            <div key={variant} css={cellCss(theme)}>
              <span css={captionCss(theme)}>{label}</span>
              <RichTextEditor
                aria-label={`${variant} variant editor`}
                variant={variant}
                defaultValue={SAMPLE_HTML}
                toolbar="minimal"
                minHeight={120}
              />
            </div>
          ))}
        </div>
      </div>

      <div css={groupCss(theme)}>
        <span css={captionCss(theme)}>Sizes</span>
        <div css={rowCss(theme)}>
          {SIZES.map(({ size, label }) => (
            <div key={size} css={cellCss(theme)}>
              <span css={captionCss(theme)}>{label}</span>
              <RichTextEditor
                aria-label={`${size} size editor`}
                size={size}
                defaultValue={SAMPLE_HTML}
                toolbar="minimal"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
