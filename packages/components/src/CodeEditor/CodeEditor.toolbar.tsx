/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @description CodeEditor 工具条子组件，包含复制、换行切换、行号切换、语言选择、全屏和 AI 建议按钮。
 */

import { useState, useCallback, type ReactElement } from 'react';
import { useTheme, css } from '@emotion/react';
import type {} from '@timeui/themes';
import { useI18n } from '@timeui/core';

import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import type { CodeEditorLanguage, ToolbarConfig, ToolbarLabels } from './CodeEditor.types';

// FALLBACK_LABELS 是安全兜底：旧版 @timeui/core 不含 codeEditor i18n 块时，
// 或 ConfigProvider 不在组件树中时，避免运行时崩溃。
const FALLBACK_LABELS: ToolbarLabels = {
  toolbarLabel: 'Code editor toolbar',
  copy: 'Copy',
  copied: 'Copied!',
  lineWrap: 'Toggle line wrap',
  lineNumbers: 'Toggle line numbers',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit fullscreen',
  language: 'Language',
  aiSuggest: 'AI suggestions',
};

const LANGUAGE_OPTIONS: { value: CodeEditorLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
];

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

const WrapTextIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M4 6h16" />
    <path d="M4 12h10a3 3 0 0 1 0 6H4" />
    <polyline points="12 15 9 18 12 21" />
  </Icon>
);

const HashIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </Icon>
);

const MaximizeIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </Icon>
);

const MinimizeIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
  </Icon>
);

const SparklesIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" />
    <path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75Z" />
    <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5Z" />
  </Icon>
);

export interface CodeEditorToolbarProps {
  /** Lazy lookup so the copy button reads the live editor content (uncontrolled mode never re-renders). */
  getValue: () => string;
  language: CodeEditorLanguage;
  onLanguageChange: (lang: CodeEditorLanguage) => void;
  lineWrap: boolean;
  onLineWrapToggle: () => void;
  showLineNumbers: boolean;
  onLineNumbersToggle: () => void;
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
  config: ToolbarConfig;
  labelOverrides?: Partial<ToolbarLabels>;
  hasAI: boolean;
  onAISuggest?: () => void;
  'aria-label'?: string;
}

export function CodeEditorToolbar({
  getValue,
  language,
  onLanguageChange,
  lineWrap,
  onLineWrapToggle,
  showLineNumbers,
  onLineNumbersToggle,
  isFullscreen,
  onFullscreenToggle,
  config,
  labelOverrides,
  hasAI,
  onAISuggest,
  'aria-label': ariaLabelProp,
}: CodeEditorToolbarProps) {
  const theme = useTheme();
  const i18n = useI18n();
  // 旧版 i18n 包无 codeEditor 块时安全降级到 FALLBACK_LABELS。
  const i18nLabels = (i18n as { codeEditor?: ToolbarLabels }).codeEditor ?? FALLBACK_LABELS;
  const labels: ToolbarLabels = { ...i18nLabels, ...labelOverrides };

  const resolvedAriaLabel = ariaLabelProp ?? labels.toolbarLabel;

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(getValue())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // 剪贴板权限被拒/上下文非 secure context — 静默失败，避免抛 unhandled rejection。
      });
  }, [getValue]);

  const showCopy = config.showCopy !== false;
  const showLineWrap = config.showLineWrap !== false;
  const showLineNums = config.showLineNumbers !== false;
  const showLangSelect = config.showLanguageSelect !== false;
  const showFullscreen = config.showFullscreen !== false;

  const containerCss = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-bottom: ${theme.borders.width.thin} solid ${theme.colors.border.subtle};
    color: ${theme.colors.text.primary};
    background-color: ${theme.colors.bg.muted};
    border-radius: ${theme.componentRadius.md} ${theme.componentRadius.md} 0 0;
  `;

  const separatorCss = css`
    width: ${theme.borders.width.thin};
    align-self: stretch;
    min-height: 16px;
    margin: 2px 4px;
    background: ${theme.colors.border.subtle};
  `;

  const langSelectCss = css`
    appearance: none;
    -webkit-appearance: none;
    background-color: transparent;
    border: 1px solid ${theme.colors.border.subtle};
    border-radius: ${theme.componentRadius.sm};
    color: ${theme.colors.text.secondary};
    font-family: ${theme.typography.fontFamily.sans};
    font-size: ${theme.typography.fontSize.xs};
    height: 28px;
    padding: 0 24px 0 8px;
    cursor: pointer;
    outline: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 6px center;
    transition: border-color 0.15s ease;

    &:hover {
      border-color: ${theme.colors.border.default};
      color: ${theme.colors.text.primary};
    }

    &:focus {
      border-color: ${theme.colors.primary[500]};
      box-shadow: 0 0 0 2px ${theme.colors.primary[100]};
    }
  `;

  const activeButtonCss = (active: boolean) => css`
    ${active
      ? `
      background-color: ${theme.colors.default[200]};
      color: ${theme.colors.text.primary};
    `
      : ''}
  `;

  const spacerCss = css`
    flex: 1;
  `;

  return (
    <div role="toolbar" aria-label={resolvedAriaLabel} css={containerCss}>
      {showLangSelect && (
        <Tooltip content={labels.language} placement="top">
          <select
            aria-label={labels.language}
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as CodeEditorLanguage)}
            css={langSelectCss}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Tooltip>
      )}

      {showLangSelect && (showLineWrap || showLineNums || showCopy || showFullscreen || hasAI) && (
        <span css={separatorCss} aria-hidden />
      )}

      {showLineWrap && (
        <Tooltip content={labels.lineWrap} placement="top">
          <Button
            type="button"
            variant="light"
            color="default"
            size="sm"
            isIconOnly
            aria-label={labels.lineWrap}
            aria-pressed={lineWrap}
            data-active={lineWrap || undefined}
            onClick={onLineWrapToggle}
            css={activeButtonCss(lineWrap)}
          >
            <WrapTextIcon size={15} />
          </Button>
        </Tooltip>
      )}

      {showLineNums && (
        <Tooltip content={labels.lineNumbers} placement="top">
          <Button
            type="button"
            variant="light"
            color="default"
            size="sm"
            isIconOnly
            aria-label={labels.lineNumbers}
            aria-pressed={showLineNumbers}
            data-active={showLineNumbers || undefined}
            onClick={onLineNumbersToggle}
            css={activeButtonCss(showLineNumbers)}
          >
            <HashIcon size={15} />
          </Button>
        </Tooltip>
      )}

      <span css={spacerCss} />

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

      {hasAI && (
        <Tooltip content={labels.aiSuggest} placement="top">
          <Button
            type="button"
            variant="light"
            color="default"
            size="sm"
            isIconOnly
            aria-label={labels.aiSuggest}
            onClick={onAISuggest}
          >
            <SparklesIcon size={15} />
          </Button>
        </Tooltip>
      )}

      {showFullscreen && (
        <Tooltip content={isFullscreen ? labels.exitFullscreen : labels.fullscreen} placement="top">
          <Button
            type="button"
            variant="light"
            color="default"
            size="sm"
            isIconOnly
            aria-label={isFullscreen ? labels.exitFullscreen : labels.fullscreen}
            aria-pressed={isFullscreen}
            onClick={onFullscreenToggle}
          >
            {isFullscreen ? <MinimizeIcon size={15} /> : <MaximizeIcon size={15} />}
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
