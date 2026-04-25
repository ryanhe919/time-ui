/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-25
 * @description 文档阅读进度条 — 顶部 2px 渐变指示，跟随滚动。
 */

'use client';

import { css } from '@emotion/react';
import { useEffect, useRef, useState } from 'react';

const trackStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 1200;
  pointer-events: none;
  background: transparent;
`;

const fillStyles = css`
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--c-iris) 0%, var(--c-accent) 100%);
  transform-origin: left;
  transition: width 120ms linear;
  will-change: width;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const compute = () => {
      rafRef.current = null;
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      const next = window.scrollY / total;
      const clamped = next < 0 ? 0 : next > 1 ? 1 : next;
      setProgress(clamped);
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <div css={trackStyles} aria-hidden="true">
      <div css={fillStyles} style={{ width: `${progress * 100}%` }} />
    </div>
  );
}
