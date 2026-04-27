/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 验证 StatCard 的可访问性与 reduced-motion 行为。
 */

import { describe, it, expect } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { StatCard } from '../';

function extractEmittedStyles(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((s) => s.textContent ?? '')
    .join('\n');
}

describe('StatCard — a11y & reduced-motion', () => {
  it('#18 axe: snapshots — bare, with delta, with icon, loading, pressable', async () => {
    const snapshots = [
      renderWithProviders(<StatCard label="Revenue" value="$12k" />).container,
      renderWithProviders(
        <StatCard label="Revenue" value="$12k" delta={{ value: '+1.2%', direction: 'up' }} />,
      ).container,
      renderWithProviders(
        <StatCard label="Users" value="1,234" icon={<span aria-hidden>👥</span>} />,
      ).container,
      renderWithProviders(<StatCard label="Loading" value="—" isLoading />).container,
      renderWithProviders(
        <StatCard
          label="Action"
          value="Open"
          isPressable
          onPress={() => {}}
          aria-label="open details"
        />,
      ).container,
    ];
    for (const c of snapshots) {
      await expectA11y(c);
    }
  });

  it('#19 reduced-motion disables skeleton breathe animation and delta arrow tick', () => {
    // Mount both shapes so both reduced-motion blocks are emitted in the same document.
    renderWithProviders(<StatCard label="rm-loading" value="$12k" isLoading />);
    renderWithProviders(
      <StatCard label="rm-delta" value="1" delta={{ value: '+1%', direction: 'up' }} />,
    );
    const styles = extractEmittedStyles();
    // Reduced-motion guard is present.
    expect(styles).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)/);
    // Skeleton breathe disabled under reduced motion.
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*sk-el[\s\S]*animation:\s*none/,
    );
    // Delta arrow tick disabled under reduced motion.
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*delta-arrow[\s\S]*animation:\s*none/,
    );
  });
});
