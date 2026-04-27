/**
 * @author Ryan He
 * @description CodeEditor 组件的类型定义。
 */

import type { Extension } from '@codemirror/state';

export type CodeEditorLanguage = 'javascript' | 'typescript' | 'python' | 'css' | 'html' | 'json';
export type CodeEditorSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CodeEditorVariant = 'flat' | 'bordered' | 'faded';

export interface AISuggestion {
  text: string;
  label?: string;
  detail?: string;
}

export interface ToolbarConfig {
  showCopy?: boolean;
  showLineWrap?: boolean;
  showLanguageSelect?: boolean;
  showLineNumbers?: boolean;
  showFullscreen?: boolean;
}

export interface ToolbarLabels {
  toolbarLabel: string;
  copy: string;
  copied: string;
  lineWrap: string;
  lineNumbers: string;
  fullscreen: string;
  exitFullscreen: string;
  language: string;
  aiSuggest: string;
}

export interface CodeEditorProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  language?: CodeEditorLanguage;
  onLanguageChange?: (language: CodeEditorLanguage) => void;
  size?: CodeEditorSize;
  variant?: CodeEditorVariant;
  placeholder?: string;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  showLineNumbers?: boolean;
  onShowLineNumbersChange?: (showLineNumbers: boolean) => void;
  lineWrap?: boolean;
  onLineWrapChange?: (lineWrap: boolean) => void;
  toolbar?: boolean | ToolbarConfig;
  minHeight?: string | number;
  maxHeight?: string | number;
  extensions?: Extension[];
  onAISuggest?: (code: string, position: number) => Promise<AISuggestion[]>;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}
