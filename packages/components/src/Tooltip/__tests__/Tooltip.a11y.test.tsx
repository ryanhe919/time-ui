/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Tooltip 组件的可访问性（axe 0 violation）。
 */

import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, expectA11y } from '../../test-utils';
import { Tooltip, __resetTooltipWarmupForTests } from '../Tooltip';

// ────────────────────────────────────────────────────────────
// jsdom 兜底：getBoundingClientRect 在 jsdom 下返回全 0；Tooltip 的定位需要
// 真实尺寸才能验证 placement 切换后的差异。这里给 anchor 留 100x40，
// 给 tooltip panel 留 120x40 的固定尺寸，所有 placement 的算术结果就都可控。
// ────────────────────────────────────────────────────────────

const installRectAutoMocks = (
  anchorRect = { top: 100, left: 50, width: 100, height: 40 },
  panelSize = { width: 120, height: 40 },
) => {
  const orig = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.tagName === 'BUTTON') {
      return {
        top: anchorRect.top,
        left: anchorRect.left,
        width: anchorRect.width,
        height: anchorRect.height,
        right: anchorRect.left + anchorRect.width,
        bottom: anchorRect.top + anchorRect.height,
        x: anchorRect.left,
        y: anchorRect.top,
        toJSON: () => ({}),
      } as DOMRect;
    }
    if (this.getAttribute?.('role') === 'tooltip') {
      return {
        top: 0,
        left: 0,
        width: panelSize.width,
        height: panelSize.height,
        right: panelSize.width,
        bottom: panelSize.height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    }
    return orig.call(this);
  });
};

beforeEach(() => {
  __resetTooltipWarmupForTests();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Tooltip — a11y', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    installRectAutoMocks();
    const { baseElement } = renderWithProviders(
      <Tooltip content="Helpful tip" defaultOpen>
        <button type="button">Trigger</button>
      </Tooltip>,
      { theme },
    );
    // 'region' rule 在测试环境下由于 portal 内容不在 main landmark 而误报；
    // 实际页面消费方负责把页面整体放到 landmark（main / nav / aside）下，
    // tooltip 自身不应承担 landmark 责任。其它规则保持启用。
    await expectA11y(baseElement, {
      rules: { region: { enabled: false } },
    });
  });
});
