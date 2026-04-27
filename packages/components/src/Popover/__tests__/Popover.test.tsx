/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Popover 组件的行为与回归。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { Popover, computePopoverPosition } from '../Popover';

// ────────────────────────────────────────────────────────────
// jsdom 兜底：getBoundingClientRect 在 jsdom 下返回全 0；Popover 的定位需要
// 真实尺寸才能验证 placement 切换后的差异。这里给 anchor 留 0 起点 + 100×40，
// 给 panel 留 200×100 的固定尺寸，所有 placement 的算术结果就都可控了。
// ────────────────────────────────────────────────────────────

const installRectAutoMocks = (
  anchorRect = { top: 100, left: 50, width: 100, height: 40 },
  panelSize = { width: 200, height: 100 },
) => {
  // anchor: 任何 button 节点。
  // panel: role=dialog 或 role=tooltip。
  const orig = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.matches?.('[data-popover-anchor]') || this.tagName === 'BUTTON') {
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
    if (this.getAttribute?.('role') === 'dialog' || this.getAttribute?.('role') === 'tooltip') {
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
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ────────────────────────────────────────────────────────────
// 纯函数：computePopoverPosition
// ────────────────────────────────────────────────────────────

describe('computePopoverPosition (pure)', () => {
  const anchor = { top: 100, left: 50, width: 100, height: 40 };
  const panel = { width: 200, height: 100 };

  it('top + center', () => {
    const r = computePopoverPosition(anchor, panel, 'top', 8);
    expect(r.side).toBe('top');
    expect(r.align).toBe('center');
    expect(r.top).toBe(100 - 100 - 8); // -8
    expect(r.left).toBe(50 + 100 / 2 - 200 / 2); // 0
  });

  it('bottom + start', () => {
    const r = computePopoverPosition(anchor, panel, 'bottom-start', 8);
    expect(r.side).toBe('bottom');
    expect(r.align).toBe('start');
    expect(r.top).toBe(100 + 40 + 8); // 148
    expect(r.left).toBe(50);
  });

  it('bottom + end', () => {
    const r = computePopoverPosition(anchor, panel, 'bottom-end', 8);
    expect(r.left).toBe(50 + 100 - 200);
  });

  it('left + start', () => {
    const r = computePopoverPosition(anchor, panel, 'left-start', 6);
    expect(r.side).toBe('left');
    expect(r.left).toBe(50 - 200 - 6); // -156
    expect(r.top).toBe(100);
  });

  it('left + end', () => {
    const r = computePopoverPosition(anchor, panel, 'left-end', 6);
    expect(r.top).toBe(100 + 40 - 100); // 40
  });

  it('right + center', () => {
    const r = computePopoverPosition(anchor, panel, 'right', 4);
    expect(r.left).toBe(50 + 100 + 4);
    expect(r.top).toBe(100 + 40 / 2 - 100 / 2); // 70
  });

  describe('viewport collision (flip + shift)', () => {
    const vp = { width: 1024, height: 768 };

    it('flips top → bottom when there is no room above the anchor', () => {
      // anchor 紧贴顶部：top=10, panel 高 100 → top 上方放不下；底下 758-50-16=692 容得下
      const r = computePopoverPosition(
        { top: 10, left: 400, width: 100, height: 40 },
        { width: 200, height: 100 },
        'top',
        8,
        vp,
      );
      expect(r.side).toBe('bottom');
      expect(r.top).toBe(10 + 40 + 8); // 锚点底 + offset
    });

    it('flips bottom → top when there is no room below the anchor', () => {
      // anchor 紧贴底部：top=720, height=40, panel 高 100 → bottom 下方放不下；上方 720 容得下
      const r = computePopoverPosition(
        { top: 720, left: 400, width: 100, height: 40 },
        { width: 200, height: 100 },
        'bottom',
        8,
        vp,
      );
      expect(r.side).toBe('top');
      expect(r.top).toBe(720 - 100 - 8);
    });

    it('flips left → right when there is no room on the left', () => {
      const r = computePopoverPosition(
        { top: 300, left: 5, width: 100, height: 40 },
        { width: 200, height: 100 },
        'left',
        8,
        vp,
      );
      expect(r.side).toBe('right');
      expect(r.left).toBe(5 + 100 + 8);
    });

    it('shifts (clamps) horizontally to keep popover inside viewport on bottom-end', () => {
      // anchor 紧贴右边：viewport 1024 宽，panel 200 宽，maxLeft=1024-200-8=816
      // bottom-end 默认 left = 1020 + 100 - 200 = 920 → clamp 到 816
      const r = computePopoverPosition(
        { top: 100, left: 1020, width: 100, height: 40 },
        { width: 200, height: 100 },
        'bottom-end',
        8,
        vp,
      );
      expect(r.side).toBe('bottom');
      expect(r.left).toBe(1024 - 200 - 8); // shifted to maxLeft
    });

    it('shifts (clamps) horizontally on bottom-start when anchor is near the left edge', () => {
      // anchor.left=2 → start align 默认 left=2，clamp 到 minLeft=8
      const r = computePopoverPosition(
        { top: 100, left: 2, width: 100, height: 40 },
        { width: 200, height: 100 },
        'bottom-start',
        8,
        vp,
      );
      expect(r.left).toBe(8);
    });

    it('does not flip when both sides have room (keeps requested placement)', () => {
      const r = computePopoverPosition(
        { top: 400, left: 400, width: 100, height: 40 },
        { width: 100, height: 60 },
        'top',
        8,
        vp,
      );
      expect(r.side).toBe('top');
    });

    it('keeps original side when neither opposite side has room either', () => {
      // viewport 太矮，无论 top/bottom 都放不下 → 维持请求的 side
      const tinyVp = { width: 1024, height: 100 };
      const r = computePopoverPosition(
        { top: 30, left: 400, width: 100, height: 40 },
        { width: 200, height: 200 },
        'top',
        8,
        tinyVp,
      );
      expect(r.side).toBe('top');
    });
  });
});

// ────────────────────────────────────────────────────────────
// open / close 基础
// ────────────────────────────────────────────────────────────

describe('Popover — open state', () => {
  it('renders only anchor when closed (uncontrolled default)', () => {
    renderWithProviders(<Popover anchor={<button type="button">Trigger</button>}>Content</Popover>);
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('uncontrolled: defaultOpen renders panel on first paint', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen>
        Hello
      </Popover>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('controlled: isOpen=true renders panel; isOpen=false does not', () => {
    installRectAutoMocks();
    const { rerender } = renderWithProviders(
      <Popover anchor={<button type="button">T</button>} isOpen={false}>
        x
      </Popover>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(
      <Popover anchor={<button type="button">T</button>} isOpen>
        x
      </Popover>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('panel is portaled to document.body', () => {
    installRectAutoMocks();
    const { container } = renderWithProviders(
      <Popover anchor={<button type="button">T</button>} isOpen>
        portal
      </Popover>,
    );
    expect(container.contains(screen.getByRole('dialog'))).toBe(false);
    expect(document.body.contains(screen.getByRole('dialog'))).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────
// trigger=click
// ────────────────────────────────────────────────────────────

describe('Popover — trigger=click', () => {
  it('clicking anchor toggles open and fires onOpenChange', async () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} onOpenChange={onOpenChange}>
        c
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'T' });
    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('preserves anchor element existing onClick handler', async () => {
    installRectAutoMocks();
    const onAnchorClick = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(
      <Popover
        anchor={
          <button type="button" onClick={onAnchorClick}>
            T
          </button>
        }
      >
        c
      </Popover>,
    );
    await user.click(screen.getByRole('button'));
    expect(onAnchorClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('Escape closes by default', async () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen onOpenChange={onOpenChange}>
        c
      </Popover>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closeOnEsc=false ignores Escape', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        defaultOpen
        closeOnEsc={false}
        onOpenChange={onOpenChange}
      >
        c
      </Popover>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('Escape from inside the panel also closes', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen onOpenChange={onOpenChange}>
        body
      </Popover>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('clicking outside closes; clicking anchor or panel does not', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <div>
        <Popover anchor={<button type="button">T</button>} defaultOpen onOpenChange={onOpenChange}>
          inside
        </Popover>
        <div data-testid="outside">outside</div>
      </div>,
    );
    fireEvent.mouseDown(screen.getByText('inside'));
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByRole('button', { name: 'T' }));
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closeOnBlur=false ignores outside clicks', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <div>
        <Popover
          anchor={<button type="button">T</button>}
          defaultOpen
          closeOnBlur={false}
          onOpenChange={onOpenChange}
        >
          x
        </Popover>
        <div data-testid="outside" />
      </div>,
    );
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────
// trigger=hover
// ────────────────────────────────────────────────────────────

describe('Popover — trigger=hover', () => {
  it('opens after openDelay, closes after closeDelay', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        trigger="hover"
        openDelay={150}
        closeDelay={200}
        onOpenChange={onOpenChange}
      >
        c
      </Popover>,
    );
    const btn = screen.getByRole('button');
    fireEvent.mouseEnter(btn);
    expect(onOpenChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.mouseLeave(btn);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('with openDelay=0 opens immediately on enter', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        trigger="hover"
        onOpenChange={onOpenChange}
      >
        c
      </Popover>,
    );
    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it('uses tooltip role when triggered by hover', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} trigger="hover" defaultOpen>
        c
      </Popover>,
    );
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hovering panel cancels pending close timer', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        trigger="hover"
        closeDelay={200}
        defaultOpen
        onOpenChange={onOpenChange}
      >
        c
      </Popover>,
    );
    const btn = screen.getByRole('button');
    fireEvent.mouseLeave(btn);
    fireEvent.mouseEnter(screen.getByRole('tooltip'));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('mouseleave from panel also closes after delay', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        trigger="hover"
        closeDelay={50}
        defaultOpen
        onOpenChange={onOpenChange}
      >
        c
      </Popover>,
    );
    fireEvent.mouseLeave(screen.getByRole('tooltip'));
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

// ────────────────────────────────────────────────────────────
// trigger=focus
// ────────────────────────────────────────────────────────────

describe('Popover — trigger=focus', () => {
  it('focus opens, blur closes', () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        trigger="focus"
        onOpenChange={onOpenChange}
      >
        c
      </Popover>,
    );
    const btn = screen.getByRole('button');
    fireEvent.focus(btn);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    fireEvent.blur(btn);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

// ────────────────────────────────────────────────────────────
// trigger=manual
// ────────────────────────────────────────────────────────────

describe('Popover — trigger=manual', () => {
  it('does not react to click / hover / focus / blur / esc / outside', async () => {
    installRectAutoMocks();
    const onOpenChange = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(
      <div>
        <Popover
          anchor={<button type="button">T</button>}
          trigger="manual"
          isOpen
          onOpenChange={onOpenChange}
        >
          c
        </Popover>
        <div data-testid="outside" />
      </div>,
    );
    const btn = screen.getByRole('button');
    await user.click(btn);
    fireEvent.mouseEnter(btn);
    fireEvent.mouseLeave(btn);
    fireEvent.focus(btn);
    fireEvent.blur(btn);
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────
// anchor render-prop
// ────────────────────────────────────────────────────────────

describe('Popover — anchor as render prop', () => {
  it('exposes isOpen and ref to render-prop anchor', async () => {
    installRectAutoMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let receivedRefNode: HTMLElement | null = null;
    renderWithProviders(
      <Popover
        anchor={({ isOpen, ref }) => (
          <button
            type="button"
            ref={(node) => {
              if (typeof ref === 'function') ref(node);
              else if (ref) (ref as { current: HTMLElement | null }).current = node;
              receivedRefNode = node;
            }}
            data-state={isOpen ? 'open' : 'closed'}
            onClick={() => {}}
          >
            T
          </button>
        )}
        defaultOpen
      >
        c
      </Popover>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('data-state', 'open');
    expect(receivedRefNode).toBe(btn);
    // user click on render-prop anchor should NOT trigger built-in click toggle
    // (no click handler injected when render-prop is used).
    await user.click(btn);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('returns null safely when anchor is not a valid element', () => {
    installRectAutoMocks();
    const { container } = renderWithProviders(
      // @ts-expect-error — intentional invalid anchor for branch coverage
      <Popover anchor={null} defaultOpen>
        c
      </Popover>,
    );
    // No anchor button rendered, but panel itself still mounts in body
    // (querying by role would fail because position never settles → visibility:hidden;
    //  fall back to the data-attribute we always emit on the panel root).
    expect(container.querySelector('button')).toBeNull();
    expect(document.querySelector('[data-placement="bottom"]')).not.toBeNull();
  });
});

// ────────────────────────────────────────────────────────────
// placement / positioning
// ────────────────────────────────────────────────────────────

describe('Popover — placement & positioning', () => {
  it('sets fixed top/left from computed placement (bottom-start)', () => {
    installRectAutoMocks(
      { top: 100, left: 50, width: 100, height: 40 },
      { width: 200, height: 100 },
    );
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen placement="bottom-start">
        c
      </Popover>,
    );
    const panel = screen.getByRole('dialog');
    expect(panel.style.top).toBe('148px');
    expect(panel.style.left).toBe('50px');
    expect(panel).toHaveAttribute('data-side', 'bottom');
    expect(panel).toHaveAttribute('data-align', 'start');
  });

  it('different placements yield different positions (top vs bottom)', () => {
    // anchor 放在 viewport 中央，让 'top' / 'bottom' 都有足够空间不被 flip。
    installRectAutoMocks(
      { top: 400, left: 400, width: 100, height: 40 },
      { width: 200, height: 100 },
    );
    const { rerender } = renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen placement="top">
        c
      </Popover>,
    );
    const topLeft = screen.getByRole('dialog').style.top;
    rerender(
      <Popover anchor={<button type="button">T</button>} defaultOpen placement="bottom">
        c
      </Popover>,
    );
    const bottomLeft = screen.getByRole('dialog').style.top;
    expect(topLeft).not.toBe(bottomLeft);
  });

  it('right-end positions panel correctly', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen placement="right-end">
        c
      </Popover>,
    );
    const panel = screen.getByRole('dialog');
    expect(panel).toHaveAttribute('data-side', 'right');
    expect(panel).toHaveAttribute('data-align', 'end');
  });

  it('numeric offset prop is respected', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        defaultOpen
        placement="bottom-start"
        offset={20}
      >
        c
      </Popover>,
    );
    expect(screen.getByRole('dialog').style.top).toBe(`${100 + 40 + 20}px`);
  });

  it('updates position on window resize', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen placement="bottom-start">
        c
      </Popover>,
    );
    const before = screen.getByRole('dialog').style.top;
    // change anchor mock to a new top, then dispatch resize.
    vi.restoreAllMocks();
    installRectAutoMocks(
      { top: 300, left: 50, width: 100, height: 40 },
      { width: 200, height: 100 },
    );
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    const after = screen.getByRole('dialog').style.top;
    expect(after).not.toBe(before);
    expect(after).toBe(`${300 + 40 + 8}px`);
  });
});

// ────────────────────────────────────────────────────────────
// arrow / header / footer
// ────────────────────────────────────────────────────────────

describe('Popover — arrow / header / footer', () => {
  it('renders arrow by default', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen>
        c
      </Popover>,
    );
    expect(screen.getByRole('dialog').querySelector('[data-popover-arrow]')).not.toBeNull();
  });

  it('hasArrow=false hides the arrow element', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen hasArrow={false}>
        c
      </Popover>,
    );
    expect(screen.getByRole('dialog').querySelector('[data-popover-arrow]')).toBeNull();
  });

  it('renders header and footer slots when provided', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        defaultOpen
        header={<span>HeaderText</span>}
        footer={<span>FooterText</span>}
      >
        body
      </Popover>,
    );
    expect(screen.getByText('HeaderText')).toBeInTheDocument();
    expect(screen.getByText('FooterText')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('header text is referenced via aria-labelledby when no aria-label provided', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        defaultOpen
        header={<span>HeaderText</span>}
      >
        body
      </Popover>,
    );
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)?.textContent).toBe('HeaderText');
  });

  it('aria-label takes precedence over header for labeling', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        defaultOpen
        header={<span>HeaderText</span>}
        aria-label="explicit-label"
      >
        body
      </Popover>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'explicit-label');
    expect(dialog).not.toHaveAttribute('aria-labelledby');
  });

  it('arrow position attributes follow placement side', () => {
    // anchor 放在 viewport 中央，让 'top' / 'left' 都有足够空间不触发 flip。
    installRectAutoMocks(
      { top: 400, left: 400, width: 100, height: 40 },
      { width: 100, height: 60 },
    );
    const { rerender } = renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen placement="top">
        c
      </Popover>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'top');
    rerender(
      <Popover anchor={<button type="button">T</button>} defaultOpen placement="left">
        c
      </Popover>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'left');
  });
});

// ────────────────────────────────────────────────────────────
// refs / id / className / aria
// ────────────────────────────────────────────────────────────

describe('Popover — refs and a11y', () => {
  it('forwards ref to the panel DOM node', () => {
    installRectAutoMocks();
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        defaultOpen
        ref={(node) => {
          captured = node;
        }}
      >
        c
      </Popover>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
    expect(captured).toBe(screen.getByRole('dialog'));
  });

  it('respects custom id, className, style', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover
        anchor={<button type="button">T</button>}
        defaultOpen
        id="my-popover"
        className="extra-class"
        style={{ background: 'red' }}
      >
        c
      </Popover>,
    );
    const panel = document.getElementById('my-popover')!;
    expect(panel).not.toBeNull();
    expect(panel.className).toContain('extra-class');
    expect(panel.style.background).toBe('red');
  });

  it('role=dialog with aria-modal=false (popover is not modal)', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen>
        c
      </Popover>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('false');
    expect(dialog).toHaveAttribute('tabindex', '-1');
  });

  it('anchor receives aria-expanded / aria-haspopup / aria-controls when click trigger', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen>
        c
      </Popover>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(btn).toHaveAttribute('aria-haspopup', 'dialog');
    expect(btn).toHaveAttribute('aria-controls');
  });

  it('emits the prefers-reduced-motion override rule', () => {
    installRectAutoMocks();
    renderWithProviders(
      <Popover anchor={<button type="button">T</button>} defaultOpen>
        c
      </Popover>,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
