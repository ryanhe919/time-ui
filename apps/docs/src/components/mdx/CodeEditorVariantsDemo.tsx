/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-26
 * @description 文档站 MDX 示例组件 CodeEditorVariantsDemo（三种 variant 对比展示）。
 */

'use client';

import { CodeEditor } from '@timeui/react/code-editor';

const SAMPLE = `const x = 42;`;

export function CodeEditorVariantsDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CodeEditor value={SAMPLE} variant="bordered" aria-label="Bordered variant" toolbar={false} />
      <CodeEditor value={SAMPLE} variant="faded" aria-label="Faded variant" toolbar={false} />
      <CodeEditor value={SAMPLE} variant="flat" aria-label="Flat variant" toolbar={false} />
    </div>
  );
}
