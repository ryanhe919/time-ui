/** @jsxImportSource @emotion/react */
/**
 * @author Ryan He
 * @date 2026-04-29
 * @description 聊天附件 chip：在 Composer 的 topContent slot 里展示已选文件 / 上下文，
 *              可选移除按钮、上传进度条、按文件类型推导前缀图标。
 */

'use client';

import { forwardRef, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';

export type ChatFileChipKind =
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code'
  | 'spreadsheet'
  | 'pdf'
  | 'generic';

export interface ChatFileChipProps {
  /** 文件名（必填，会作为可见 label）。 */
  name: string;
  /** 文件类型；缺省时从扩展名推导。 */
  kind?: ChatFileChipKind;
  /** 可选大小描述（"3.2 MB"），显示在文件名右侧次要色。 */
  size?: string;
  /**
   * 上传进度（0-100）。提供时在 chip 底部画一条细进度条；
   * `undefined` 表示已完成（不画）。
   */
  progress?: number;
  /** 错误状态：边框 + 文本切换为 danger 色。 */
  isError?: boolean;
  /** 自定义前缀（图标），不传则按 kind 推导首字母 badge。 */
  startContent?: ReactNode;
  /** 提供则显示移除按钮（× 图标）。 */
  onRemove?: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  /** 整个 chip 可点击（如点击预览文件）。 */
  onClick?: (e: ReactMouseEvent<HTMLDivElement>) => void;
  /** 移除按钮 aria-label，默认 `Remove ${name}`。 */
  removeAriaLabel?: string;
  className?: string;
  id?: string;
}

const KIND_LETTER: Record<ChatFileChipKind, string> = {
  document: 'D',
  image: 'I',
  video: 'V',
  audio: 'A',
  archive: 'Z',
  code: '<>',
  spreadsheet: 'X',
  pdf: 'P',
  generic: '·',
};

const EXT_TO_KIND: Record<string, ChatFileChipKind> = {
  pdf: 'pdf',
  doc: 'document',
  docx: 'document',
  txt: 'document',
  md: 'document',
  rtf: 'document',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  mp3: 'audio',
  wav: 'audio',
  flac: 'audio',
  zip: 'archive',
  tar: 'archive',
  gz: 'archive',
  ts: 'code',
  tsx: 'code',
  js: 'code',
  jsx: 'code',
  py: 'code',
  go: 'code',
  rs: 'code',
  java: 'code',
  csv: 'spreadsheet',
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
};

function deriveKind(name: string): ChatFileChipKind {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return 'generic';
  const ext = name.slice(dot + 1).toLowerCase();
  return EXT_TO_KIND[ext] ?? 'generic';
}

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden focusable="false">
    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const ChatFileChip = forwardRef<HTMLDivElement, ChatFileChipProps>(
  function ChatFileChip(props, ref) {
    const {
      name,
      kind,
      size,
      progress,
      isError,
      startContent,
      onRemove,
      onClick,
      removeAriaLabel,
      className,
      id,
    } = props;

    const theme = useTheme();
    const focusColor = theme.colors.border.focus ?? theme.colors.focus;
    const dangerColor = theme.colors.danger?.[500] ?? theme.colors.text.primary;
    const surface = theme.colors.bg.surface;
    const muted = theme.colors.bg.muted ?? surface;
    const fg = theme.colors.text.primary;
    const fgMuted = theme.colors.text.muted;
    const borderColor = isError ? dangerColor : theme.colors.border.default;
    const duration = theme.motion.duration.normal ?? '250ms';

    const resolvedKind = kind ?? deriveKind(name);
    const showProgress = typeof progress === 'number' && progress >= 0 && progress < 100;

    const isInteractive = typeof onClick === 'function';

    const wrapperCss = css`
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 6px 4px 4px;
      max-width: 220px;
      min-height: 28px;
      border: 1px solid ${borderColor};
      border-radius: 9999px;
      background-color: ${muted};
      color: ${isError ? dangerColor : fg};
      font-family: inherit;
      font-size: 12px;
      line-height: 1.2;
      box-sizing: border-box;
      cursor: ${isInteractive ? 'pointer' : 'default'};
      transition:
        border-color ${duration},
        background-color ${duration};

      ${isInteractive
        ? `
          appearance: none;
          text-align: left;
          &:hover { background-color: ${theme.colors.bg.canvas ?? muted}; }
        `
        : ''}

      &:focus-visible {
        outline: 2px solid ${focusColor};
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const badgeCss = css`
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 9999px;
      background-color: ${theme.colors.bg.surface};
      border: 1px solid ${theme.colors.border.subtle ?? theme.colors.border.default};
      color: ${fgMuted};
      font-size: 10px;
      font-weight: 600;
      line-height: 1;
    `;

    const labelCss = css`
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;

    const sizeCss = css`
      flex: 0 0 auto;
      color: ${fgMuted};
      font-variant-numeric: tabular-nums;
    `;

    const removeBtnCss = css`
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      padding: 0;
      margin: 0;
      border: 0;
      border-radius: 9999px;
      background: transparent;
      color: ${fgMuted};
      cursor: pointer;
      transition: background-color ${duration};

      &:hover {
        background-color: ${theme.colors.bg.canvas ?? muted};
        color: ${fg};
      }

      &:focus-visible {
        outline: 2px solid ${focusColor};
        outline-offset: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const progressCss = css`
      position: absolute;
      left: 0;
      bottom: -1px;
      height: 2px;
      width: ${Math.max(0, Math.min(100, progress ?? 0))}%;
      background-color: ${focusColor};
      border-radius: 9999px;
      transition: width ${duration};

      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const handleRemoveClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onRemove?.(e);
    };

    const content = (
      <>
        <span css={badgeCss} aria-hidden>
          {startContent ?? KIND_LETTER[resolvedKind]}
        </span>
        <span css={labelCss} title={name}>
          {name}
        </span>
        {size ? <span css={sizeCss}>{size}</span> : null}
      </>
    );

    return (
      <div
        ref={ref}
        id={id}
        className={className}
        css={wrapperCss}
        onClick={onClick}
        data-kind={resolvedKind}
        data-error={isError || undefined}
      >
        {isInteractive ? (
          <button
            type="button"
            css={css`
              display: inline-flex;
              align-items: center;
              flex: 1 1 auto;
              min-width: 0;
              gap: 6px;
              border: 0;
              padding: 0;
              background: transparent;
              color: inherit;
              font: inherit;
              text-align: inherit;
              cursor: pointer;
              border-radius: inherit;
              &:focus-visible {
                outline: 2px solid ${focusColor};
                outline-offset: 2px;
              }
            `}
          >
            {content}
          </button>
        ) : (
          content
        )}
        {onRemove ? (
          <button
            type="button"
            css={removeBtnCss}
            onClick={handleRemoveClick}
            aria-label={removeAriaLabel ?? `Remove ${name}`}
          >
            <CloseIcon />
          </button>
        ) : null}
        {showProgress ? (
          <span aria-hidden css={progressCss} data-testid="chat-file-chip-progress" />
        ) : null}
      </div>
    );
  },
);

(ChatFileChip as unknown as { displayName: string }).displayName = 'ChatFileChip';
