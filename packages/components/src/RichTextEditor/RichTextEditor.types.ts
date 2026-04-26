/**
 * @author Ryan He
 * @description 定义 RichTextEditor 模块的 TypeScript 类型约束。
 */

import type { HTMLAttributes } from 'react';
import type { Editor, AnyExtension } from '@tiptap/react';

export type RichTextEditorSize = 'sm' | 'md' | 'lg';

export type RichTextEditorVariant = 'flat' | 'bordered' | 'faded';

export type ToolbarPreset = 'full' | 'basic' | 'minimal';

export type ToolbarItem =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'code'
  | 'codeBlock'
  | 'horizontalRule'
  | 'link'
  | 'clearFormat'
  | 'undo'
  | 'redo'
  | 'separator';

export interface RichTextEditorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  /** 受控 HTML 内容 */
  value?: string;
  /** 非受控初始 HTML 内容，默认 '' */
  defaultValue?: string;
  /** 文档变化时触发（受控 / 非受控均会触发） */
  onChange?: (html: string) => void;
  /** 空状态占位文字 */
  placeholder?: string;
  /** 尺寸，默认 'md' */
  size?: RichTextEditorSize;
  /** 外观，默认 'bordered' */
  variant?: RichTextEditorVariant;
  /** 是否禁用 */
  isDisabled?: boolean;
  /** 是否只读 */
  isReadOnly?: boolean;
  /** 是否处于错误态 */
  isInvalid?: boolean;
  /** 编辑区最小高度，默认按 size 映射 */
  minHeight?: number | string;
  /**
   * 编辑区最大高度，默认 '60vh'。
   * 传入 `null` 关闭上限（编辑区可无限增长）。
   */
  maxHeight?: number | string | null;
  /** 工具条预设或自定义 items 数组；传 false 隐藏工具条。默认 'basic' */
  toolbar?: ToolbarPreset | ToolbarItem[] | false;
  /** 透传给 TipTap 的额外扩展，会拼在内置扩展之后 */
  extensions?: AnyExtension[];
  /** TipTap 实例创建后的回调 */
  onCreate?: (editor: Editor) => void;
}
