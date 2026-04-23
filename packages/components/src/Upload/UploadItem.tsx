/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description Upload 列表中单条文件项的展示与操作。
 */

import { forwardRef, useMemo } from 'react';
import { useTheme, css, keyframes } from '@emotion/react';
import { useI18n } from '@timeui/core';
import type { UploadItemProps } from './Upload.types';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  RotateCwIcon,
  SpinnerIcon,
  TrashIcon,
  pickFileIcon,
} from './icons';

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v >= 10 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const UploadItem = forwardRef<HTMLLIElement, UploadItemProps>(function UploadItem(
  {
    file,
    onRemove,
    onRetry,
    size = 'md',
    isDisabled = false,
    isReadOnly = false,
    classNames,
    className,
    style,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const i18n = useI18n();

  const statusLabel = (() => {
    switch (file.status) {
      case 'ready':
        return i18n.upload.statusReady;
      case 'uploading':
        return i18n.upload.statusUploading;
      case 'success':
        return i18n.upload.statusSuccess;
      case 'error':
        return i18n.upload.statusError;
      default:
        return '';
    }
  })();

  const dense = size === 'xs' || size === 'sm';
  const thumbSize = dense ? 32 : 40;
  const nameSize = dense ? '12.5px' : '13.5px';
  const metaSize = dense ? '11px' : '11.5px';
  const paddingX = dense ? 10 : 12;
  const paddingY = dense ? 8 : 10;

  const FileIconComp = useMemo(
    () => pickFileIcon(file.type ?? '', file.name ?? ''),
    [file.type, file.name],
  );

  const showActions = !isDisabled && !isReadOnly && file.status !== 'removed';
  const percent = typeof file.percent === 'number' ? Math.max(0, Math.min(100, file.percent)) : 0;
  const progressVisible =
    file.status === 'uploading' || file.status === 'success' || file.status === 'error';

  // 状态指示的色：primary 上传中/成功、danger 失败、muted 待上传
  const accent =
    file.status === 'error'
      ? theme.colors.status.danger
      : file.status === 'success'
        ? (theme.colors.status.success ?? theme.colors.primary.DEFAULT)
        : file.status === 'uploading'
          ? theme.colors.primary.DEFAULT
          : theme.colors.border.default;

  return (
    <li
      ref={ref}
      className={[classNames?.item, className].filter(Boolean).join(' ') || undefined}
      style={style}
      data-status={file.status}
      data-size={size}
      css={css`
        position: relative;
        display: flex;
        align-items: center;
        gap: ${dense ? '10px' : '12px'};
        padding: ${paddingY}px ${paddingX}px;
        border-radius: ${theme.componentRadius.md};
        font-size: ${nameSize};
        color: ${theme.colors.text.primary};
        background: ${theme.colors.bg.canvas ?? theme.colors.bg.muted};
        border: 1px solid ${theme.colors.border.subtle ?? theme.colors.border.default};
        overflow: hidden;
        transition:
          border-color 180ms,
          background-color 180ms,
          box-shadow 180ms;

        &:hover {
          border-color: ${theme.colors.border.default};
          background: ${theme.colors.bg.canvas ?? theme.colors.bg.muted};
        }

        &[data-status='error'] {
          border-color: ${theme.colors.status.danger};
          background: ${theme.colors.status.dangerBg ?? 'transparent'};
        }
        &[data-status='success'] {
          border-color: ${theme.colors.border.default};
        }

        @media (prefers-reduced-motion: reduce) {
          transition: none;
        }
      `}
      {...rest}
    >
      {/* 左侧缩略 / 类型图标 */}
      <span
        aria-hidden="true"
        css={css`
          flex-shrink: 0;
          width: ${thumbSize}px;
          height: ${thumbSize}px;
          border-radius: ${theme.componentRadius.sm};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: ${theme.colors.bg.muted};
          color: ${theme.colors.text.secondary};
          overflow: hidden;
          position: relative;
        `}
      >
        {file.previewUrl ? (
          <img
            src={file.previewUrl}
            alt=""
            css={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            `}
          />
        ) : (
          <FileIconComp width={dense ? 18 : 20} height={dense ? 18 : 20} />
        )}
      </span>

      {/* 名字 + 大小/状态两行 */}
      <span
        css={css`
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        `}
      >
        <span
          className={classNames?.itemName}
          css={css`
            color: ${theme.colors.text.primary};
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.3;
          `}
          title={file.name}
        >
          {file.name}
        </span>
        <span
          className={classNames?.itemSize}
          css={css`
            color: ${theme.colors.text.secondary};
            font-size: ${metaSize};
            font-variant-numeric: tabular-nums;
            line-height: 1.3;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          `}
        >
          <span>{formatSize(file.size)}</span>
          <span
            aria-hidden="true"
            css={css`
              width: 3px;
              height: 3px;
              border-radius: 50%;
              background: currentColor;
              opacity: 0.45;
            `}
          />
          {file.status === 'uploading' ? (
            <span className={classNames?.itemProgress} aria-label={statusLabel}>
              {statusLabel.replace('{percent}', String(percent))}
            </span>
          ) : (
            <span>{statusLabel}</span>
          )}
        </span>
      </span>

      {/* 状态图标（成功 / 失败 / 上传中 spinner） */}
      <span
        aria-hidden="true"
        css={css`
          flex-shrink: 0;
          width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: ${accent};
        `}
      >
        {file.status === 'success' ? (
          <CheckCircleIcon width={18} height={18} />
        ) : file.status === 'error' ? (
          <AlertCircleIcon width={18} height={18} />
        ) : file.status === 'uploading' ? (
          <SpinnerIcon
            width={16}
            height={16}
            css={css`
              animation: ${spin} 900ms linear infinite;
              @media (prefers-reduced-motion: reduce) {
                animation: none;
              }
            `}
          />
        ) : null}
      </span>

      {showActions ? (
        <span
          className={classNames?.itemActions}
          css={css`
            display: inline-flex;
            gap: 2px;
            flex-shrink: 0;
          `}
        >
          {file.status === 'error' && onRetry ? (
            <button
              type="button"
              className={classNames?.retryButton}
              onClick={() => onRetry(file)}
              aria-label={i18n.upload.retryLabel.replace('{name}', file.name)}
              title={i18n.upload.retryLabel.replace('{name}', file.name)}
              css={iconButtonCss(theme, 'primary')}
              data-slot="retry"
            >
              <RotateCwIcon width={14} height={14} />
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              className={classNames?.removeButton}
              onClick={() => onRemove(file)}
              aria-label={i18n.upload.removeLabel.replace('{name}', file.name)}
              title={i18n.upload.removeLabel.replace('{name}', file.name)}
              css={iconButtonCss(theme, 'danger')}
              data-slot="remove"
            >
              <TrashIcon width={14} height={14} />
            </button>
          ) : null}
        </span>
      ) : null}

      {/* 底部 2px 进度条 */}
      {progressVisible ? (
        <span
          aria-hidden="true"
          css={css`
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 2px;
            background: ${theme.colors.border.subtle ?? theme.colors.border.default};
            overflow: hidden;
          `}
        >
          <span
            css={css`
              display: block;
              height: 100%;
              background: ${accent};
              transform-origin: left center;
              transform: scaleX(${file.status === 'uploading' ? percent / 100 : 1});
              transition: transform 220ms ease-out;
              @media (prefers-reduced-motion: reduce) {
                transition: none;
              }
            `}
          />
        </span>
      ) : null}
    </li>
  );
});

(UploadItem as unknown as { displayName: string }).displayName = 'UploadItem';

function iconButtonCss(theme: ReturnType<typeof useTheme>, intent: 'primary' | 'danger') {
  const hoverColor =
    intent === 'danger' ? theme.colors.status.danger : theme.colors.primary.DEFAULT;
  return css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: ${theme.componentRadius.sm};
    color: ${theme.colors.text.secondary};
    cursor: pointer;
    transition:
      color 150ms,
      background-color 150ms;

    &:hover {
      color: ${hoverColor};
      background: ${theme.colors.bg.muted};
    }
    &:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 1.5px ${theme.colors.focus};
    }
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;
}
