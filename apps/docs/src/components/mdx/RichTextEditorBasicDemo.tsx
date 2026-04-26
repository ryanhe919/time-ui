/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-26
 * @description 实现文档站 MDX 示例组件 RichTextEditorBasicDemo（受控 + 实时回显 HTML 长度）。
 */

'use client';

import { useState } from 'react';
import { css, useTheme } from '@emotion/react';
import { RichTextEditor } from '@timeui/react/rich-text-editor';

const INITIAL_HTML =
  '<p>Welcome to <strong>TimeUI</strong> RichTextEditor — try <em>formatting</em> some text.</p>';

export function RichTextEditorBasicDemo() {
  const theme = useTheme();
  const [html, setHtml] = useState(INITIAL_HTML);

  return (
    <div
      css={css`
        width: min(640px, 100%);
        display: flex;
        flex-direction: column;
        gap: ${theme.spacing[3]};
      `}
    >
      <RichTextEditor
        aria-label="Basic rich text editor"
        value={html}
        onChange={setHtml}
        placeholder="Start writing…"
      />
      <div
        css={css`
          align-self: flex-end;
          font-family: ${theme.typography.fontFamily.mono};
          font-size: ${theme.typography.fontSize.xs};
          color: ${theme.colors.text.muted};
          padding: ${theme.spacing[1]} ${theme.spacing[2]};
          border: ${theme.borders.width.thin} dashed ${theme.colors.border.subtle};
          border-radius: ${theme.componentRadius.sm};
          background: ${theme.colors.bg.muted};
        `}
      >
        {html.length} chars
      </div>
    </div>
  );
}
