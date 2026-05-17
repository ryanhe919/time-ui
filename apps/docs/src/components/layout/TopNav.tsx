/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 TopNav 布局组件。
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { css } from '@emotion/react';
import { useEffect, useMemo, useState } from 'react';
import { Button, Search, SearchDialog, type Locale } from '@timeui/react';
import type { Navigation } from '@/lib/navigation';
import type { DocsMessages } from '@/lib/docs-i18n';
import { buildDocsSearchIndex, type DocsSearchItem } from '@/lib/docs-search-index';
import logo from '@/assets/logo.png';
import { AssistantDrawer } from '@/components/assistant/AssistantDrawer';
import { ThemeToggle } from './ThemeToggle';
import { LocaleToggle } from './LocaleToggle';

interface Props {
  navigation: Navigation;
  messages: DocsMessages;
  locale: Locale;
  /** `@timeui/react` 当前版本号，渲染为 logo 右侧的版本徽标。 */
  version?: string;
}

const GITHUB_URL = 'https://github.com/ryanhe919/time-ui';

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 .5C5.4.5 0 5.9 0 12.5c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6C20.6 22.3 24 17.8 24 12.5 24 5.9 18.6.5 12 .5z" />
  </svg>
);

// 四角星造型，保持和 github / 主题图标同一视觉密度。
const AssistantIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2.5c.3 0 .6.2.7.5l1.6 4.2c.3.7.8 1.3 1.5 1.5l4.2 1.6c.7.3.7 1.2 0 1.5l-4.2 1.6c-.7.3-1.3.8-1.5 1.5l-1.6 4.2c-.3.7-1.2.7-1.5 0l-1.6-4.2c-.3-.7-.8-1.3-1.5-1.5l-4.2-1.6c-.7-.3-.7-1.2 0-1.5l4.2-1.6c.7-.3 1.3-.8 1.5-1.5l1.6-4.2c.1-.3.4-.5.7-.5zM18.5 3a.5.5 0 01.5.4l.3.7c.1.3.3.5.6.6l.7.3a.5.5 0 010 .9l-.7.3c-.3.1-.5.3-.6.6l-.3.7a.5.5 0 01-.9 0l-.3-.7c-.1-.3-.3-.5-.6-.6l-.7-.3a.5.5 0 010-.9l.7-.3c.3-.1.5-.3.6-.6l.3-.7a.5.5 0 01.4-.4z" />
  </svg>
);

export function TopNav({ navigation, messages, locale, version }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const activeSection = pathname.match(/\/docs\/([^/]+)/)?.[1];
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const searchItems = useMemo(() => buildDocsSearchIndex(navigation, locale), [navigation, locale]);

  return (
    <header
      css={css`
        position: sticky;
        top: 0;
        /* sticky header 层级；低于 popover (1500) / toast (1700) / tooltip (1800)
           让浮层和 toast 能正常盖在 header 之上。 */
        z-index: 1100;
        /* Settle effect: collapse 48 → 44px once the user has scrolled,
           giving the page a quieter "documented" feel after the hero. */
        height: ${scrolled ? 44 : 48}px;
        background: var(--c-nav-bg);
        backdrop-filter: saturate(180%) blur(20px);
        -webkit-backdrop-filter: saturate(180%) blur(20px);
        border-bottom: 1px solid ${scrolled ? 'var(--c-hairline)' : 'transparent'};
        transition:
          height 320ms var(--ease-editorial),
          border-color 320ms var(--ease-editorial);
        @media (prefers-reduced-motion: reduce) {
          transition: none;
        }
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
        <Link
          href={`/${locale}/docs/getting-started/introduction`}
          aria-label="TimeUI"
          css={css`
            display: inline-flex;
            align-items: center;
            gap: 8px;
            line-height: 1;
            transition: transform 320ms var(--ease-editorial);
            &:hover {
              transform: translateX(2px);
            }
          `}
        >
          <Image
            src={logo}
            alt="TimeUI"
            priority
            sizes="160px"
            css={css`
              display: block;
              /* logo 自身有较多透明 padding，渲染高度 68 → 实际可见内容约 20px。 */
              height: 68px;
              width: auto;
              object-fit: contain;
              /* 负边距让 link 在布局上仍占 48px 头部高，img 只是"突破"头部上下沿。 */
              margin-block: -10px;
              transition: filter 240ms var(--ease-editorial);
              html[data-theme='dark'] & {
                filter: invert(1) brightness(1.08);
              }
            `}
          />
          <span
            css={css`
              font-size: 15px;
              font-weight: 650;
              letter-spacing: 0;
              color: var(--c-text);
              line-height: 1;
            `}
          >
            TimeUI
          </span>
          {version && (
            <span
              aria-label={`@timeui/react v${version}`}
              css={css`
                display: inline-flex;
                align-items: center;
                font-family: var(--docs-mono);
                font-size: 10px;
                font-weight: 500;
                letter-spacing: 0.04em;
                line-height: 1;
                padding: 3px 6px;
                border-radius: 4px;
                color: var(--c-iris);
                background: color-mix(in srgb, var(--c-iris) 10%, transparent);
                border: 1px solid color-mix(in srgb, var(--c-iris) 22%, transparent);
              `}
            >
              v{version}
            </span>
          )}
          <span
            aria-hidden
            css={css`
              display: inline-flex;
              align-items: center;
              gap: 4px;
              font-family: var(--docs-mono);
              font-size: 10px;
              letter-spacing: 0.16em;
              color: var(--c-text-tertiary);
              text-transform: uppercase;
              line-height: 1;
            `}
          >
            <span
              css={css`
                color: var(--c-iris);
              `}
            >
              /
            </span>
            DOCS
          </span>
        </Link>

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
                  position: relative;
                  overflow: visible;
                  display: inline-flex;
                  align-items: center;
                  padding: 0 12px;
                  height: 100%;
                  font-size: 12px;
                  font-weight: ${active ? 500 : 400};
                  letter-spacing: -0.005em;
                  color: ${active ? 'var(--c-text)' : 'var(--c-text-secondary)'};
                  transition: color 200ms ease;
                  &::after {
                    content: '';
                    position: absolute;
                    left: 12px;
                    right: 12px;
                    bottom: 4px;
                    height: 1.5px;
                    background: var(--c-accent);
                    transform-origin: left center;
                    transform: ${active ? 'scaleX(1)' : 'scaleX(0)'};
                    opacity: ${active ? 1 : 0};
                    transition:
                      transform 280ms var(--ease-editorial),
                      opacity 280ms var(--ease-editorial);
                  }
                  &:hover {
                    color: var(--c-text);
                  }
                  ${active
                    ? ''
                    : `&:hover::after {
                        transform: scaleX(0.4);
                        opacity: 0.5;
                      }`}
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

        <span
          aria-hidden
          css={css`
            display: inline-block;
            width: 1px;
            height: 14px;
            background: var(--c-hairline);
            margin: 0 12px 0 0;
          `}
        />

        <Search
          size="sm"
          placeholder={messages.nav.searchPlaceholder}
          shortcut="⌘K"
          onClick={() => setSearchOpen(true)}
          aria-label={messages.nav.searchPlaceholder}
        />
        <SearchDialog
          isOpen={searchOpen}
          onOpenChange={setSearchOpen}
          shortcut="mod+k"
          items={searchItems}
          placeholder={messages.nav.searchPlaceholder}
          emptyMessage={locale === 'en' ? 'No matching pages' : '没有匹配的页面'}
          aria-label={messages.nav.searchPlaceholder}
          topOffset="clamp(56px, 12vh, 140px)"
          onSelect={(item) => {
            const href = (item as DocsSearchItem).href;
            if (href) router.push(href);
          }}
        />

        <div
          css={css`
            display: flex;
            align-items: center;
            gap: 2px;
          `}
        >
          <Button
            isIconOnly
            variant="light"
            color="default"
            size="xs"
            radius="full"
            onClick={() => setAssistantOpen(true)}
            aria-label={messages.assistant.openLabel}
            aria-expanded={assistantOpen || undefined}
          >
            <AssistantIcon />
          </Button>
          <Button
            as="a"
            isIconOnly
            variant="light"
            color="default"
            size="xs"
            radius="full"
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={messages.nav.github}
          >
            <GithubIcon />
          </Button>
          <LocaleToggle locale={locale} label={messages.header.toggleLocale} />
          <ThemeToggle
            labelLight={messages.header.toggleThemeLight}
            labelDark={messages.header.toggleThemeDark}
          />
        </div>
      </div>

      <AssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        locale={locale}
        messages={messages.assistant}
      />
    </header>
  );
}
