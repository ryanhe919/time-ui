/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Test-utils 组件的核心渲染与交互逻辑。
 */

import { expect } from 'vitest';
import { axe } from 'vitest-axe';

export type A11yOptions = Parameters<typeof axe>[1];

export const expectA11y = async (
  container: Element | Document,
  options?: A11yOptions,
): Promise<void> => {
  const results = await axe(container as Element, options);
  (expect(results) as unknown as { toHaveNoViolations(): void }).toHaveNoViolations();
};
