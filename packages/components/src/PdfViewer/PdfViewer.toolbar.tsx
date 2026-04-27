/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @description PdfViewer 工具条子组件：上一页/下一页、页码输入、缩放、适配宽度、下载、打印。
 */

import { useCallback, useEffect, useState, type ChangeEvent, type ReactElement } from 'react';
import { useTheme, css } from '@emotion/react';
import type {} from '@timeui/themes';

import { Button } from '../Button';
import { Tooltip } from '../Tooltip';
import type { PdfViewerToolbarConfig, PdfViewerToolbarLabels } from './PdfViewer.types';

// FALLBACK_LABELS — 旧版 @timeui/core i18n 不含 pdfViewer 块或缺少 ConfigProvider 时的兜底。
export const PDF_FALLBACK_LABELS: PdfViewerToolbarLabels = {
  toolbarLabel: 'PDF viewer toolbar',
  prevPage: 'Previous page',
  nextPage: 'Next page',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  fitWidth: 'Fit width',
  fitPage: 'Fit page',
  download: 'Download',
  print: 'Print',
  pageOf: (current, total) => `Page ${current} of ${total}`,
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

const ChevronLeftIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <polyline points="15 18 9 12 15 6" />
  </Icon>
);

const ChevronRightIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <polyline points="9 18 15 12 9 6" />
  </Icon>
);

const ZoomInIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </Icon>
);

const ZoomOutIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </Icon>
);

const FitWidthIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M3 12h18" />
    <polyline points="7 8 3 12 7 16" />
    <polyline points="17 8 21 12 17 16" />
  </Icon>
);

const DownloadIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Icon>
);

const PrintIcon = ({ size }: IconProps) => (
  <Icon size={size}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </Icon>
);

export interface PdfViewerToolbarProps {
  currentPage: number;
  numPages: number;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  config: PdfViewerToolbarConfig;
  labelOverrides?: Partial<PdfViewerToolbarLabels>;
  /** Disable navigation while document is still loading. */
  isLoading?: boolean;
  'aria-label'?: string;
}

export function PdfViewerToolbar({
  currentPage,
  numPages,
  zoom,
  minZoom,
  maxZoom,
  onPrev,
  onNext,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onDownload,
  onPrint,
  config,
  labelOverrides,
  isLoading,
  'aria-label': ariaLabelProp,
}: PdfViewerToolbarProps) {
  const theme = useTheme();
  // 不依赖 useI18n — pdfViewer i18n 块未定义在 @timeui/core 中，统一走 FALLBACK_LABELS。
  const labels: PdfViewerToolbarLabels = { ...PDF_FALLBACK_LABELS, ...labelOverrides };

  const resolvedAriaLabel = ariaLabelProp ?? labels.toolbarLabel;

  const showDownload = config.download === true && !!onDownload;
  const showPrint = config.print === true && !!onPrint;
  const showPageInput = config.pageInput !== false;

  // Local input string — keeps the input editable while the user types.
  const [inputValue, setInputValue] = useState(String(currentPage));
  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const commitPage = useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= Math.max(1, numPages)) {
      onGoToPage(parsed);
    } else {
      setInputValue(String(currentPage));
    }
  }, [inputValue, numPages, currentPage, onGoToPage]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

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

  const pageInfoCss = css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: ${theme.typography.fontSize.xs};
    color: ${theme.colors.text.secondary};
    user-select: none;
    white-space: nowrap;
  `;

  const pageInputCss = css`
    appearance: none;
    -webkit-appearance: none;
    background-color: transparent;
    border: 1px solid ${theme.colors.border.subtle};
    border-radius: ${theme.componentRadius.sm};
    color: ${theme.colors.text.primary};
    font-family: ${theme.typography.fontFamily.sans};
    font-size: ${theme.typography.fontSize.xs};
    height: 24px;
    width: 48px;
    padding: 0 6px;
    text-align: center;
    outline: none;

    &:hover {
      border-color: ${theme.colors.border.default};
    }
    &:focus {
      border-color: ${theme.colors.primary[500]};
      box-shadow: 0 0 0 2px ${theme.colors.primary[100]};
    }

    /* hide spin buttons */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    -moz-appearance: textfield;
  `;

  const zoomLabelCss = css`
    min-width: 44px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    font-size: ${theme.typography.fontSize.xs};
    color: ${theme.colors.text.secondary};
    user-select: none;
  `;

  const spacerCss = css`
    flex: 1;
  `;

  const zoomPercent = Math.round(zoom * 100);
  const navDisabled = isLoading || numPages <= 0;
  const prevDisabled = navDisabled || currentPage <= 1;
  const nextDisabled = navDisabled || currentPage >= numPages;
  const zoomOutDisabled = zoom <= minZoom + 1e-6;
  const zoomInDisabled = zoom >= maxZoom - 1e-6;

  return (
    <div role="toolbar" aria-label={resolvedAriaLabel} css={containerCss}>
      <Tooltip content={labels.prevPage} placement="top">
        <Button
          type="button"
          variant="light"
          color="default"
          size="sm"
          isIconOnly
          aria-label={labels.prevPage}
          isDisabled={prevDisabled}
          onClick={onPrev}
        >
          <ChevronLeftIcon size={15} />
        </Button>
      </Tooltip>

      <span css={pageInfoCss}>
        {showPageInput ? (
          <input
            type="number"
            min={1}
            max={Math.max(1, numPages)}
            step={1}
            value={inputValue}
            disabled={navDisabled}
            onChange={handleInputChange}
            onBlur={commitPage}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitPage();
              }
            }}
            aria-label="Current page"
            css={pageInputCss}
          />
        ) : (
          <span>{currentPage}</span>
        )}
        <span aria-hidden>/</span>
        <span data-testid="pdf-num-pages">{numPages || 0}</span>
      </span>

      <Tooltip content={labels.nextPage} placement="top">
        <Button
          type="button"
          variant="light"
          color="default"
          size="sm"
          isIconOnly
          aria-label={labels.nextPage}
          isDisabled={nextDisabled}
          onClick={onNext}
        >
          <ChevronRightIcon size={15} />
        </Button>
      </Tooltip>

      <span css={separatorCss} aria-hidden />

      <Tooltip content={labels.zoomOut} placement="top">
        <Button
          type="button"
          variant="light"
          color="default"
          size="sm"
          isIconOnly
          aria-label={labels.zoomOut}
          isDisabled={zoomOutDisabled}
          onClick={onZoomOut}
        >
          <ZoomOutIcon size={15} />
        </Button>
      </Tooltip>

      <span css={zoomLabelCss} aria-live="polite" aria-atomic="true">
        {zoomPercent}%
      </span>

      <Tooltip content={labels.zoomIn} placement="top">
        <Button
          type="button"
          variant="light"
          color="default"
          size="sm"
          isIconOnly
          aria-label={labels.zoomIn}
          isDisabled={zoomInDisabled}
          onClick={onZoomIn}
        >
          <ZoomInIcon size={15} />
        </Button>
      </Tooltip>

      <Tooltip content={labels.fitWidth} placement="top">
        <Button
          type="button"
          variant="light"
          color="default"
          size="sm"
          isIconOnly
          aria-label={labels.fitWidth}
          onClick={onFitWidth}
        >
          <FitWidthIcon size={15} />
        </Button>
      </Tooltip>

      <span css={spacerCss} />

      {showDownload && (
        <Tooltip content={labels.download} placement="top">
          <Button
            type="button"
            variant="light"
            color="default"
            size="sm"
            isIconOnly
            aria-label={labels.download}
            onClick={onDownload}
          >
            <DownloadIcon size={15} />
          </Button>
        </Tooltip>
      )}

      {showPrint && (
        <Tooltip content={labels.print} placement="top">
          <Button
            type="button"
            variant="light"
            color="default"
            size="sm"
            isIconOnly
            aria-label={labels.print}
            onClick={onPrint}
          >
            <PrintIcon size={15} />
          </Button>
        </Tooltip>
      )}
    </div>
  );
}
