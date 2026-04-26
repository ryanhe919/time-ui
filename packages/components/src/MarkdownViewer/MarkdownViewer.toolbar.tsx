/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @description MarkdownViewer 顶部工具条 —— 复制 / 下载 / 刷新 三按钮。
 */

import { useCallback, useState, type ReactElement } from 'react';
import { css, useTheme } from '@emotion/react';
import type {} from '@timeui/themes';

import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import type {
  MarkdownViewerToolbarConfig,
  MarkdownViewerToolbarLabels,
} from './MarkdownViewer.types';

// 内置 fallback 文案 —— 与 CodeEditor.toolbar 同模式：上层 i18n 块缺失时不崩。
export const DEFAULT_TOOLBAR_LABELS: MarkdownViewerToolbarLabels = {
  toolbarLabel: 'Markdown viewer toolbar',
  copy: 'Copy markdown',
  copied: 'Copied!',
  download: 'Download as .md',
  refresh: 'Refresh',
};

interface IconProps {
  size?: number;
}

function Icon({ size = 16, children }: IconProps & { children: ReactElement | ReactElement[] }) {
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

const CopyIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Icon>
);
const CheckIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <polyline points="20 6 9 17 4 12" />
  </Icon>
);
const DownloadIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Icon>
);
const RefreshIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15A9 9 0 1 1 19 6.36L23 10" />
  </Icon>
);

export interface MarkdownViewerToolbarProps {
  /** 当前 markdown 字符串的 lazy lookup（避免在 fetch 异步完成前拿到旧值）。 */
  getMarkdown: () => string;
  config: MarkdownViewerToolbarConfig;
  labels: MarkdownViewerToolbarLabels;
  /** 是否提供 refresh 按钮（仅 url 模式下有意义）。 */
  canRefresh: boolean;
  onRefresh?: () => void;
  /** 下载文件名（不含扩展名），默认 `document`。 */
  downloadFileName?: string;
}

export function MarkdownViewerToolbar(props: MarkdownViewerToolbarProps): ReactElement {
  const {
    getMarkdown,
    config,
    labels,
    canRefresh,
    onRefresh,
    downloadFileName = 'document',
  } = props;
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const showCopy = config.copy !== false;
  const showDownload = config.download !== false;
  const showRefresh = config.refresh !== false && canRefresh;

  const handleCopy = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(getMarkdown());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 静默降级：权限被拒 / 非 secure context 不打断阅读。
      void 0;
    }
  }, [getMarkdown]);

  const handleDownload = useCallback(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    // 避开 jsdom 没有 Blob/URL.createObjectURL 的极端环境。
    if (typeof Blob === 'undefined' || typeof URL.createObjectURL !== 'function') return;
    const blob = new Blob([getMarkdown()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${downloadFileName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // 异步释放，避免某些浏览器在点击立即吊销后取消下载。
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [getMarkdown, downloadFileName]);

  const containerCss = css`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-bottom: 1px solid ${theme.colors.border.subtle};
    background: ${theme.colors.bg.muted};
    color: ${theme.colors.text.primary};
  `;

  const spacerCss = css`
    flex: 1;
  `;

  return (
    <div role="toolbar" aria-label={labels.toolbarLabel} css={containerCss}>
      <span css={spacerCss} />

      {showRefresh && (
        <Tooltip content={labels.refresh} placement="top">
          <Button
            type="button"
            variant="light"
            color="default"
            size="sm"
            isIconOnly
            aria-label={labels.refresh}
            onClick={() => onRefresh?.()}
          >
            <RefreshIcon size={15} />
          </Button>
        </Tooltip>
      )}

      {showCopy && (
        <Tooltip content={copied ? labels.copied : labels.copy} placement="top">
          <Button
            type="button"
            variant="light"
            color="default"
            size="sm"
            isIconOnly
            aria-label={copied ? labels.copied : labels.copy}
            onClick={handleCopy}
          >
            {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
          </Button>
        </Tooltip>
      )}

      {showDownload && (
        <Tooltip content={labels.download} placement="top">
          <Button
            type="button"
            variant="light"
            color="default"
            size="sm"
            isIconOnly
            aria-label={labels.download}
            onClick={handleDownload}
          >
            <DownloadIcon size={15} />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}

MarkdownViewerToolbar.displayName = 'MarkdownViewerToolbar';
