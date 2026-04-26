/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-26
 * @description 文档站 MDX 示例组件 CodeEditorLanguagesDemo（6 种语言切换演示）。
 */

'use client';

import { useState } from 'react';
import { CodeEditor, type CodeEditorLanguage } from '@timeui/react/code-editor';

const SAMPLES: Record<CodeEditorLanguage, string> = {
  javascript: `const add = (a, b) => a + b;\nconsole.log(add(1, 2));`,
  typescript: `function add(a: number, b: number): number {\n  return a + b;\n}`,
  python: `def greet(name: str) -> str:\n    return f"Hello, {name}!"\n\nprint(greet("World"))`,
  css: `.button {\n  background: #3b82f6;\n  color: white;\n  padding: 8px 16px;\n}`,
  html: `<button class="button">\n  Click me\n</button>`,
  json: `{\n  "name": "timeui",\n  "version": "1.0.0"\n}`,
};

export function CodeEditorLanguagesDemo() {
  const [language, setLanguage] = useState<CodeEditorLanguage>('typescript');
  return (
    <CodeEditor
      value={SAMPLES[language]}
      language={language}
      toolbar={{ showLanguageSelect: true }}
      aria-label="Language demo"
    />
  );
}
