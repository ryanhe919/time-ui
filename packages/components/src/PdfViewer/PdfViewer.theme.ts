/**
 * @author Ryan He
 * @description 将 TimeUI 主题 token 映射到 PdfViewer 容器/canvas 的样式辅助函数。
 */

import { css, type SerializedStyles } from '@emotion/react';
import type { TimeUITheme } from '@timeui/themes';

function toCssLength(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? `${value}px` : value;
}

export function buildContainerCss(
  theme: TimeUITheme,
  opts: { width?: number | string; height?: number | string },
): SerializedStyles {
  const widthCss = toCssLength(opts.width) ?? '100%';
  const heightCss = toCssLength(opts.height) ?? '600px';

  return css`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: ${widthCss};
    height: ${heightCss};
    min-width: 0;
    background-color: ${theme.colors.bg.surface};
    border: ${theme.borders.width.thin} solid ${theme.colors.border.default};
    border-radius: ${theme.componentRadius.md};
    overflow: hidden;
    color: ${theme.colors.text.primary};
    font-family: ${theme.typography.fontFamily.sans};

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
      }
    }
  `;
}

export function buildScrollAreaCss(theme: TimeUITheme): SerializedStyles {
  return css`
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    background-color: ${theme.colors.bg.muted};
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 16px;
    outline: none;

    &:focus-visible {
      box-shadow: inset 0 0 0 2px ${theme.colors.primary[500]};
    }
  `;
}

export function buildCanvasCss(theme: TimeUITheme): SerializedStyles {
  return css`
    display: block;
    flex: none;
    margin-inline: auto;
    background-color: ${theme.colors.bg.canvas};
    box-shadow: ${theme.shadows.sm};
    max-width: none;
  `;
}

export function buildStatusOverlayCss(theme: TimeUITheme): SerializedStyles {
  return css`
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.fontSize.sm};
  `;
}

export function buildPageAnnouncerCss(): SerializedStyles {
  // visually-hidden but still announced by screen readers
  return css`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
}
