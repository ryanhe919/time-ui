/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @description 实现 RichTextEditor 工具条子组件。
 */

import { useCallback, useMemo, type ReactElement } from 'react';
import { useTheme, css } from '@emotion/react';
import type { Editor } from '@tiptap/react';
import type {} from '@timeui/themes';
import { useI18n } from '@timeui/core';

import { Button } from '../Button';
import type { ButtonSize } from '../Button';
import { Tooltip } from '../Tooltip';
import type { RichTextEditorSize, ToolbarItem } from './RichTextEditor.types';

const SIZE_TO_BUTTON: Record<RichTextEditorSize, ButtonSize> = {
  xs: 'xs',
  sm: 'xs',
  md: 'sm',
  lg: 'md',
  xl: 'lg',
};

const SIZE_TO_ICON_PX: Record<RichTextEditorSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

interface IconProps {
  size: number;
}

function Icon({ size, children }: IconProps & { children: ReactElement | ReactElement[] }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
    >
      {children}
    </svg>
  );
}

const BoldIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z" />
    <path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z" />
  </Icon>
);

const ItalicIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </Icon>
);

const UnderlineIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M6 4v7a6 6 0 0 0 12 0V4" />
    <line x1="4" y1="20" x2="20" y2="20" />
  </Icon>
);

const StrikeIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <line x1="4" y1="12" x2="20" y2="12" />
    <path d="M16 6a4 4 0 0 0-4-2c-3 0-5 2-5 4 0 1.5 1 2.5 3 3" />
    <path d="M8 17a4 4 0 0 0 4 3c3 0 5-2 5-4 0-1-.5-2-1.5-2.5" />
  </Icon>
);

const H1Icon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M4 5v14" />
    <path d="M12 5v14" />
    <path d="M4 12h8" />
    <path d="M17 8l3-2v13" />
  </Icon>
);

const H2Icon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M4 5v14" />
    <path d="M12 5v14" />
    <path d="M4 12h8" />
    <path d="M16 8a3 3 0 0 1 5 2c0 2-5 4-5 9h6" />
  </Icon>
);

const H3Icon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M4 5v14" />
    <path d="M12 5v14" />
    <path d="M4 12h8" />
    <path d="M16 7a3 3 0 1 1 3 5 3 3 0 1 1-3 5" />
  </Icon>
);

const BulletListIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <line x1="9" y1="6" x2="20" y2="6" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="18" x2="20" y2="18" />
    <circle cx="5" cy="6" r="1" />
    <circle cx="5" cy="12" r="1" />
    <circle cx="5" cy="18" r="1" />
  </Icon>
);

const OrderedListIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <line x1="10" y1="6" x2="20" y2="6" />
    <line x1="10" y1="12" x2="20" y2="12" />
    <line x1="10" y1="18" x2="20" y2="18" />
    <path d="M4 6h2v0" />
    <path d="M4 4l2 0v4" />
    <path d="M4 14h2.5a.5.5 0 0 1 0 1L4 17h2.5" />
  </Icon>
);

const BlockquoteIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M6 9h3v6H4v-3a3 3 0 0 1 2-3z" />
    <path d="M16 9h3v6h-5v-3a3 3 0 0 1 2-3z" />
  </Icon>
);

const CodeIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <polyline points="9 8 4 12 9 16" />
    <polyline points="15 8 20 12 15 16" />
  </Icon>
);

const CodeBlockIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <polyline points="9 9 6 12 9 15" />
    <polyline points="15 9 18 12 15 15" />
  </Icon>
);

const HorizontalRuleIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <line x1="4" y1="12" x2="20" y2="12" />
  </Icon>
);

const LinkIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 1 0-5.6-5.6l-1.5 1.5" />
    <path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 1 0 5.6 5.6l1.5-1.5" />
  </Icon>
);

const ClearFormatIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M5 5h14" />
    <path d="M9 5l-2 14" />
    <path d="M15 5l-1 7" />
    <line x1="14" y1="17" x2="20" y2="17" />
    <line x1="20" y1="14" x2="14" y2="20" />
  </Icon>
);

const UndoIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M9 14l-4-4 4-4" />
    <path d="M5 10h9a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H9" />
  </Icon>
);

const RedoIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M15 14l4-4-4-4" />
    <path d="M19 10h-9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h5" />
  </Icon>
);

interface ToolbarLabels {
  bold: string;
  italic: string;
  underline: string;
  strike: string;
  h1: string;
  h2: string;
  h3: string;
  bulletList: string;
  orderedList: string;
  blockquote: string;
  code: string;
  codeBlock: string;
  horizontalRule: string;
  link: string;
  promptLink: string;
  clearFormat: string;
  undo: string;
  redo: string;
}

// Default labels are pulled from `useI18n().richTextEditor` so toolbar follows
// the surrounding ConfigProvider locale. `labels` prop on RichTextEditor still wins.
//
// FALLBACK_LABELS is the safety net for: (a) consumer pinned to an old @timeui/core
// (< 1.5.0) that lacks the richTextEditor i18n block, (b) stale workspace dist in dev,
// (c) any environment where the ConfigProvider sits outside the editor. Without it,
// `i18nLabels.bold` would throw when richTextEditor is undefined.
const FALLBACK_LABELS: ToolbarLabels & { toolbarLabel: string } = {
  toolbarLabel: 'Formatting',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strike: 'Strikethrough',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  bulletList: 'Bullet list',
  orderedList: 'Ordered list',
  blockquote: 'Blockquote',
  code: 'Inline code',
  codeBlock: 'Code block',
  horizontalRule: 'Horizontal rule',
  link: 'Link',
  promptLink: 'Enter URL',
  clearFormat: 'Clear formatting',
  undo: 'Undo',
  redo: 'Redo',
};

export interface RichTextEditorToolbarProps {
  editor: Editor | null;
  items: ToolbarItem[];
  size: RichTextEditorSize;
  isDisabled?: boolean;
  ariaLabel?: string;
  labels?: Partial<ToolbarLabels>;
}

export function RichTextEditorToolbar({
  editor,
  items,
  size,
  isDisabled = false,
  ariaLabel,
  labels: labelOverrides,
}: RichTextEditorToolbarProps) {
  const theme = useTheme();
  const i18n = useI18n();
  // i18n 字典如果是旧版（无 richTextEditor 段）会是 undefined；fallback 兜住，避免崩溃。
  const i18nLabels = i18n.richTextEditor ?? FALLBACK_LABELS;
  const labels: ToolbarLabels = useMemo(
    () => ({
      bold: i18nLabels.bold,
      italic: i18nLabels.italic,
      underline: i18nLabels.underline,
      strike: i18nLabels.strike,
      h1: i18nLabels.h1,
      h2: i18nLabels.h2,
      h3: i18nLabels.h3,
      bulletList: i18nLabels.bulletList,
      orderedList: i18nLabels.orderedList,
      blockquote: i18nLabels.blockquote,
      code: i18nLabels.code,
      codeBlock: i18nLabels.codeBlock,
      horizontalRule: i18nLabels.horizontalRule,
      link: i18nLabels.link,
      promptLink: i18nLabels.promptLink,
      clearFormat: i18nLabels.clearFormat,
      undo: i18nLabels.undo,
      redo: i18nLabels.redo,
      ...labelOverrides,
    }),
    [i18nLabels, labelOverrides],
  );
  const resolvedAriaLabel = ariaLabel ?? i18nLabels.toolbarLabel;
  const btnSize = SIZE_TO_BUTTON[size];
  const iconPx = SIZE_TO_ICON_PX[size];
  const inputSize = theme.components.input[size];

  const promptForLink = useCallback(
    (current: string) => {
      // 浏览器原生 prompt；在非浏览器环境（SSR / 测试）安全降级。
      if (typeof window === 'undefined') return null;
      const next = window.prompt(labels.promptLink, current);
      return next;
    },
    [labels.promptLink],
  );

  const containerCss = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 8px ${inputSize.paddingX};
    border-bottom: ${theme.borders.width.thin} solid ${theme.colors.border.subtle};
    color: ${theme.colors.text.primary};
  `;

  const separatorCss = css`
    width: ${theme.borders.width.thin};
    align-self: stretch;
    margin: 2px 4px;
    background: ${theme.colors.border.subtle};
  `;

  const buttonCss = css`
    &[data-active='true'] {
      background-color: ${theme.colors.default[200]};
      color: ${theme.colors.text.primary};
    }
  `;

  if (!editor) {
    // editor 还没初始化时渲染骨架占位，保留高度避免抖动。
    return (
      <div role="toolbar" aria-label={resolvedAriaLabel} css={containerCss} aria-hidden>
        {items.map((item, i) =>
          item === 'separator' ? <span key={`sep-${i}`} css={separatorCss} aria-hidden /> : null,
        )}
      </div>
    );
  }

  const isItemDisabled = isDisabled || !editor.isEditable;

  function renderButton(
    key: string,
    label: string,
    icon: ReactElement,
    active: boolean,
    onClick: () => void,
    disabled = false,
  ) {
    // Tooltip wrap：toolbar 按钮没有可见文字，hover 时用主题化的 Tooltip 告知功能。
    // Button 自身的 title 兜底依旧保留（兼容 Tooltip portal 阻挡 / 触屏长按等场景）。
    return (
      <Tooltip key={key} content={label} placement="top">
        <Button
          type="button"
          variant="light"
          color="default"
          size={btnSize}
          isIconOnly
          aria-label={label}
          aria-pressed={active}
          data-active={active || undefined}
          disabled={isItemDisabled || disabled}
          onMouseDown={(e) => {
            // 防止编辑区失焦
            e.preventDefault();
          }}
          onClick={onClick}
          css={buttonCss}
        >
          {icon}
        </Button>
      </Tooltip>
    );
  }

  function handleLink() {
    if (!editor) return;
    const previous = (editor.getAttributes('link').href as string | undefined) ?? '';
    const url = promptForLink(previous);
    if (url === null) return; // 用户取消
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  const buttons = items.map((item, idx) => {
    if (item === 'separator') {
      return <span key={`sep-${idx}`} css={separatorCss} aria-hidden />;
    }
    switch (item) {
      case 'bold':
        return renderButton(
          item,
          labels.bold,
          <BoldIcon size={iconPx} />,
          editor.isActive('bold'),
          () => editor.chain().focus().toggleBold().run(),
        );
      case 'italic':
        return renderButton(
          item,
          labels.italic,
          <ItalicIcon size={iconPx} />,
          editor.isActive('italic'),
          () => editor.chain().focus().toggleItalic().run(),
        );
      case 'underline':
        return renderButton(
          item,
          labels.underline,
          <UnderlineIcon size={iconPx} />,
          editor.isActive('underline'),
          () => editor.chain().focus().toggleUnderline().run(),
        );
      case 'strike':
        return renderButton(
          item,
          labels.strike,
          <StrikeIcon size={iconPx} />,
          editor.isActive('strike'),
          () => editor.chain().focus().toggleStrike().run(),
        );
      case 'h1':
        return renderButton(
          item,
          labels.h1,
          <H1Icon size={iconPx} />,
          editor.isActive('heading', { level: 1 }),
          () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        );
      case 'h2':
        return renderButton(
          item,
          labels.h2,
          <H2Icon size={iconPx} />,
          editor.isActive('heading', { level: 2 }),
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        );
      case 'h3':
        return renderButton(
          item,
          labels.h3,
          <H3Icon size={iconPx} />,
          editor.isActive('heading', { level: 3 }),
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        );
      case 'bulletList':
        return renderButton(
          item,
          labels.bulletList,
          <BulletListIcon size={iconPx} />,
          editor.isActive('bulletList'),
          () => editor.chain().focus().toggleBulletList().run(),
        );
      case 'orderedList':
        return renderButton(
          item,
          labels.orderedList,
          <OrderedListIcon size={iconPx} />,
          editor.isActive('orderedList'),
          () => editor.chain().focus().toggleOrderedList().run(),
        );
      case 'blockquote':
        return renderButton(
          item,
          labels.blockquote,
          <BlockquoteIcon size={iconPx} />,
          editor.isActive('blockquote'),
          () => editor.chain().focus().toggleBlockquote().run(),
        );
      case 'code':
        return renderButton(
          item,
          labels.code,
          <CodeIcon size={iconPx} />,
          editor.isActive('code'),
          () => editor.chain().focus().toggleCode().run(),
        );
      case 'codeBlock':
        return renderButton(
          item,
          labels.codeBlock,
          <CodeBlockIcon size={iconPx} />,
          editor.isActive('codeBlock'),
          () => editor.chain().focus().toggleCodeBlock().run(),
        );
      case 'horizontalRule':
        return renderButton(
          item,
          labels.horizontalRule,
          <HorizontalRuleIcon size={iconPx} />,
          false,
          () => editor.chain().focus().setHorizontalRule().run(),
        );
      case 'link':
        return renderButton(
          item,
          labels.link,
          <LinkIcon size={iconPx} />,
          editor.isActive('link'),
          handleLink,
        );
      case 'clearFormat':
        return renderButton(
          item,
          labels.clearFormat,
          <ClearFormatIcon size={iconPx} />,
          false,
          () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
        );
      case 'undo':
        return renderButton(
          item,
          labels.undo,
          <UndoIcon size={iconPx} />,
          false,
          () => editor.chain().focus().undo().run(),
          !editor.can().chain().focus().undo().run(),
        );
      case 'redo':
        return renderButton(
          item,
          labels.redo,
          <RedoIcon size={iconPx} />,
          false,
          () => editor.chain().focus().redo().run(),
          !editor.can().chain().focus().redo().run(),
        );
      default:
        return null;
    }
  });

  return (
    <div role="toolbar" aria-label={resolvedAriaLabel} css={containerCss}>
      {buttons}
    </div>
  );
}
