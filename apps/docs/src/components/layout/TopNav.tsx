/** @jsxImportSource @emotion/react */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { css } from '@emotion/react';
import { useEffect, useState } from 'react';
import { Search, type Locale } from '@timeui/react';
import type { Navigation } from '@/lib/navigation';
import type { DocsMessages } from '@/lib/docs-i18n';
import { ThemeToggle } from './ThemeToggle';
import { LocaleToggle } from './LocaleToggle';

interface Props {
  navigation: Navigation;
  messages: DocsMessages;
  locale: Locale;
}

const GITHUB_URL = 'https://github.com/timeui/timeui';

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 .5C5.4.5 0 5.9 0 12.5c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6C20.6 22.3 24 17.8 24 12.5 24 5.9 18.6.5 12 .5z" />
  </svg>
);

export function TopNav({ navigation, messages, locale }: Props) {
  const pathname = usePathname();
  const activeSection = pathname.match(/\/docs\/([^/]+)/)?.[1];
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      css={css`
        position: sticky;
        top: 0;
        z-index: 9999;
        height: 48px;
        background: var(--c-nav-bg);
        backdrop-filter: saturate(180%) blur(20px);
        -webkit-backdrop-filter: saturate(180%) blur(20px);
        border-bottom: 1px solid ${scrolled ? 'var(--c-hairline)' : 'transparent'};
        transition: border-color 320ms cubic-bezier(0.42, 0, 0.18, 1);
      `}
    >
      <div
        css={css`
          height: 100%;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          align-items: center;
          gap: 28px;
          font-family: var(--docs-sans);
        `}
      >
        {/* Brand — Apple-style: clean wordmark, no chip */}
        <Link
          href={`/${locale}/docs/getting-started/introduction`}
          css={css`
            font-size: 20px;
            font-weight: 500;
            line-height: 1;
            color: var(--c-text);
            letter-spacing: -0.012em;
            transition: opacity 200ms;
            &:hover {
              opacity: 0.7;
            }
          `}
        >
          TimeUI
        </Link>

        {/* Primary tabs — Apple's text-only rhythm */}
        <nav
          aria-label="Primary"
          css={css`
            display: flex;
            align-items: center;
            gap: 4px;
            height: 100%;
          `}
        >
          {navigation.sections.map((s) => {
            const active = s.slug === activeSection;
            const firstItem = s.items[0];
            return (
              <Link
                key={s.slug}
                href={firstItem?.href ?? `/${locale}/docs/${s.slug}`}
                css={css`
                  display: inline-flex;
                  align-items: center;
                  padding: 0 12px;
                  height: 100%;
                  font-size: 12px;
                  font-weight: ${active ? 500 : 400};
                  letter-spacing: -0.005em;
                  color: ${active ? 'var(--c-text)' : 'var(--c-text-secondary)'};
                  transition: color 200ms ease;
                  &:hover {
                    color: var(--c-text);
                  }
                `}
              >
                {messages.sections[s.slug] ?? s.slug}
              </Link>
            );
          })}
        </nav>

        <div
          css={css`
            flex: 1;
          `}
        />

        {/* Search trigger — library Search component */}
        <Search size="sm" placeholder={messages.nav.searchPlaceholder} shortcut="⌘K" disabled />

        <div
          css={css`
            display: flex;
            align-items: center;
            gap: 2px;
          `}
        >
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={messages.nav.github}
            css={css`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              color: var(--c-text-secondary);
              transition:
                background 200ms,
                color 200ms;
              &:hover {
                background: var(--c-bg-tertiary);
                color: var(--c-text);
              }
            `}
          >
            <GithubIcon />
          </a>
          <LocaleToggle locale={locale} label={messages.header.toggleLocale} />
          <ThemeToggle
            labelLight={messages.header.toggleThemeLight}
            labelDark={messages.header.toggleThemeDark}
          />
        </div>
      </div>
    </header>
  );
}
