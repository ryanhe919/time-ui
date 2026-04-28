/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-28
 * @description LiveEditor 动态加载期的骨架占位（spec v2 §2）。
 *
 *              `LiveDemo.tsx` 用 `next/dynamic({ ssr: false, loading: ... })`
 *              异步拉 sucrase + CodeMirror chunk。在 chunk 加载完成前需要一个
 *              视觉占位让用户感知"正在加载"。
 *
 *              视觉规格沿用 LiveDemo 静态 shell：相同的 padding / 边框 / 圆角，
 *              不引入新 CSS 变量。skeleton 用 `prefers-reduced-motion` 关闭闪烁。
 *              role="status" + aria-busy 让 SR 知道这是过渡态而非缺失内容。
 */

'use client';

import { css, keyframes } from '@emotion/react';

const shimmer = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

/**
 * 与 LiveDemo / LiveEditor 共享的外壳样式。本意是不引第三个 file，
 * 让 skeleton 单文件就能跑；与 LiveDemo 静态 shell 保持视觉一致。
 */
const shellCss = css`
  margin: 32px 0;
  border-radius: var(--r-card);
  overflow: hidden;
  background: var(--c-bg);
  border: 1px solid var(--c-hairline);
  box-shadow: var(--c-shadow-card);
  font-family: var(--docs-sans);
`;

const previewSlotCss = css`
  padding: 56px 32px;
  min-height: 160px;
  background: var(--c-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const skeletonBlockCss = css`
  width: 220px;
  height: 36px;
  border-radius: var(--r-cta);
  background: var(--c-hairline);
  animation: ${shimmer} 1.4s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.7;
  }
`;

const headerCss = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid var(--c-hairline);
  background: var(--c-bg);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--c-text-tertiary);
`;

export function LiveEditorSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading editor" css={shellCss}>
      <div css={previewSlotCss}>
        <span css={skeletonBlockCss} aria-hidden="true" />
      </div>
      <div css={headerCss}>
        <span>Preview · Loading…</span>
      </div>
    </div>
  );
}
