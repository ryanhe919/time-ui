/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @description 实现 PdfViewer 组件的核心渲染与交互逻辑（基于 pdfjs-dist，按需懒加载）。
 */

// Side-effect import 触发 @timeui/themes 对 @emotion/react Theme 的 module augmentation；
// 否则 tsup 的独立 DTS bundle 看不到 theme.colors / theme.typography 的类型。
import type {} from '@timeui/themes';

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { css, useTheme } from '@emotion/react';

import { PdfViewerToolbar } from './PdfViewer.toolbar';
import {
  buildContainerCss,
  buildScrollAreaCss,
  buildCanvasCss,
  buildStatusOverlayCss,
  buildPageAnnouncerCss,
} from './PdfViewer.theme';
import type { PdfViewerProps, PdfViewerSource, PdfViewerToolbarConfig } from './PdfViewer.types';

// ─── pdfjs lazy types ─────────────────────────────────────────────────────────
// 这些类型来自 pdfjs-dist（optional peer），通过动态 import 在客户端按需加载。
// 类型层用结构化最小子集，避免直接 `import type` 锁死 pdfjs-dist 的 d.ts 版本。

interface PdfRenderTask {
  promise: Promise<void>;
  cancel: () => void;
}

interface PdfPageViewport {
  width: number;
  height: number;
}

interface PdfPageProxy {
  getViewport(opts: { scale: number }): PdfPageViewport;
  render(opts: {
    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfPageViewport;
    transform?: number[];
  }): PdfRenderTask;
}

interface PdfDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPageProxy>;
}

interface PdfDocumentLoadingTask {
  promise: Promise<PdfDocumentProxy>;
  destroy(): Promise<void> | void;
}

// pdfjs-dist 模块的最小结构子集 —— 用结构化类型，绕过 `import type 'pdfjs-dist'` 在 PR 流水线
// 上无法解析 .d.ts 子路径的问题（不同 pdfjs-dist 版本 .d.ts 拓扑差异较大）。
interface PdfjsModule {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(src: unknown): PdfDocumentLoadingTask;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function sourceToBuffer(source: PdfViewerSource): Promise<ArrayBuffer | Uint8Array> {
  if (typeof source === 'string') {
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error(`Failed to fetch PDF (${res.status} ${res.statusText})`);
    }
    return await res.arrayBuffer();
  }
  if (source instanceof URL) {
    const res = await fetch(source.toString());
    if (!res.ok) {
      throw new Error(`Failed to fetch PDF (${res.status} ${res.statusText})`);
    }
    return await res.arrayBuffer();
  }
  if (source instanceof ArrayBuffer) {
    return source.slice(0);
  }
  if (source instanceof Uint8Array) {
    // Copy to detach from any external lifetime.
    const copy = new Uint8Array(source.byteLength);
    copy.set(source);
    return copy;
  }
  if (typeof Blob !== 'undefined' && source instanceof Blob) {
    return await source.arrayBuffer();
  }
  throw new Error('Unsupported PDF source type');
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function resolveDefaultZoomMode(
  defaultZoom: NonNullable<PdfViewerProps['defaultZoom']>,
): 'fit' | 'width' | 'custom' {
  if (defaultZoom === 'page-fit') return 'fit';
  if (defaultZoom === 'page-width') return 'width';
  return 'custom';
}

function resolveDefaultZoomValue(defaultZoom: NonNullable<PdfViewerProps['defaultZoom']>): number {
  if (typeof defaultZoom === 'number') return defaultZoom;
  return 1;
}

function resolveDefaultWorkerSrc(): string | null {
  // 仅在 ESM + bundler (Vite/webpack5) 下解析得到具体 URL。SSR / 测试 / 旧 bundler 走 catch。
  try {
    return new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  } catch {
    return null;
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export const PdfViewer = forwardRef<HTMLDivElement, PdfViewerProps>(function PdfViewer(props, ref) {
  const {
    source,
    defaultPage = 1,
    page: pageProp,
    onPageChange,
    zoom: zoomProp,
    onZoomChange,
    defaultZoom = 'page-width',
    minZoom = 0.25,
    maxZoom = 4,
    showToolbar = true,
    toolbar,
    onLoad,
    onError,
    loadingFallback,
    errorFallback,
    workerSrc,
    width,
    height,
    className,
    style,
    id,
    'aria-label': ariaLabel = 'PDF document',
    ...rest
  } = props;

  const theme = useTheme();

  // ─── state ────────────────────────────────────────────────────────────────
  const [numPages, setNumPages] = useState(0);
  const [documentVersion, setDocumentVersion] = useState(0);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [internalPage, setInternalPage] = useState(Math.max(1, defaultPage));
  const currentPage = clamp(pageProp ?? internalPage, 1, Math.max(1, numPages));

  const [zoomMode, setZoomMode] = useState<'fit' | 'width' | 'custom'>(() =>
    resolveDefaultZoomMode(defaultZoom),
  );
  const [internalZoom, setInternalZoom] = useState<number>(() =>
    resolveDefaultZoomValue(defaultZoom),
  );
  const effectiveZoom = zoomProp ?? internalZoom;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ─── refs ─────────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<PdfDocumentProxy | null>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);
  const pdfjsRef = useRef<PdfjsModule | null>(null);

  // Stable callback refs — avoid re-running effects when handlers change identity.
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onPageChangeRef = useRef(onPageChange);
  const onZoomChangeRef = useRef(onZoomChange);
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);
  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  const toolbarConfig: PdfViewerToolbarConfig = useMemo(() => toolbar ?? {}, [toolbar]);

  // ─── document load ────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setNumPages(0);
    if (source === undefined || source === null || source === '') {
      setError(new Error('PDF source is empty'));
      setIsLoading(false);
      onErrorRef.current?.(new Error('PDF source is empty'));
      return;
    }

    let cancelled = false;
    let loadingTask: PdfDocumentLoadingTask | null = null;
    const destroyLoadingTask = () => {
      const task = loadingTask;
      loadingTask = null;
      if (!task) return;
      try {
        // LoadingTask owns both the pending load and document resources in
        // PDF.js 4/5/6; DocumentProxy.destroy was removed in PDF.js 6.
        void Promise.resolve(task.destroy()).catch(() => undefined);
      } catch {
        // A failed load may have already torn down its worker.
      }
    };
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        // 动态 import 保证 SSR 安全 + 主 bundle 不打包 pdfjs-dist。
        // 用 `as unknown as` 是为了规避 optional peer 在 PR 环境可能未装的情况下的类型解析错误。
        const mod = (await import(/* @vite-ignore */ 'pdfjs-dist')) as unknown as PdfjsModule;
        if (cancelled) return;

        pdfjsRef.current = mod;

        // 配置 worker —— 调用方显式传入时强制覆盖，否则只在尚未配置过时设置默认值。
        const resolvedWorker = workerSrc ?? resolveDefaultWorkerSrc();
        if (resolvedWorker && (workerSrc || !mod.GlobalWorkerOptions.workerSrc)) {
          mod.GlobalWorkerOptions.workerSrc = resolvedWorker;
        }

        const data = await sourceToBuffer(source);
        if (cancelled) return;

        loadingTask = mod.getDocument({ data });
        const doc = await loadingTask.promise;
        if (cancelled) return;
        pdfDocRef.current = doc;

        setNumPages(doc.numPages);
        // A replacement PDF may have the same page count. Its identity must
        // still trigger rendering, including recovery from a previous error.
        setDocumentVersion((version) => version + 1);
        setIsLoading(false);
        onLoadRef.current?.({ numPages: doc.numPages });
      } catch (err) {
        if (cancelled) return;
        destroyLoadingTask();
        pdfDocRef.current = null;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        setIsLoading(false);
        onErrorRef.current?.(e);
      }
    })();

    return () => {
      cancelled = true;
      const task = renderTaskRef.current;
      if (task) {
        try {
          task.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }
      pdfDocRef.current = null;
      destroyLoadingTask();
    };
    // workerSrc / source change → reload from scratch
  }, [source, workerSrc]);

  // Fit modes follow the page area's dimensions when a responsive layout,
  // drawer or resized window changes the available space.
  useEffect(() => {
    const area = scrollAreaRef.current;
    if (!area || zoomMode === 'custom' || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const width = area.clientWidth;
      const height = area.clientHeight;
      setViewportSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      );
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, [zoomMode, documentVersion, error]);

  // ─── page render ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const doc = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;
    if (numPages <= 0) return;

    const safePage = clamp(currentPage, 1, numPages);
    let cancelled = false;

    // Cancel any in-flight render before starting a new one.
    const prevTask = renderTaskRef.current;
    if (prevTask) {
      try {
        prevTask.cancel();
      } catch {
        // ignore
      }
      renderTaskRef.current = null;
    }

    // Both `cancelled` and `pdfDocRef.current !== doc` must be checked after every
    // await: the doc-load effect may have swapped (or destroyed) `doc` between awaits.
    const isStale = () => cancelled || pdfDocRef.current !== doc;

    (async () => {
      try {
        const pageObj = await doc.getPage(safePage);
        if (isStale()) return;

        // Decide zoom factor for fit modes against current scroll area.
        let scale = effectiveZoom;
        if (zoomMode === 'width' && scrollAreaRef.current) {
          const baseViewport = pageObj.getViewport({ scale: 1 });
          const containerW = scrollAreaRef.current.clientWidth - 32; // padding 16+16
          if (containerW > 0 && baseViewport.width > 0) {
            scale = clamp(containerW / baseViewport.width, minZoom, maxZoom);
          }
        } else if (zoomMode === 'fit' && scrollAreaRef.current) {
          const baseViewport = pageObj.getViewport({ scale: 1 });
          const containerW = scrollAreaRef.current.clientWidth - 32;
          const containerH = scrollAreaRef.current.clientHeight - 32;
          if (
            containerW > 0 &&
            containerH > 0 &&
            baseViewport.width > 0 &&
            baseViewport.height > 0
          ) {
            scale = clamp(
              Math.min(containerW / baseViewport.width, containerH / baseViewport.height),
              minZoom,
              maxZoom,
            );
          }
        }

        const viewport = pageObj.getViewport({ scale });
        if (zoomProp === undefined && zoomMode !== 'custom') {
          // The percentage display and +/- actions use the scale actually
          // applied to the canvas rather than the initial 100% placeholder.
          setInternalZoom(scale);
        }
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(viewport.width * pixelRatio));
        canvas.height = Math.max(1, Math.floor(viewport.height * pixelRatio));
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (isStale()) return;
        const task = pageObj.render({
          canvas,
          canvasContext: ctx,
          viewport,
          transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        renderTaskRef.current = task;
        await task.promise;
        if (isStale()) return;
        renderTaskRef.current = null;
      } catch (err) {
        // pdfjs throws RenderingCancelledException when cancel() runs — swallow it silently.
        if (isStale()) return;
        const name = (err as { name?: string } | null)?.name;
        if (name === 'RenderingCancelledException') return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onErrorRef.current?.(e);
      }
    })();

    return () => {
      cancelled = true;
    };
    // We intentionally include numPages so the first render fires after the doc loads.
  }, [
    currentPage,
    effectiveZoom,
    zoomMode,
    numPages,
    minZoom,
    maxZoom,
    documentVersion,
    viewportSize,
    zoomProp,
  ]);

  // ─── controlled-zoom sync ─────────────────────────────────────────────────
  useEffect(() => {
    if (zoomProp !== undefined) {
      setZoomMode('custom');
    }
  }, [zoomProp]);

  // ─── handlers ─────────────────────────────────────────────────────────────
  const goToPage = useCallback(
    (next: number) => {
      const safe = clamp(next, 1, Math.max(1, numPages));
      if (pageProp === undefined) {
        setInternalPage(safe);
      }
      onPageChangeRef.current?.(safe);
    },
    [numPages, pageProp],
  );

  const setZoomValue = useCallback(
    (next: number) => {
      const safe = clamp(next, minZoom, maxZoom);
      setZoomMode('custom');
      if (zoomProp === undefined) {
        setInternalZoom(safe);
      }
      onZoomChangeRef.current?.(safe);
    },
    [minZoom, maxZoom, zoomProp],
  );

  const handlePrev = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage]);
  const handleNext = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage]);

  const handleZoomIn = useCallback(() => {
    setZoomValue(Math.min(maxZoom, effectiveZoom + 0.1));
  }, [effectiveZoom, maxZoom, setZoomValue]);
  const handleZoomOut = useCallback(() => {
    setZoomValue(Math.max(minZoom, effectiveZoom - 0.1));
  }, [effectiveZoom, minZoom, setZoomValue]);

  const handleFitWidth = useCallback(() => {
    setZoomMode('width');
  }, []);

  const handleDownload = useCallback(() => {
    if (typeof window === 'undefined' || typeof source !== 'string') return;
    try {
      const a = document.createElement('a');
      a.href = source;
      a.download = '';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore — download requires a string URL source.
    }
  }, [source]);

  const handlePrint = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.print();
    } catch {
      // ignore — print may be blocked by browser.
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.defaultPrevented) return;
      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          handlePrev();
          break;
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          handleNext();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleFitWidth();
          break;
        default:
          break;
      }
    },
    [handlePrev, handleNext, handleZoomIn, handleZoomOut, handleFitWidth],
  );

  // ─── render ───────────────────────────────────────────────────────────────
  const containerCss = buildContainerCss(theme, { width, height });
  const scrollAreaCss = buildScrollAreaCss(theme);
  const canvasCss = buildCanvasCss(theme);
  const overlayCss = buildStatusOverlayCss(theme);
  const announcerCss = buildPageAnnouncerCss();

  const showError = error !== null;
  const showLoading = !showError && isLoading;
  const showCanvas = !showError;

  const errorContent: import('react').ReactNode | null = showError
    ? typeof errorFallback === 'function'
      ? (errorFallback as (e: Error) => import('react').ReactNode)(error as Error)
      : (errorFallback ?? <span>Failed to load PDF: {(error as Error).message}</span>)
    : null;

  const loadingContent = showLoading ? (loadingFallback ?? <span>Loading PDF…</span>) : null;

  // Compose ref forwarding so we can also keep an internal ref.
  const setContainerRef = (el: HTMLDivElement | null) => {
    containerRef.current = el;
    if (typeof ref === 'function') {
      ref(el);
    } else if (ref) {
      (ref as { current: HTMLDivElement | null }).current = el;
    }
  };

  return (
    <div
      ref={setContainerRef}
      role="region"
      aria-label={ariaLabel}
      id={id}
      className={className}
      style={style}
      css={containerCss}
      data-loading={showLoading || undefined}
      data-error={showError || undefined}
      {...rest}
    >
      {showToolbar && (
        <PdfViewerToolbar
          currentPage={currentPage}
          numPages={numPages}
          zoom={effectiveZoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          onPrev={handlePrev}
          onNext={handleNext}
          onGoToPage={goToPage}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitWidth={handleFitWidth}
          onDownload={typeof source === 'string' ? handleDownload : undefined}
          onPrint={handlePrint}
          config={toolbarConfig}
          isLoading={isLoading}
        />
      )}

      {showError ? (
        <div role="alert" css={overlayCss}>
          {errorContent}
        </div>
      ) : (
        <div
          ref={scrollAreaRef}
          tabIndex={0}
          role="group"
          aria-label="PDF page area"
          onKeyDown={handleKeyDown}
          css={scrollAreaCss}
          data-slot="pdf-viewer-mount"
        >
          {showCanvas && (
            <canvas
              ref={canvasRef}
              css={canvasCss}
              role="img"
              aria-label="PDF page content"
              data-testid="pdf-canvas"
            />
          )}
          {showLoading && (
            <div
              css={[
                overlayCss,
                css`
                  position: absolute;
                  inset: 0;
                `,
              ]}
              data-slot="pdf-viewer-loading"
            >
              {loadingContent}
            </div>
          )}
        </div>
      )}

      <span css={announcerCss} aria-live="polite" data-slot="pdf-viewer-announcer">
        {numPages > 0 ? `Page ${currentPage} of ${numPages}` : ''}
      </span>
    </div>
  );
});

PdfViewer.displayName = 'PdfViewer';
