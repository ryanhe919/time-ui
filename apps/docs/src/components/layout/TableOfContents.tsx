/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 TableOfContents 布局组件。
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { css } from '@emotion/react';

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface Props {
  label: string;
}

const DOT_DIAMETER = 7;
const DOT_RADIUS = DOT_DIAMETER / 2;

function toSlug(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'section';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function TableOfContents({ label }: Props) {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [dotOffset, setDotOffset] = useState<number>(0);
  const itemRefs = useRef<Map<string, HTMLLIElement | null>>(new Map());

  useEffect(() => {
    const article =
      document.querySelector('.mdx-article') ||
      document.querySelector('main article') ||
      document.querySelector('main');
    if (!article) return;

    const els = Array.from(article.querySelectorAll<HTMLHeadingElement>('h2, h3'));
    const seen = new Map<string, number>();
    const collected: Heading[] = els.map((el) => {
      const baseId = el.id || toSlug(el.textContent ?? '');
      const occurrence = seen.get(baseId) ?? 0;
      const nextId = occurrence === 0 ? baseId : `${baseId}-${occurrence + 1}`;

      seen.set(baseId, occurrence + 1);

      if (el.id !== nextId) {
        el.id = nextId;
      }

      return {
        id: nextId,
        text: el.textContent?.trim() ?? '',
        level: el.tagName === 'H2' ? 2 : 3,
      };
    });
    setHeadings(collected);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top,
          );
        if (visible[0]) setActiveId((visible[0].target as HTMLElement).id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const article =
      document.querySelector<HTMLElement>('.mdx-article') ||
      document.querySelector<HTMLElement>('main article') ||
      document.querySelector<HTMLElement>('main');
    if (!article) return;

    const computeProgress = () => {
      const rect = article.getBoundingClientRect();
      const articleTop = rect.top + window.scrollY;
      const articleHeight = article.offsetHeight;
      const viewportHeight = window.innerHeight;
      const denom = articleHeight - viewportHeight;
      if (denom <= 0) {
        setProgress(0);
        return;
      }
      const next = clamp((window.scrollY - articleTop) / denom, 0, 1);
      setProgress(next);
    };

    computeProgress();
    window.addEventListener('scroll', computeProgress, { passive: true });
    window.addEventListener('resize', computeProgress, { passive: true });
    return () => {
      window.removeEventListener('scroll', computeProgress);
      window.removeEventListener('resize', computeProgress);
    };
  }, [pathname, headings.length]);

  useEffect(() => {
    if (!activeId) return;
    const el = itemRefs.current.get(activeId);
    if (!el) return;
    setDotOffset(el.offsetTop + el.offsetHeight / 2 - DOT_RADIUS);
  }, [activeId, headings]);

  if (headings.length === 0) return null;

  const totalLabel = headings.length.toString().padStart(2, '0');

  return (
    <nav
      aria-label={label}
      css={css`
        position: sticky;
        top: 80px;
        padding: 40px 0 40px 24px;
        max-height: calc(100vh - 80px);
        overflow-y: auto;
        font-family: var(--docs-sans);
      `}
    >
      <div
        aria-hidden
        css={css`
          height: 2px;
          width: 100%;
          background: var(--c-leader);
          border-radius: 1px;
          overflow: hidden;
          margin-bottom: 24px;
        `}
      >
        <div
          css={css`
            height: 100%;
            background: linear-gradient(90deg, var(--c-iris) 0%, var(--c-accent) 100%);
            transition: width 120ms linear;
            @media (prefers-reduced-motion: reduce) {
              transition: none;
            }
          `}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div
        css={css`
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--c-text-tertiary);
          margin-bottom: 16px;
        `}
      >
        <span>{label}</span>
        <span
          aria-hidden
          css={css`
            color: var(--c-text-tertiary);
          `}
        >
          {' / '}
        </span>
        <span
          css={css`
            font-family: var(--docs-mono);
            color: var(--c-iris);
            font-weight: 500;
            letter-spacing: 0.02em;
          `}
        >
          {totalLabel}
        </span>
      </div>
      <ul
        css={css`
          position: relative;
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            left: 0;
            width: 1px;
            background: var(--c-leader);
          }
        `}
      >
        <span
          aria-hidden
          css={css`
            position: absolute;
            top: 0;
            left: -3px;
            width: ${DOT_DIAMETER}px;
            height: ${DOT_DIAMETER}px;
            border-radius: 50%;
            background: var(--c-iris);
            box-shadow: 0 0 0 4px var(--c-iris-soft);
            transition:
              transform 360ms var(--ease-editorial),
              opacity 240ms var(--ease-editorial);
            pointer-events: none;
            @media (prefers-reduced-motion: reduce) {
              transition: none;
            }
          `}
          style={{
            transform: `translateY(${dotOffset}px)`,
            opacity: activeId ? 1 : 0,
          }}
        />
        {headings.map((h) => {
          const active = h.id === activeId;
          return (
            <li
              key={h.id}
              ref={(node) => {
                if (node) {
                  itemRefs.current.set(h.id, node);
                } else {
                  itemRefs.current.delete(h.id);
                }
              }}
              css={css`
                padding-left: ${h.level === 3 ? 32 : 16}px;
              `}
            >
              <a
                href={`#${h.id}`}
                css={css`
                  display: block;
                  font-size: 12px;
                  line-height: 1.4;
                  color: ${active ? 'var(--c-iris)' : 'var(--c-text-secondary)'};
                  font-weight: ${active ? 500 : 400};
                  letter-spacing: -0.003em;
                  transition: color 200ms var(--ease-editorial);
                  &:hover {
                    color: var(--c-text);
                  }
                  @media (prefers-reduced-motion: reduce) {
                    transition: none;
                  }
                `}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
