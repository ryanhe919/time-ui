/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-26
 * @description 文档站 MDX 示例组件 CodeEditorBasicDemo（基础受控用法）。
 */

'use client';

import { useState } from 'react';
import { CodeEditor } from '@timeui/react/code-editor';

export function CodeEditorBasicDemo() {
  const [code, setCode] = useState(`function greet(name: string) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`);

  return (
    <div data-livedemo="custom" data-live-preview="">
      <CodeEditor
        value={code}
        onChange={setCode}
        language="typescript"
        aria-label="Basic code editor demo"
      />
    </div>
  );
}
