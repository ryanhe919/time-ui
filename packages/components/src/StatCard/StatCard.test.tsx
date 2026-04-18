/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 验证 StatCard 组件的渲染、delta pill、arrow tick、skeleton、CJK label、polarity 推断。
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
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
});
