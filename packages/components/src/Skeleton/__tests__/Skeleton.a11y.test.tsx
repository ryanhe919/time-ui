/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Skeleton 与 SkeletonGroup 的可访问性（axe 0 violation）。
 */

import { describe, it } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Skeleton, SkeletonGroup } from '../';

describe('Skeleton — a11y', () => {
  it('passes axe a11y check', async () => {
    const { container } = renderWithProviders(<Skeleton />);
    await expectA11y(container);
  });
});

describe('SkeletonGroup — a11y', () => {
  it('passes axe a11y check', async () => {
    const { container } = renderWithProviders(
      <SkeletonGroup>
        <Skeleton />
        <Skeleton shape="text" lines={2} />
      </SkeletonGroup>,
    );
    await expectA11y(container);
  });
});
