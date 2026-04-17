/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Tooltip 组件的行为与回归。
 */

import type { ComponentProps } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import { renderWithProviders, expectA11y } from '../test-utils';
import { Tooltip, __resetTooltipWarmupForTests } from './Tooltip';

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

// ────────────────────────────────────────────────────────────
// open / close on hover
// ────────────────────────────────────────────────────────────

describe('Tooltip — hover trigger', () => {
  it('opens after enterDelay on mouseenter', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Tooltip content="Hello" enterDelay={150} exitDelay={100} onOpenChange={onOpenChange}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    const btn = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.mouseEnter(btn);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('tooltip')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('closes after exitDelay on mouseleave', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Tooltip content="bye" enterDelay={50} exitDelay={120} onOpenChange={onOpenChange}>
        <button type="button">T</button>
      </Tooltip>,
    );

    const btn = screen.getByRole('button');
    fireEvent.mouseEnter(btn);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    fireEvent.mouseLeave(btn);
    expect(onOpenChange).not.toHaveBeenLastCalledWith(false);
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('preserves user onMouseEnter / onMouseLeave handlers on anchor', () => {
    installRectAutoMocks();
    const userEnter = vi.fn();
    const userLeave = vi.fn();
    renderWithProviders(
      <Tooltip content="x" enterDelay={10} exitDelay={10}>
        <button type="button" onMouseEnter={userEnter} onMouseLeave={userLeave}>
          T
        </button>
      </Tooltip>,
    );
    const btn = screen.getByRole('button');
    fireEvent.mouseEnter(btn);
    expect(userEnter).toHaveBeenCalledTimes(1);
    fireEvent.mouseLeave(btn);
    expect(userLeave).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────────────────
// focus trigger
// ────────────────────────────────────────────────────────────

describe('Tooltip — focus trigger', () => {
  it('opens on focus, closes on blur', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Tooltip content="x" enterDelay={0} exitDelay={0} onOpenChange={onOpenChange}>
        <button type="button">T</button>
      </Tooltip>,
    );
    const btn = screen.getByRole('button');
    fireEvent.focus(btn);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.blur(btn);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('preserves user onFocus / onBlur handlers on anchor', () => {
    installRectAutoMocks();
    const userFocus = vi.fn();
    const userBlur = vi.fn();
    renderWithProviders(
      <Tooltip content="x" enterDelay={0} exitDelay={0}>
        <button type="button" onFocus={userFocus} onBlur={userBlur}>
          T
        </button>
      </Tooltip>,
    );
    const btn = screen.getByRole('button');
    fireEvent.focus(btn);
    fireEvent.blur(btn);
    expect(userFocus).toHaveBeenCalledTimes(1);
    expect(userBlur).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────────────────
// isDisabled
// ────────────────────────────────────────────────────────────

describe('Tooltip — isDisabled', () => {
  it('does not open even on hover/focus when isDisabled=true', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Tooltip content="x" isDisabled enterDelay={0} exitDelay={0} onOpenChange={onOpenChange}>
        <button type="button">T</button>
      </Tooltip>,
    );
    const btn = screen.getByRole('button');
    fireEvent.mouseEnter(btn);
    fireEvent.focus(btn);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('isDisabled also blocks portal even when defaultIsOpen=true', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Tooltip content="x" isDisabled defaultIsOpen>
        <button type="button">T</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────
// controlled (isOpen)
// ────────────────────────────────────────────────────────────

describe('Tooltip — controlled isOpen', () => {
  it('renders when isOpen=true; hides when isOpen=false', () => {
    installRectAutoMocks();
    const { rerender } = renderWithProviders(
      <Tooltip content="x" isOpen={false}>
        <button type="button">T</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).toBeNull();
    rerender(
      <Tooltip content="x" isOpen>
        <button type="button">T</button>
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('ignores hover/focus events when controlled (isOpen passed)', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Tooltip content="x" isOpen={false} enterDelay={0} exitDelay={0} onOpenChange={onOpenChange}>
        <button type="button">T</button>
      </Tooltip>,
    );
    const btn = screen.getByRole('button');
    fireEvent.mouseEnter(btn);
    fireEvent.focus(btn);
    fireEvent.mouseLeave(btn);
    fireEvent.blur(btn);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────
// warm-up
// ────────────────────────────────────────────────────────────

describe('Tooltip — warm-up', () => {
  it('skips enterDelay if a previous tooltip closed within warmThreshold', () => {
    installRectAutoMocks();

    // Date.now mock —— 我们手动控制时间游标。tooltip 关闭时会写入 lastClosedAt = Date.now()，
    // 下次 enter 时检查 (Date.now() - lastClosedAt < warmThreshold=500) 是否成立。
    let now = 1_000_000;
    const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    const onOpenChange = vi.fn();
    const { rerender } = renderWithProviders(
      <Tooltip content="first" enterDelay={200} exitDelay={0} onOpenChange={onOpenChange}>
        <button type="button">A</button>
      </Tooltip>,
    );

    // 第一次：必须等 enterDelay。
    const btnA = screen.getByRole('button', { name: 'A' });
    fireEvent.mouseEnter(btnA);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    // 离开 → 立刻关闭 (exitDelay=0)，并写入 lastClosedAt = now。
    now += 50;
    fireEvent.mouseLeave(btnA);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    // 100ms 后切换到第二个 tooltip 实例，再 hover 一次。
    now += 100; // 距上次关闭 100ms < 500ms，应触发 warm 行为。
    onOpenChange.mockClear();

    rerender(
      <Tooltip content="second" enterDelay={200} exitDelay={0} onOpenChange={onOpenChange}>
        <button type="button">B</button>
      </Tooltip>,
    );

    const btnB = screen.getByRole('button', { name: 'B' });
    fireEvent.mouseEnter(btnB);
    // 立即就应该 open（enterDelay 被跳过）。
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    dateSpy.mockRestore();
  });

  it('does NOT skip enterDelay when more than warmThreshold has passed', () => {
    installRectAutoMocks();
    let now = 2_000_000;
    const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    const onOpenChange = vi.fn();
    renderWithProviders(
      <Tooltip content="x" enterDelay={200} exitDelay={0} onOpenChange={onOpenChange}>
        <button type="button">A</button>
      </Tooltip>,
    );

    const btn = screen.getByRole('button');
    fireEvent.mouseEnter(btn);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    now += 50;
    fireEvent.mouseLeave(btn);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    // 1000ms 后再 hover：> warmThreshold(500)，正常 enterDelay。
    now += 1000;
    onOpenChange.mockClear();
    fireEvent.mouseEnter(btn);
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    dateSpy.mockRestore();
  });
});

// ────────────────────────────────────────────────────────────
// aria-describedby & role
// ────────────────────────────────────────────────────────────

describe('Tooltip — a11y attributes', () => {
  it('injects aria-describedby on the anchor pointing to tooltip id', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Tooltip content="hint" id="my-tt" defaultIsOpen>
        <button type="button">T</button>
      </Tooltip>,
    );
    const btn = screen.getByRole('button');
    const desc = btn.getAttribute('aria-describedby');
    expect(desc).toBeTruthy();
    expect(desc).toContain('my-tt');
    const tip = document.getElementById('my-tt');
    expect(tip).not.toBeNull();
    expect(tip?.getAttribute('role')).toBe('tooltip');
  });

  it('renders role="tooltip" on the panel', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Tooltip content="x" defaultIsOpen>
        <button type="button">T</button>
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('preserves and merges existing aria-describedby on anchor', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Tooltip content="x" id="tt-id" defaultIsOpen>
        <button type="button" aria-describedby="user-desc">
          T
        </button>
      </Tooltip>,
    );
    const desc = screen.getByRole('button').getAttribute('aria-describedby');
    expect(desc).toContain('user-desc');
    expect(desc).toContain('tt-id');
  });

  it('returns null safely when children is not a valid element', () => {
    installRectAutoMocks();
    // 故意传入非 ReactElement 的 children；通过 props 桥接 + as unknown 绕开 TS 校验，
    // 验证 isValidElement 失败时 renderAnchor 返回 null 的分支。
    const props = {
      content: 'x',
      defaultIsOpen: true,
      children: null,
    } as unknown as ComponentProps<typeof Tooltip>;
    const { container } = renderWithProviders(<Tooltip {...props} />);
    expect(container.querySelector('button')).toBeNull();
    expect(document.querySelector('[data-placement="top"]')).not.toBeNull();
  });
});

// ────────────────────────────────────────────────────────────
// placement / arrow / styling
// ────────────────────────────────────────────────────────────

describe('Tooltip — placement & arrow', () => {
  it('different placements yield different inline top/left', () => {
    installRectAutoMocks();
    const { rerender } = renderWithProviders(
      <Tooltip content="x" defaultIsOpen placement="top">
        <button type="button">T</button>
      </Tooltip>,
    );
    const topPanel = screen.getByRole('tooltip');
    const topTop = topPanel.style.top;
    const topLeft = topPanel.style.left;
    expect(topPanel).toHaveAttribute('data-side', 'top');

    rerender(
      <Tooltip content="x" defaultIsOpen placement="bottom">
        <button type="button">T</button>
      </Tooltip>,
    );
    const bottomPanel = screen.getByRole('tooltip');
    expect(bottomPanel.style.top).not.toBe(topTop);
    // left for top vs bottom (both centered) is the same; we only assert top differs.
    expect(bottomPanel).toHaveAttribute('data-side', 'bottom');
    expect(topLeft).toBeTruthy();
  });

  it('places the panel using computePopoverPosition output (bottom-start, offset=10)', () => {
    installRectAutoMocks(
      { top: 100, left: 50, width: 100, height: 40 },
      { width: 120, height: 40 },
    );
    renderWithProviders(
      <Tooltip content="x" defaultIsOpen placement="bottom-start" offset={10}>
        <button type="button">T</button>
      </Tooltip>,
    );
    const panel = screen.getByRole('tooltip');
    expect(panel.style.top).toBe(`${100 + 40 + 10}px`);
    expect(panel.style.left).toBe('50px');
  });

  it('renders arrow element by default', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Tooltip content="x" defaultIsOpen>
        <button type="button">T</button>
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip').querySelector('[data-tooltip-arrow]')).not.toBeNull();
  });

  it('withArrow=false hides arrow', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Tooltip content="x" defaultIsOpen withArrow={false}>
        <button type="button">T</button>
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip').querySelector('[data-tooltip-arrow]')).toBeNull();
  });

  it.each([
    ['top-end' as const],
    ['bottom-end' as const],
    ['left' as const],
    ['left-start' as const],
    ['left-end' as const],
    ['right' as const],
    ['right-start' as const],
    ['right-end' as const],
  ])('arrow style is computed for placement=%s', (placement) => {
    installRectAutoMocks();
    renderWithProviders(
      <Tooltip content="x" defaultIsOpen placement={placement}>
        <button type="button">T</button>
      </Tooltip>,
    );
    const panel = screen.getByRole('tooltip');
    const arrow = panel.querySelector('[data-tooltip-arrow]') as HTMLElement;
    expect(arrow).not.toBeNull();
    // 至少有定位字段（top/left/right/bottom 中的一对）才算正确分支命中。
    const styleAttr = arrow.getAttribute('style') ?? '';
    expect(styleAttr.length).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────
// portal / refs / passthrough
// ────────────────────────────────────────────────────────────

describe('Tooltip — portal and ref forwarding', () => {
  it('panel is portaled to document.body', () => {
    installRectAutoMocks();
    const { container } = renderWithProviders(
      <Tooltip content="x" defaultIsOpen>
        <button type="button">T</button>
      </Tooltip>,
    );
    expect(container.contains(screen.getByRole('tooltip'))).toBe(false);
    expect(document.body.contains(screen.getByRole('tooltip'))).toBe(true);
  });

  it('forwards ref to the panel DOM node', () => {
    installRectAutoMocks();
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <Tooltip
        content="x"
        defaultIsOpen
        ref={(node) => {
          captured = node;
        }}
      >
        <button type="button">T</button>
      </Tooltip>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
    expect(captured).toBe(screen.getByRole('tooltip'));
  });

  it('respects custom id, className, style on panel', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Tooltip
        content="x"
        defaultIsOpen
        id="custom-tt"
        className="extra"
        style={{ background: 'rgb(255, 0, 0)' }}
      >
        <button type="button">T</button>
      </Tooltip>,
    );
    const panel = document.getElementById('custom-tt')!;
    expect(panel).not.toBeNull();
    expect(panel.className).toContain('extra');
    expect(panel.style.background).toBe('rgb(255, 0, 0)');
  });

  it('uses different bg color in dark vs light theme (inverse colors)', () => {
    installRectAutoMocks();
    const { unmount } = renderWithProviders(
      <Tooltip content="x" defaultIsOpen>
        <button type="button">T</button>
      </Tooltip>,
      { theme: 'light' },
    );
    const lightStyles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(lightStyles).toMatch(/rgba\(28,\s*28,\s*30/i);
    unmount();

    renderWithProviders(
      <Tooltip content="x" defaultIsOpen>
        <button type="button">T</button>
      </Tooltip>,
      { theme: 'dark' },
    );
    const darkStyles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(darkStyles).toMatch(/rgba\(242,\s*242,\s*247/i);
  });

  it('emits prefers-reduced-motion override rule', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Tooltip content="x" defaultIsOpen>
        <button type="button">T</button>
      </Tooltip>,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  it('emits hover:none media query so touch devices hide the tooltip', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Tooltip content="x" defaultIsOpen>
        <button type="button">T</button>
      </Tooltip>,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/hover:\s*none/);
  });
});

// ────────────────────────────────────────────────────────────
// scroll/resize repositioning
// ────────────────────────────────────────────────────────────

describe('Tooltip — repositioning', () => {
  it('updates position on window resize', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Tooltip content="x" defaultIsOpen placement="bottom-start">
        <button type="button">T</button>
      </Tooltip>,
    );
    const before = screen.getByRole('tooltip').style.top;
    vi.restoreAllMocks();
    installRectAutoMocks(
      { top: 300, left: 50, width: 100, height: 40 },
      { width: 120, height: 40 },
    );
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    const after = screen.getByRole('tooltip').style.top;
    expect(after).not.toBe(before);
  });
});

// ────────────────────────────────────────────────────────────
// a11y (axe)
// ────────────────────────────────────────────────────────────

describe('Tooltip — axe', () => {
  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    installRectAutoMocks();
    const { baseElement } = renderWithProviders(
      <Tooltip content="Helpful tip" defaultIsOpen>
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
