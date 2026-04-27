/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 验证 Card 组件族的渲染、交互、视觉治理与无障碍。
 */

import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { darkTheme, lightTheme } from '@timeui/themes';
import { Card, CardHeader, CardBody, CardFooter } from '../';
import { renderWithProviders } from '@timeui/react/test-utils';

function extractEmittedStyles(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((s) => s.textContent ?? '')
    .join('\n');
}

describe('Card — contract', () => {
  it('#1 renders children + data-slot on subcomponents', () => {
    const { container } = renderWithProviders(
      <Card>
        <CardHeader title="T" subtitle="S" />
        <CardBody>body</CardBody>
        <CardFooter>footer</CardFooter>
      </Card>,
    );
    expect(container.querySelector('[data-slot="header"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="body"]')).toBeTruthy();
    expect(container.querySelector('[data-slot="footer"]')).toBeTruthy();
    expect(screen.getByText('T')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
    expect(screen.getByText('footer')).toBeInTheDocument();
  });

  it('#2 supports each variant via data-variant', () => {
    const variants = ['flat', 'bordered', 'elevated'] as const;
    for (const v of variants) {
      const { unmount, container } = renderWithProviders(<Card variant={v}>x</Card>);
      expect(container.querySelector(`[data-variant="${v}"]`)).toBeTruthy();
      unmount();
    }
  });

  it('#3 supports each color and size via data attrs', () => {
    const { container, unmount } = renderWithProviders(
      <Card color="primary" size="lg" radius="sm">
        x
      </Card>,
    );
    expect(container.querySelector('[data-color="primary"]')).toBeTruthy();
    expect(container.querySelector('[data-size="lg"]')).toBeTruthy();
    expect(container.querySelector('[data-radius="sm"]')).toBeTruthy();
    unmount();
  });

  it('#3b supports xs and xl size scales (5-tier)', () => {
    for (const s of ['xs', 'xl'] as const) {
      const { container, unmount } = renderWithProviders(<Card size={s}>x</Card>);
      expect(container.querySelector(`[data-size="${s}"]`)).toBeTruthy();
      unmount();
    }
  });

  it('#4 renders as an <a> when href is provided and is pressable', () => {
    renderWithProviders(
      <Card href="/about" aria-label="go">
        link
      </Card>,
    );
    const a = screen.getByRole('link', { name: 'go' });
    expect(a.tagName).toBe('A');
    expect(a.getAttribute('href')).toBe('/about');
    expect(a.getAttribute('data-pressable')).toBe('true');
  });

  it('#5 target=_blank auto adds rel noopener noreferrer', () => {
    renderWithProviders(
      <Card href="https://x.test" target="_blank" aria-label="x">
        ext
      </Card>,
    );
    const a = screen.getByRole('link', { name: 'x' });
    expect(a.getAttribute('rel')).toMatch(/noopener/);
    expect(a.getAttribute('rel')).toMatch(/noreferrer/);
  });

  it('#6 isPressable renders role="button" + tabIndex=0 and fires onPress on click', async () => {
    const onPress = vi.fn();
    renderWithProviders(
      <Card isPressable onPress={onPress} aria-label="p">
        Press
      </Card>,
    );
    const btn = screen.getByRole('button', { name: 'p' });
    expect(btn.getAttribute('tabindex')).toBe('0');
    await userEvent.click(btn);
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('#7 onClick still fires when pressable (not swallowed)', async () => {
    const onClick = vi.fn();
    const onPress = vi.fn();
    renderWithProviders(
      <Card isPressable onClick={onClick} onPress={onPress} aria-label="p">
        x
      </Card>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'p' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('#8 fires onPress on Enter / Space for div-role-button', async () => {
    const onPress = vi.fn();
    renderWithProviders(
      <Card isPressable onPress={onPress} aria-label="p">
        x
      </Card>,
    );
    const btn = screen.getByRole('button', { name: 'p' });
    btn.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('#9 isDisabled suppresses onPress and sets aria-disabled', async () => {
    const onPress = vi.fn();
    renderWithProviders(
      <Card isPressable isDisabled onPress={onPress} aria-label="p">
        x
      </Card>,
    );
    const btn = screen.getByRole('button', { name: 'p' });
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(btn);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('#10 forwards ref and accepts `as`', () => {
    const ref = createRef<HTMLElement>();
    renderWithProviders(
      <Card as="section" ref={ref as never}>
        s
      </Card>,
    );
    expect(ref.current).toBeTruthy();
    expect(ref.current?.tagName).toBe('SECTION');
  });

  it('#11 accentBar=start paints a 3px pseudo-element that becomes 4px on hover', () => {
    renderWithProviders(
      <Card accentBar="start" isHoverable aria-label="ac">
        x
      </Card>,
    );
    const styles = extractEmittedStyles();
    // A rule with width: 3px exists before hover transforms to 4px.
    expect(styles).toMatch(/width:\s*3px/);
    // hover rule flips to 4px
    expect(styles).toMatch(/hover::before[\s\S]*width:\s*4px/);
  });

  it('#12 elevated default shadow is a triple-layered shadow and dark mode uses inset top highlight', () => {
    // Render both light and dark variants so their class-based CSS coexists —
    // Emotion's insertion cache makes remove-then-render unreliable.
    renderWithProviders(
      <Card variant="elevated" aria-label="l">
        x
      </Card>,
      { theme: 'light' },
    );
    renderWithProviders(
      <Card variant="elevated" aria-label="d">
        x
      </Card>,
      { theme: 'dark' },
    );
    const styles = extractEmittedStyles();
    // Light mode: three-layer stack with the three distinct shadow fragments.
    const tripleShadowRegex =
      /box-shadow:\s*0 1px 0 rgba\(17,\s*24,\s*39,\s*0\.04\)[\s\S]*?0 1px 3px[\s\S]*?0 4px 10px -4px/;
    expect(styles).toMatch(tripleShadowRegex);
    // Dark mode: inset top highlight fragment is present somewhere.
    expect(styles).toMatch(/inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.04\)/);
  });

  it('#13 bordered default border is 1px solid and hover does NOT change its thickness — uses inset densification ring', () => {
    renderWithProviders(
      <Card variant="bordered" isHoverable aria-label="b">
        x
      </Card>,
    );
    const styles = extractEmittedStyles();
    // geometry: 1px border on base; no border-width change on hover block.
    expect(styles).toMatch(/border:\s*1px solid/);
    // hover adds inset 0 0 0 1px ring (not a thicker border).
    expect(styles).toMatch(
      /hover:not\(\[aria-disabled='true'\]\)[\s\S]*box-shadow:\s*inset 0 0 0 1px/,
    );
  });

  it('#14 pressable :active has translateY(0.5px) scale(0.998) with 80ms transition-duration', () => {
    renderWithProviders(
      <Card isPressable aria-label="p">
        x
      </Card>,
    );
    const styles = extractEmittedStyles();
    expect(styles).toMatch(
      /active:not\(\[aria-disabled='true'\]\)[\s\S]*translateY\(0\.5px\)\s*scale\(0\.998\)/,
    );
    expect(styles).toMatch(
      /active:not\(\[aria-disabled='true'\]\)[\s\S]*transition-duration:\s*80ms/,
    );
  });

  it('#15 focus-visible paints a focus halo ring layered over existing shadow', () => {
    renderWithProviders(
      <Card isPressable variant="elevated" aria-label="p">
        x
      </Card>,
    );
    const styles = extractEmittedStyles();
    // outline 2px + box-shadow with a low-alpha color-mix focus ring
    expect(styles).toMatch(/focus-visible[\s\S]*outline:\s*2px solid/);
    expect(styles).toMatch(/focus-visible[\s\S]*color-mix\(in srgb[\s\S]*?18%/);
  });

  it('#16 CardFooter justify maps to flex justify-content', () => {
    const { container, unmount } = renderWithProviders(
      <Card>
        <CardFooter justify="between">a</CardFooter>
      </Card>,
    );
    expect(container.querySelector('[data-justify="between"]')).toBeTruthy();
    unmount();

    const { container: c2 } = renderWithProviders(
      <Card>
        <CardFooter justify="start">a</CardFooter>
      </Card>,
    );
    expect(c2.querySelector('[data-justify="start"]')).toBeTruthy();
  });

  it('#17 non-pressable default is a <div> without role=button', () => {
    renderWithProviders(<Card aria-label="s">s</Card>);
    expect(screen.queryByRole('button', { name: 's' })).not.toBeInTheDocument();
  });

  it('#18 explicit rel is preserved for external links', () => {
    renderWithProviders(
      <Card href="https://x.test" target="_blank" rel="external" aria-label="x">
        ext
      </Card>,
    );
    expect(screen.getByRole('link', { name: 'x' })).toHaveAttribute('rel', 'external');
  });

  it('#19 disabled pressable sets tabIndex=-1 and still calls onClick but not onPress', async () => {
    const onClick = vi.fn();
    const onPress = vi.fn();
    renderWithProviders(
      <Card isPressable isDisabled onClick={onClick} onPress={onPress} aria-label="disabled">
        x
      </Card>,
    );
    const btn = screen.getByRole('button', { name: 'disabled' });
    expect(btn).toHaveAttribute('tabindex', '-1');
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('#20 native button semantics are preserved when rendered as button', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <Card as="button" isPressable onPress={onPress}>
        Native button
      </Card>,
    );
    const btn = screen.getByRole('button', { name: 'Native button' });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).not.toHaveAttribute('tabindex');
    fireEvent.keyDown(btn, { key: 'Enter' });
    expect(onPress).not.toHaveBeenCalled();
  });

  it('#21 keyboard handler ignores unrelated keys and native anchors', async () => {
    const onPress = vi.fn();
    const { rerender } = renderWithProviders(
      <Card isPressable onPress={onPress} aria-label="div button">
        x
      </Card>,
    );
    const divButton = screen.getByRole('button', { name: 'div button' });
    divButton.focus();
    await userEvent.keyboard('{Escape}');
    expect(onPress).not.toHaveBeenCalled();

    rerender(
      <Card href="/docs" onPress={onPress} aria-label="native link">
        docs
      </Card>,
    );
    const link = screen.getByRole('link', { name: 'native link' });
    fireEvent.keyDown(link, { key: 'Enter' });
    expect(onPress).not.toHaveBeenCalled();
  });

  it('#22 accentBar=top emits height-based pseudo-element hover growth', () => {
    renderWithProviders(
      <Card accentBar="top" isPressable aria-label="top">
        top
      </Card>,
    );
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/height:\s*3px/);
    expect(styles).toMatch(/hover::before[\s\S]*height:\s*4px/);
  });

  it('#23 flat hover uses ring fallback and custom color data attrs are forwarded', () => {
    const { container } = renderWithProviders(
      <Card
        variant="flat"
        color="warning"
        isHoverable
        isFullWidth
        className="card-root"
        classNames={{ root: 'slot-root' }}
        style={{ opacity: 0.9 }}
      >
        flat
      </Card>,
    );
    const root = container.querySelector('[data-variant="flat"]');
    expect(root).toHaveAttribute('data-fullwidth', 'true');
    expect(root).toHaveClass('card-root');
    expect(root).toHaveClass('slot-root');
    expect(root).toHaveStyle({ opacity: '0.9' });
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/background:#f5f5f5/);
    expect(styles).toMatch(/background-color:rgba\(245,\s*165,\s*36,\s*0\.1\)/);
    expect(styles).toMatch(/hover:not\(\[aria-disabled='true'\]\)[\s\S]*inset 0 0 0 1px/);
  });

  it('#24 color default hover border uses strong-or-default border token', () => {
    renderWithProviders(
      <Card variant="bordered" color="default" isHoverable>
        x
      </Card>,
    );
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/border-color:#a3a3a3/);
  });

  it('#25 custom element via `as` stays non-interactive unless requested', () => {
    const { container } = renderWithProviders(<Card as="article">body</Card>);
    const article = container.querySelector('article');
    expect(article).toBeTruthy();
    expect(article).not.toHaveAttribute('role');
    expect(article).not.toHaveAttribute('tabindex');
  });

  it('#26 missing palette steps fall back to DEFAULT in dark non-default color paths', () => {
    const theme = structuredClone(darkTheme);
    theme.colors.warning = { DEFAULT: 'rgb(200, 100, 0)' } as never;

    renderWithProviders(
      <Card variant="bordered" color="warning" accentBar="start" isHoverable>
        fallback
      </Card>,
      { theme },
    );
    renderWithProviders(
      <Card variant="flat" color="warning" isHoverable>
        fallback flat
      </Card>,
      { theme },
    );

    const styles = extractEmittedStyles();
    expect(styles).toMatch(/border-color:rgb\(200,\s*100,\s*0\)/);
    expect(styles).toMatch(/background-color:#262626/);
    expect(styles).toMatch(/box-shadow:inset 0 0 0 1px rgb\(200,\s*100,\s*0\)/);
  });

  it('#27 radius=none and default border/accent fall back to border.default when strong is absent', () => {
    const theme = structuredClone(lightTheme);
    theme.colors.border.strong = '' as never;

    renderWithProviders(
      <Card variant="bordered" color="default" radius="none" accentBar="start" isHoverable>
        fallback border
      </Card>,
      { theme },
    );

    const styles = extractEmittedStyles();
    expect(styles).toMatch(/border-radius:0px/);
    expect(styles).toMatch(/border-color:#e5e5e5/);
    expect(styles).toMatch(/background:#e5e5e5/);
  });
});
