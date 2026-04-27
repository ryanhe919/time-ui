/**
 * @author Ryan He
 * @description PdfViewer 组件的类型定义。
 */

import type { CSSProperties, ReactNode } from 'react';

export type PdfViewerSource = string | URL | ArrayBuffer | Uint8Array | Blob;

export type PdfViewerDefaultZoom = 'page-fit' | 'page-width' | number;

export interface PdfViewerToolbarConfig {
  /** Show download button. */
  download?: boolean;
  /** Show print button. */
  print?: boolean;
  /** Show numeric page-input field. */
  pageInput?: boolean;
}

export interface PdfViewerToolbarLabels {
  toolbarLabel: string;
  prevPage: string;
  nextPage: string;
  zoomIn: string;
  zoomOut: string;
  fitWidth: string;
  fitPage: string;
  download: string;
  print: string;
  pageOf: (current: number, total: number) => string;
}

export interface PdfViewerLoadInfo {
  numPages: number;
}

export interface PdfViewerProps {
  /** PDF source. URL strings are fetched, buffers/Blobs are used directly. */
  source: PdfViewerSource;

  /** Initial page (uncontrolled). 1-based. */
  defaultPage?: number;
  /** Controlled current page. 1-based. */
  page?: number;
  onPageChange?: (page: number) => void;

  /** Controlled zoom (1 = 100%). */
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  /** Initial zoom mode or value. */
  defaultZoom?: PdfViewerDefaultZoom;
  /** Minimum zoom. Default 0.25. */
  minZoom?: number;
  /** Maximum zoom. Default 4. */
  maxZoom?: number;

  /** Show toolbar. Default true. */
  showToolbar?: boolean;
  /** Toolbar feature toggles. */
  toolbar?: PdfViewerToolbarConfig;

  /** Fired when the PDF is loaded. */
  onLoad?: (info: PdfViewerLoadInfo) => void;
  /** Fired when loading or rendering fails. */
  onError?: (err: Error) => void;

  /** Custom loading fallback. */
  loadingFallback?: ReactNode;
  /** Custom error fallback (node or render-fn). */
  errorFallback?: ReactNode | ((err: Error) => ReactNode);

  /** Override pdfjs-dist worker URL. */
  workerSrc?: string;

  /** Container width. Default '100%'. */
  width?: number | string;
  /** Container height. Default '600px'. */
  height?: number | string;

  className?: string;
  style?: CSSProperties;
  id?: string;
  'aria-label'?: string;

  /** Pass-through data-* attrs. */
  [dataAttr: `data-${string}`]: string | number | boolean | undefined;
}
