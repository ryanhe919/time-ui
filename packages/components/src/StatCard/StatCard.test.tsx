/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 验证 StatCard 组件的渲染、delta pill、arrow tick、skeleton、CJK label、polarity 推断。
 */

import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { darkTheme, lightTheme } from '@timeui/themes';
import { renderWithProviders } from '../test-utils';
import { StatCard } from './index';

function extractEmittedStyles(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((s) => s.textContent ?? '')
    .join('\n');
}

function getDeltaEl(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="delta"]') as HTMLElement | null;
}

function getValueEl(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="value"]') as HTMLElement | null;
}

function getLabelEl(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="label"]') as HTMLElement | null;
}

describe('StatCard — contract & visual', () => {
  it('#1 renders label + value', () => {
    renderWithProviders(<StatCard label="Revenue" value="$12,345" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,345')).toBeInTheDocument();
  });

  it('#2 western label is uppercase with 0.08em letter-spacing; CJK label disables both', () => {
    // Render both variants in the same test so their CSS coexists in the document —
    // this avoids fighting Emotion's insertion cache between tests.
    const { container: c1 } = renderWithProviders(<StatCard label="Revenue" value="1" />);
    const { container: c2 } = renderWithProviders(<StatCard label="营收" value="2" />);
    const styles = extractEmittedStyles();
    // Western label path is emitted.
    expect(styles).toMatch(/text-transform:\s*uppercase/);
    expect(styles).toMatch(/letter-spacing:\s*0\.08em/);
    // CJK path is also emitted.
    expect(styles).toMatch(/text-transform:\s*none/);
    expect(styles).toMatch(/letter-spacing:\s*0\.02em/);
    // Both labels are present.
    expect(getLabelEl(c1)).toBeTruthy();
    expect(getLabelEl(c2)).toBeTruthy();
  });

  it('#3 value uses tabular-nums slashed-zero numeric features (inspected via computed style source)', () => {
    const { container } = renderWithProviders(
      <StatCard label="tnum-unique-xyz" value="123,456" emphasis="default" />,
    );
    const valueEl = getValueEl(container);
    expect(valueEl).toBeTruthy();
    // Emotion puts the rule under a class; check it was emitted somewhere in the document.
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/tabular-nums slashed-zero/);
  });

  it('#4 delta pill has inset bottom shadow and tabular numerals', () => {
    const { container } = renderWithProviders(
      <StatCard label="n" value="1" delta={{ value: '+1.2%', direction: 'up' }} />,
    );
    expect(getDeltaEl(container)).toBeTruthy();
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/box-shadow:\s*inset 0 -1px 0/);
    expect(styles).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });

  it('#5 delta translateY correlates with size: -2/-3/-4px for sm/md/lg', () => {
    renderWithProviders(
      <StatCard label="sz-sm" value="1" size="sm" delta={{ value: '+1%', direction: 'up' }} />,
    );
    renderWithProviders(
      <StatCard label="sz-md" value="1" size="md" delta={{ value: '+1%', direction: 'up' }} />,
    );
    renderWithProviders(
      <StatCard label="sz-lg" value="1" size="lg" delta={{ value: '+1%', direction: 'up' }} />,
    );
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/translateY\(-2px\)/);
    expect(styles).toMatch(/translateY\(-3px\)/);
    expect(styles).toMatch(/translateY\(-4px\)/);
  });

  it('#6 delta direction drives data-direction; auto polarity: up→positive, down→negative, flat→neutral', () => {
    const { container: cup, unmount: uu } = renderWithProviders(
      <StatCard label="n" value="1" delta={{ value: '+1%', direction: 'up' }} />,
    );
    const up = getDeltaEl(cup);
    expect(up?.getAttribute('data-direction')).toBe('up');
    expect(up?.getAttribute('data-polarity')).toBe('positive');
    uu();

    const { container: cdn, unmount: ud } = renderWithProviders(
      <StatCard label="n" value="1" delta={{ value: '-1%', direction: 'down' }} />,
    );
    expect(getDeltaEl(cdn)?.getAttribute('data-polarity')).toBe('negative');
    ud();

    const { container: cf } = renderWithProviders(
      <StatCard label="n" value="1" delta={{ value: '0%', direction: 'flat' }} />,
    );
    expect(getDeltaEl(cf)?.getAttribute('data-polarity')).toBe('neutral');
  });

  it('#7 delta polarity override wins over auto (up direction forced to negative)', () => {
    const { container } = renderWithProviders(
      <StatCard
        label="n"
        value="1"
        delta={{ value: '+1%', direction: 'up', polarity: 'negative' }}
      />,
    );
    expect(getDeltaEl(container)?.getAttribute('data-polarity')).toBe('negative');
  });

  it('#8 delta aria-label respects sr.deltaLabel priority', () => {
    const { container } = renderWithProviders(
      <StatCard
        label="n"
        value="1"
        delta={{ value: '+1%', direction: 'up' }}
        sr={{ deltaLabel: 'Custom SR' }}
      />,
    );
    expect(getDeltaEl(container)?.getAttribute('aria-label')).toBe('Custom SR');
  });

  it('#9 delta aria-label uses i18n template when value is string (zh default)', () => {
    const { container } = renderWithProviders(
      <StatCard label="n" value="1" delta={{ value: '5.2%', direction: 'up' }} />,
    );
    expect(getDeltaEl(container)?.getAttribute('aria-label')).toBe('上升 5.2%');
  });

  it('#10 delta aria-label falls back to direction word when value is non-string', () => {
    const { container } = renderWithProviders(
      <StatCard label="n" value="1" delta={{ value: <strong>12</strong>, direction: 'down' }} />,
    );
    expect(getDeltaEl(container)?.getAttribute('aria-label')).toBe('下降');
  });

  it('#11 delta arrow animation key bumps when direction / value changes (tick plays)', () => {
    const { container, rerender } = renderWithProviders(
      <StatCard label="n" value="1" delta={{ value: '+1%', direction: 'up' }} />,
    );
    const arrow1 = container.querySelector('[data-slot="delta-arrow"]');
    expect(arrow1).toBeTruthy();

    // re-render with different direction; React will swap the element because of key bump.
    rerender(<StatCard label="n" value="1" delta={{ value: '-1%', direction: 'down' }} />);
    const arrow2 = container.querySelector('[data-slot="delta-arrow"]');
    expect(arrow2).toBeTruthy();
    // arrow element is NOT the same node as arrow1 (key changed, React replaces it).
    expect(arrow2).not.toBe(arrow1);

    // Style sheet must contain the tick keyframes for each direction.
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/@keyframes timeui-delta-tick-up/);
    expect(styles).toMatch(/@keyframes timeui-delta-tick-down/);
    expect(styles).toMatch(/@keyframes timeui-delta-tick-flat/);
  });

  it('#12 icon container renders with inset highlight shadow', () => {
    const { container } = renderWithProviders(
      <StatCard label="n" value="1" icon={<span data-testid="ic">i</span>} />,
    );
    expect(container.querySelector('[data-slot="icon"]')).toBeTruthy();
    expect(screen.getByTestId('ic')).toBeInTheDocument();
    const styles = extractEmittedStyles();
    // inset highlight on icon container
    expect(styles).toMatch(/inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.5\)/);
  });

  it('#13 iconPlacement="end" puts icon after content', () => {
    const { container } = renderWithProviders(
      <StatCard label="n" value="1" icon={<span>i</span>} iconPlacement="end" />,
    );
    const row = container.querySelector('[data-slot="statcard-row"]');
    const last = row?.lastElementChild;
    expect(last?.getAttribute('data-slot')).toBe('icon');
  });

  it('#14 isLoading renders role=status + aria-busy + breathe animation', () => {
    const { container } = renderWithProviders(
      <StatCard
        label="n"
        value="1"
        isLoading
        delta={{ value: '+1%', direction: 'up' }}
        icon={<span>i</span>}
      />,
    );
    const skRoot = container.querySelector('[data-slot="statcard-skeleton"]');
    expect(skRoot).toBeTruthy();
    expect(skRoot?.getAttribute('role')).toBe('status');
    expect(skRoot?.getAttribute('aria-busy')).toBe('true');
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/@keyframes timeui-statcard-breathe/);
    expect(styles).toMatch(/animation:\s*timeui-statcard-breathe/);
  });

  it('#15 trend without bleed renders with top border', () => {
    const { container } = renderWithProviders(
      <StatCard label="n" value="1" trend={<div>chart</div>} />,
    );
    const trend = container.querySelector('[data-slot="trend"]');
    expect(trend).toBeTruthy();
    expect(trend?.getAttribute('data-bleed')).toBeNull();
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/border-top:\s*1px solid/);
  });

  it('#16 trend with bleed uses negative margin pattern', () => {
    const { container } = renderWithProviders(
      <StatCard label="n" value="1" size="md" trendBleed trend={<div>chart</div>} />,
    );
    const trend = container.querySelector('[data-slot="trend"]');
    expect(trend?.getAttribute('data-bleed')).toBe('true');
    const styles = extractEmittedStyles();
    // margin: 12px -16px -16px for md
    expect(styles).toMatch(/margin:\s*12px -16px -16px/);
  });

  it('#17 transitively accepts Card props (color / variant / accentBar / isPressable)', () => {
    const { container } = renderWithProviders(
      <StatCard
        label="n"
        value="1"
        color="success"
        variant="elevated"
        accentBar="start"
        isPressable
        aria-label="p"
      />,
    );
    expect(container.querySelector('[data-variant="elevated"]')).toBeTruthy();
    expect(container.querySelector('[data-color="success"]')).toBeTruthy();
    expect(container.querySelector('[data-pressable="true"]')).toBeTruthy();
  });

  it('#18 direction omitted defaults to flat and auto polarity resolves neutral', () => {
    const { container } = renderWithProviders(
      <StatCard label="n" value="1" delta={{ value: '0%' }} />,
    );
    const delta = getDeltaEl(container);
    expect(delta).toHaveAttribute('data-direction', 'flat');
    expect(delta).toHaveAttribute('data-polarity', 'neutral');
    expect(delta).toHaveAttribute('aria-label', '持平 0%');
  });

  it('#19 explicit neutral polarity wins over automatic mapping', () => {
    const { container } = renderWithProviders(
      <StatCard
        label="n"
        value="1"
        delta={{ value: '-1%', direction: 'down', polarity: 'neutral' }}
      />,
    );
    expect(getDeltaEl(container)).toHaveAttribute('data-polarity', 'neutral');
  });

  it('#20 sr.valueLabel is forwarded to the numeric value node', () => {
    const { container } = renderWithProviders(
      <StatCard label="Revenue" value="$8,888" sr={{ valueLabel: 'Revenue value' }} />,
    );
    expect(getValueEl(container)).toHaveAttribute('aria-label', 'Revenue value');
  });

  it('#21 description and trend content render together', () => {
    const { container } = renderWithProviders(
      <StatCard
        label="Revenue"
        value="$8,888"
        description="vs last quarter"
        trend={<div>spark</div>}
      />,
    );
    expect(container.querySelector('[data-slot="description"]')).toBeTruthy();
    expect(screen.getByText('vs last quarter')).toBeInTheDocument();
    expect(screen.getByText('spark')).toBeInTheDocument();
  });

  it('#22 emphasis scales font size across subtle/default/strong', () => {
    renderWithProviders(<StatCard label="subtle" value="1" emphasis="subtle" />);
    renderWithProviders(<StatCard label="default" value="1" emphasis="default" />);
    renderWithProviders(<StatCard label="strong" value="1" emphasis="strong" />);
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/font-size:\s*20px/);
    expect(styles).toMatch(/font-size:\s*28px/);
    expect(styles).toMatch(/font-size:\s*36px/);
  });

  it('#23 valueAlign=center emits centering rules for row, content and value row', () => {
    const { container } = renderWithProviders(
      <StatCard label="Centered" value="1" valueAlign="center" />,
    );
    expect(container.querySelector('[data-slot="statcard-row"]')).toBeTruthy();
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/justify-content:\s*center/);
    expect(styles).toMatch(/align-items:\s*center/);
    expect(styles).toMatch(/text-align:\s*center/);
  });

  it('#24 loading state sets root aria-label fallback and data-loading marker', () => {
    const { container } = renderWithProviders(<StatCard label="n" value="1" isLoading />);
    const card = container.querySelector('[data-loading="true"]');
    expect(card).toHaveAttribute('data-loading', 'true');
    expect(card.querySelector('[data-slot="statcard-skeleton"]')).toBeTruthy();
    expect(card).toHaveAttribute('aria-label', '加载中');
  });

  it('#25 icon palette uses dark-mode inset highlight variant', () => {
    renderWithProviders(<StatCard label="n" value="1" icon={<span>i</span>} />, { theme: 'dark' });
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.06\)/);
  });

  it('#26 trendBleed margin adapts by size tokens', () => {
    renderWithProviders(
      <StatCard label="sm" value="1" size="sm" trendBleed trend={<div>t</div>} />,
    );
    renderWithProviders(
      <StatCard label="lg" value="1" size="lg" trendBleed trend={<div>t</div>} />,
    );
    const styles = extractEmittedStyles();
    expect(styles).toMatch(/margin:\s*12px -12px -12px/);
    expect(styles).toMatch(/margin:\s*12px -24px -24px/);
  });

  it('#27 forwards ref, root class names and interactive callbacks through internal Card', async () => {
    const ref = createRef<HTMLElement>();
    const onClick = vi.fn();
    const onPress = vi.fn();
    const { container } = renderWithProviders(
      <StatCard
        ref={ref as never}
        label="Open"
        value="1"
        isPressable
        aria-label="open stat"
        onClick={onClick}
        onPress={onPress}
        className="outer"
        classNames={{
          root: 'root-slot',
          label: 'label-slot',
          value: 'value-slot',
          delta: 'delta-slot',
          icon: 'icon-slot',
          description: 'description-slot',
          trend: 'trend-slot',
        }}
        description="desc"
        icon={<span>i</span>}
        delta={{ value: '+1%', direction: 'up' }}
        trend={<div>trend</div>}
      />,
    );
    const root = screen.getByRole('button', { name: 'open stat' });
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('outer');
    expect(root).toHaveClass('root-slot');
    expect(container.querySelector('[data-slot="label"]')).toHaveClass('label-slot');
    expect(container.querySelector('[data-slot="value"]')).toHaveClass('value-slot');
    expect(container.querySelector('[data-slot="delta"]')).toHaveClass('delta-slot');
    expect(container.querySelector('[data-slot="icon"]')).toHaveClass('icon-slot');
    expect(container.querySelector('[data-slot="description"]')).toHaveClass('description-slot');
    expect(container.querySelector('[data-slot="trend"]')).toHaveClass('trend-slot');
    await userEvent.click(root);
    expect(onClick).toHaveBeenCalledOnce();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('#28 fallback theme paths cover delta status fallbacks and icon palette fallbacks', () => {
    const theme = structuredClone(lightTheme);
    theme.colors.status.successBg = undefined as never;
    theme.colors.status.success = undefined as never;
    theme.colors.status.dangerBg = undefined as never;
    theme.colors.status.danger = undefined as never;
    theme.colors.success = { DEFAULT: 'rgb(0, 160, 90)' } as never;
    theme.colors.danger = { DEFAULT: 'rgb(220, 40, 40)' } as never;
    theme.colors.warning = { DEFAULT: 'rgb(200, 100, 0)' } as never;

    renderWithProviders(
      <StatCard
        label="positive"
        value="1"
        color="warning"
        icon={<span>i</span>}
        delta={{ value: '+1%', direction: 'up' }}
      />,
      { theme },
    );
    renderWithProviders(
      <StatCard label="negative" value="1" delta={{ value: '-1%', direction: 'down' }} />,
      { theme },
    );

    const styles = extractEmittedStyles();
    expect(styles).toMatch(/background:#f5f5f5/);
    expect(styles).toMatch(/color:#171717/);
  });

  it('#29 dark theme delta pill uses the dark inset bottom shadow fragment', () => {
    renderWithProviders(
      <StatCard label="dark" value="1" delta={{ value: '+1%', direction: 'up' }} />,
      { theme: darkTheme },
    );
    expect(extractEmittedStyles()).toMatch(/inset 0 -1px 0 rgba\(255,\s*255,\s*255,\s*0\.05\)/);
  });
});
