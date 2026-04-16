/** @jsxImportSource @emotion/react */
'use client';

import { useEffect, useState } from 'react';
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

export function TableOfContents({ label }: Props) {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const article =
      document.querySelector('.mdx-article') ||
      document.querySelector('main article') ||
      document.querySelector('main');
    if (!article) return;

    const els = Array.from(article.querySelectorAll<HTMLHeadingElement>('h2, h3'));
    const collected: Heading[] = els.map((el) => {
      if (!el.id) {
        el.id = (el.textContent ?? '')
          .trim()
          .toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, '-')
          .replace(/^-+|-+$/g, '');
      }
      return {
        id: el.id,
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

  if (headings.length === 0) return null;

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
        css={css`
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--c-text-tertiary);
          margin-bottom: 16px;
        `}
      >
        {label}
      </div>
      <ul
        css={css`
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        `}
      >
        {headings.map((h) => {
          const active = h.id === activeId;
          return (
            <li
              key={h.id}
              css={css`
                padding-left: ${h.level === 3 ? 14 : 0}px;
              `}
            >
              <a
                href={`#${h.id}`}
                css={css`
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  font-size: 12px;
                  line-height: 1.4;
                  color: ${active ? 'var(--c-accent)' : 'var(--c-text-secondary)'};
                  font-weight: ${active ? 500 : 400};
                  letter-spacing: -0.003em;
                  transition: color 200ms;
                  &:hover {
                    color: var(--c-text);
                  }
                `}
              >
                <span
                  aria-hidden
                  css={css`
                    flex-shrink: 0;
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    background: ${active ? 'var(--c-accent)' : 'transparent'};
                    transition: background 200ms;
                  `}
                />
                <span>{h.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
