/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @description 实现 RichTextEditor 组件的核心渲染与交互逻辑（基于 TipTap）。
 */

import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTheme, css } from '@emotion/react';
// Side-effect import 触发 @timeui/themes 对 @emotion/react Theme 的 module augmentation；
// 否则 tsup 的独立 DTS bundle 看不到 theme.colors / theme.typography 的类型。
import type {} from '@timeui/themes';
import { useEditor, EditorContent, type Editor, type AnyExtension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

import { getFieldVariantStyles } from '../utils/fieldStyles';
import { mergeRefs } from '../utils/refs';
import { RichTextEditorToolbar } from './RichTextEditor.toolbar';
import type {
  RichTextEditorProps,
  RichTextEditorSize,
  ToolbarItem,
  ToolbarPreset,
} from './RichTextEditor.types';

const SIZE_TO_MIN_HEIGHT: Record<RichTextEditorSize, string> = {
  sm: '120px',
  md: '160px',
  lg: '220px',
};

const PRESETS: Record<ToolbarPreset, ToolbarItem[]> = {
  minimal: ['bold', 'italic', 'underline'],
  basic: [
    'bold',
    'italic',
    'underline',
    'separator',
    'h1',
    'h2',
    'h3',
    'separator',
    'bulletList',
    'orderedList',
    'separator',
    'link',
  ],
  full: [
    'bold',
    'italic',
    'underline',
    'separator',
    'h1',
    'h2',
    'h3',
    'separator',
    'bulletList',
    'orderedList',
    'separator',
    'link',
    'separator',
    'strike',
    'separator',
    'blockquote',
    'code',
    'codeBlock',
    'horizontalRule',
    'separator',
    'clearFormat',
    'separator',
    'undo',
    'redo',
  ],
};

function resolveToolbarItems(toolbar: RichTextEditorProps['toolbar']): ToolbarItem[] | null {
  if (toolbar === false) return null;
  if (toolbar === undefined) return PRESETS.basic;
  if (Array.isArray(toolbar)) return toolbar;
  return PRESETS[toolbar];
}

function toCssLength(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? `${value}px` : value;
}

export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  function RichTextEditor(
    {
      value,
      defaultValue,
      onChange,
      placeholder,
      size = 'md',
      variant = 'bordered',
      isDisabled = false,
      isReadOnly = false,
      isInvalid = false,
      minHeight,
      maxHeight = '60vh',
      toolbar,
      extensions,
      onCreate,
      'aria-label': ariaLabel,
      className,
      style,
      ...rest
    },
    ref,
  ) {
    const theme = useTheme();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const onChangeRef = useRef(onChange);
    const onCreateRef = useRef(onCreate);
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);
    useEffect(() => {
      onCreateRef.current = onCreate;
    }, [onCreate]);

    const initialContent = value ?? defaultValue ?? '';

    const editable = !isDisabled && !isReadOnly;

    const tiptapExtensions = useMemo<AnyExtension[]>(() => {
      const list: AnyExtension[] = [
        StarterKit,
        Underline,
        Link.configure({ openOnClick: false, autolink: true }),
        Placeholder.configure({ placeholder: placeholder ?? '' }),
      ];
      if (extensions && extensions.length > 0) {
        list.push(...extensions);
      }
      return list;
    }, [extensions, placeholder]);

    const editor = useEditor(
      {
        extensions: tiptapExtensions,
        content: initialContent,
        editable,
        // 避免 SSR 阶段 immediatelyRender 触发 hydration mismatch
        immediatelyRender: false,
        onCreate: ({ editor: created }) => {
          onCreateRef.current?.(created as Editor);
        },
        onUpdate: ({ editor: updated }) => {
          onChangeRef.current?.(updated.getHTML());
        },
      },
      // 仅在扩展集合 / 可编辑性变化时重建 editor。
      [tiptapExtensions, editable],
    );

    // 受控同步：当外部 value 变化且与编辑器当前内容不同时，setContent。
    useEffect(() => {
      if (!editor) return;
      if (value === undefined) return;
      const current = editor.getHTML();
      if (value === current) return;
      editor.commands.setContent(value, false);
    }, [editor, value]);

    // 切换 editable 时 keep TipTap 同步（`editable` 仅在初始化时生效，所以这里再补一遍）。
    useEffect(() => {
      if (!editor) return;
      if (editor.isEditable !== editable) {
        editor.setEditable(editable);
      }
    }, [editor, editable]);

    const toolbarItems = resolveToolbarItems(toolbar);
    const inputSize = theme.components.input[size];

    const minHeightCss = toCssLength(minHeight) ?? SIZE_TO_MIN_HEIGHT[size];
    const maxHeightCss = toCssLength(maxHeight ?? null);

    const variantStyles = getFieldVariantStyles({
      theme,
      variant,
      color: 'default',
      isInvalid,
      isDisabled,
      isReadOnly,
    });

    const setRef = useCallback((node: HTMLDivElement | null) => {
      containerRef.current = node;
    }, []);

    const containerCss = css`
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      border-radius: ${theme.componentRadius.md};
      color: ${theme.colors.text.primary};
      font-family: ${theme.typography.fontFamily.sans};
      font-size: ${inputSize.fontSize};
      line-height: 1.6;
      overflow: hidden;
      ${isDisabled ? 'pointer-events: none;' : ''}
    `;

    const editorScrollCss = css`
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      ${maxHeightCss ? `max-height: ${maxHeightCss};` : ''}
    `;

    const proseCss = css`
      .ProseMirror {
        outline: none;
        padding: ${inputSize.paddingX};
        min-height: ${minHeightCss};
        color: inherit;
        font-size: inherit;
        line-height: inherit;
        caret-color: ${theme.colors.text.primary};
      }
      .ProseMirror > * + * {
        margin-top: 0.6em;
      }
      .ProseMirror p {
        margin: 0;
      }
      .ProseMirror h1 {
        margin: 0;
        font-size: ${theme.typography.fontSize['2xl']};
        font-weight: ${theme.typography.fontWeight.semibold};
        line-height: 1.3;
      }
      .ProseMirror h2 {
        margin: 0;
        font-size: ${theme.typography.fontSize.xl};
        font-weight: ${theme.typography.fontWeight.semibold};
        line-height: 1.3;
      }
      .ProseMirror h3 {
        margin: 0;
        font-size: ${theme.typography.fontSize.lg};
        font-weight: ${theme.typography.fontWeight.semibold};
        line-height: 1.4;
      }
      .ProseMirror ul,
      .ProseMirror ol {
        padding-left: 1.5em;
        margin: 0;
      }
      .ProseMirror li > p {
        margin: 0;
      }
      .ProseMirror blockquote {
        margin: 0;
        padding: 0.4em 0.9em;
        border-left: 3px solid ${theme.colors.border.strong};
        background: ${theme.colors.bg.muted};
        color: ${theme.colors.text.secondary};
        font-style: italic;
        border-radius: ${theme.componentRadius.sm};
      }
      .ProseMirror code {
        font-family: ${theme.typography.fontFamily.mono};
        background: ${theme.colors.bg.muted};
        padding: 0.1em 0.35em;
        border-radius: ${theme.componentRadius.sm};
        font-size: 0.9em;
      }
      .ProseMirror pre {
        margin: 0;
        padding: 0.9em 1em;
        background: ${theme.colors.bg.muted};
        color: ${theme.colors.text.primary};
        border-radius: ${theme.componentRadius.sm};
        overflow-x: auto;
        font-family: ${theme.typography.fontFamily.mono};
        font-size: 0.9em;
        line-height: 1.5;
      }
      .ProseMirror pre code {
        background: transparent;
        padding: 0;
        border-radius: 0;
        font-size: inherit;
      }
      .ProseMirror hr {
        margin: 0.6em 0;
        border: 0;
        border-top: ${theme.borders.width.thin} solid ${theme.colors.border.subtle};
      }
      .ProseMirror a {
        color: ${theme.colors.text.link};
        text-decoration: underline;
        cursor: pointer;
      }
      .ProseMirror p.is-editor-empty:first-of-type::before {
        content: attr(data-placeholder);
        color: ${theme.colors.text.muted};
        pointer-events: none;
        height: 0;
        float: left;
      }
    `;

    const items: ToolbarItem[] = toolbarItems ?? [];

    return (
      <div
        ref={mergeRefs(ref, setRef)}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        aria-disabled={isDisabled || undefined}
        aria-readonly={isReadOnly || undefined}
        aria-invalid={isInvalid || undefined}
        data-variant={variant}
        data-size={size}
        data-disabled={isDisabled || undefined}
        data-readonly={isReadOnly || undefined}
        data-invalid={isInvalid || undefined}
        className={className}
        style={style}
        css={[containerCss, variantStyles, proseCss]}
        {...rest}
      >
        {toolbarItems !== null ? (
          <RichTextEditorToolbar
            editor={editor}
            items={items}
            size={size}
            isDisabled={isDisabled || isReadOnly}
          />
        ) : null}
        <div css={editorScrollCss} data-slot="editor-scroll">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  },
);

RichTextEditor.displayName = 'RichTextEditor';
