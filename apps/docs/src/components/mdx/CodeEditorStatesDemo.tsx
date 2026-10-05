/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-26
 * @description 文档站 MDX 示例组件 CodeEditorStatesDemo（disabled / readOnly / invalid 状态展示）。
 */

'use client';

import { CodeEditor } from '@timeui/react/code-editor';

const SAMPLE = `const x = 42;`;

export function CodeEditorStatesDemo() {
  return (
    <div
      data-livedemo="custom"
      data-live-preview=""
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <CodeEditor value={SAMPLE} isDisabled aria-label="Disabled" />
      <CodeEditor value={SAMPLE} isReadOnly aria-label="Read only" />
      <CodeEditor value={SAMPLE} isInvalid aria-label="Invalid" />
    </div>
  );
}
