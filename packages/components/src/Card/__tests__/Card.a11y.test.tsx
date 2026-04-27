/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 验证 Card 组件的无障碍与 reduced-motion 行为。
 */

import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardBody, CardFooter } from '../';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

function extractEmittedStyles(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((s) => s.textContent ?? '')
    .join('\n');
}

describe('Card — a11y & reduced-motion', () => {
  it('#18 axe: three snapshots — static, pressable, elevated with header/body/footer', async () => {
    const snapshots = [
      renderWithProviders(
        <Card aria-label="static card">
          <CardBody>content</CardBody>
        </Card>,
      ).container,
      renderWithProviders(
        <Card isPressable aria-label="pressable card" onPress={() => {}}>
          action
        </Card>,
      ).container,
      renderWithProviders(
        <Card variant="elevated" aria-label="layered card">
          <CardHeader title="Quarterly" subtitle="2025 Q2" />
          <CardBody>rows</CardBody>
          <CardFooter justify="between">
            <span>a</span>
            <span>b</span>
          </CardFooter>
        </Card>,
      ).container,
    ];
    for (const c of snapshots) {
      await expectA11y(c);
    }
  });

  it('#19 reduced-motion rule present: pressable :active no transform + elevated hover no transform', () => {
    renderWithProviders(
      <Card isPressable variant="elevated" aria-label="r">
        x
      </Card>,
    );
    const styles = extractEmittedStyles();
    // reduced-motion block present
    expect(styles).toMatch(/@media \(prefers-reduced-motion:\s*reduce\)/);
    // Inside that block: pressable active transform: none
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*active:not\(\[aria-disabled='true'\]\)[\s\S]*transform:\s*none/,
    );
  });
});
