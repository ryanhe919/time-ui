/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-26
 * @description 实现文档站 MDX 示例组件 RichTextEditorToolbarDemo
 *              （SegmentedControl 切换 toolbar preset + 自定义数组示例）。
 */

'use client';

import { useState } from 'react';
import { css, useTheme } from '@emotion/react';
import type { Theme } from '@emotion/react';
import { SegmentedControl } from '@timeui/react';
import { RichTextEditor } from '@timeui/react/rich-text-editor';
import type { ToolbarItem, ToolbarPreset } from '@timeui/react/rich-text-editor';

const PRESET_OPTIONS: { value: ToolbarPreset; label: string }[] = [
  { value: 'minimal', label: 'minimal' },
  { value: 'basic', label: 'basic' },
  { value: 'full', label: 'full' },
];

const PRESET_HINT: Record<ToolbarPreset, string> = {
  minimal: 'bold / italic / underline only',
  basic: 'inline marks + headings + lists + link',
  full: 'everything — inline, blocks, history, clear',
};

const CUSTOM_ITEMS: ToolbarItem[] = [
  'bold',
  'italic',
  'separator',
  'h1',
  'h2',
  'separator',
  'link',
];

const SAMPLE_HTML =
  '<h2>Toolbar presets</h2><p>Switch the segmented control to compare each preset side by side.</p><ul><li>Switch to <strong>full</strong> to unlock blockquote, code block and history.</li></ul>';

const captionCss = (theme: Theme) => css`
  font-family: ${theme.typography.fontFamily.sans};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.semibold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${theme.colors.text.muted};
`;

const hintCss = (theme: Theme) => css`
  font-family: ${theme.typography.fontFamily.mono};
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.secondary};
`;

const groupCss = (theme: Theme) => css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
  width: 100%;
`;

export function RichTextEditorToolbarDemo() {
  const theme = useTheme();
  const [preset, setPreset] = useState<ToolbarPreset>('basic');

  return (
    <div
      css={css`
        ${groupCss(theme)};
        gap: ${theme.spacing[6]};
        width: min(720px, 100%);
      `}
    >
      <div css={groupCss(theme)}>
        <div
          css={css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: ${theme.spacing[3]};
            flex-wrap: wrap;
          `}
        >
          <SegmentedControl<ToolbarPreset>
            aria-label="Toolbar preset"
            value={preset}
            onChange={(v: ToolbarPreset) => setPreset(v)}
            options={PRESET_OPTIONS}
          />
          <span css={hintCss(theme)}>{PRESET_HINT[preset]}</span>
        </div>
        <RichTextEditor
          aria-label={`Editor with ${preset} toolbar`}
          defaultValue={SAMPLE_HTML}
          toolbar={preset}
        />
      </div>

      <div css={groupCss(theme)}>
        <span css={captionCss(theme)}>Custom toolbar (array)</span>
        <span css={hintCss(theme)}>
          {`toolbar={['bold', 'italic', 'separator', 'h1', 'h2', 'separator', 'link']}`}
        </span>
        <RichTextEditor
          aria-label="Editor with custom toolbar items"
          defaultValue="<p>Only the items you list are rendered — perfect for trimmed surfaces.</p>"
          toolbar={CUSTOM_ITEMS}
        />
      </div>
    </div>
  );
}
