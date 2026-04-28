/**
 * @author Ryan He
 * @date 2026-04-28
 * @description LiveEditor 单测（spec v2 §10 测试要点 4-7 + a11y / read-only）。
 *
 *              本文件聚焦客户端可编辑路径的状态机：
 *                E1. 初始 code 直接喂 transpile → preview 立刻渲染。
 *                E2. 编辑 code → 300ms 内多次 onChange 只触发 1 次 transpile（debounce）。
 *                E3. parse-error → amber banner 出现，preview 保留上一次成功结果（spec §7 不变量）。
 *                E4. scope-error → 同上 banner，preview 保留。
 *                E5. runtime-error → 全屏 ErrorBoundary 红 alert（不走 banner）。
 *                E6. CodeEditor isInvalid + aria-describedby 在 parse/scope error 期间正确接线。
 *                E7. "Show code" 切换 aria-expanded + 隐藏 CodeEditor 面板（默认 false）。
 *                E8. defaultCodeOpen=true 时 CodeEditor 默认展开。
 *                E9. editable=false → CodeEditor isReadOnly = true。
 *                E10. "Restore" 按钮回滚到 lastGoodCode 并立即清掉 banner。
 *                E11. initialCode prop 变化时本地状态同步重置（罕见的 MDX re-render 路径）。
 *                E12. a11y axe 0 violations（light + dark 主题）。
 *
 *              **mock 策略**：
 *              - 替换 `@timeui/react/code-editor`：用一个简单 `<textarea aria-label />` 模拟，
 *                透传 onChange / value / isReadOnly / isInvalid / aria-describedby，
 *                避免启动 CodeMirror（在 jsdom 里不必要、且会拖慢测试）。
 *              - 替换 `../scope`：用最小 scope（React + Button），让 transpile 真实执行
 *                但不依赖 timeui-client 全栈。这样错误路径用真实 transpile 测，覆盖率最有效。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Fragment, createElement } from 'react';
import { fireEvent, screen, act } from '@testing-library/react';
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

// ─── Stub the timeui CodeEditor (real one boots CodeMirror) ─────────────────
vi.mock('@timeui/react/code-editor', () => ({
  CodeEditor: ({
    value,
    onChange,
    isReadOnly,
    isInvalid,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
  }: {
    value: string;
    onChange?: (next: string) => void;
    isReadOnly?: boolean;
    isInvalid?: boolean;
    'aria-label'?: string;
    'aria-describedby'?: string;
  }) => (
    <textarea
      data-testid="code-editor"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-invalid={isInvalid ? 'true' : 'false'}
      readOnly={isReadOnly}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

// ─── Replace `liveScope` with a minimal one ─────────────────────────────────
// Real scope imports timeui-client + dozens of demo components — heavy in
// jsdom. Our minimal scope keeps `Button` so transpile success/failure paths
// are exercised authentically without the noise.
vi.mock('../scope', () => {
  const ReactNamespace = { Fragment, createElement };
  const Button = (props: { children?: React.ReactNode; onClick?: () => void }) =>
    createElement(
      'button',
      { type: 'button', 'data-testid': 'demo-button', onClick: props.onClick },
      props.children,
    );
  // Component that throws during render — used by E5 to drive the
  // PreviewErrorBoundary path. The throw happens inside React's render phase,
  // *after* a successful transpile, so it lands in the boundary (not in the
  // amber banner).
  const Crasher = () => {
    throw new Error('boom-from-render');
  };
  const thrower = () => {
    throw new Error('boom-from-factory');
  };
  return {
    liveScope: Object.freeze({
      React: ReactNamespace,
      Fragment,
      Button,
      Crasher,
      thrower,
    }),
  };
});

// Import AFTER mocks — vi.mock factories are hoisted but the module wrapping
// LiveEditor needs the mocks resolved before its top-level imports run.
import LiveEditor from '../LiveEditor';

const TRIVIAL_CODE = '<Button>OK</Button>';

beforeEach(() => {
  // Each test starts with a clean fake-timer slate.
  vi.useRealTimers();
});

describe('LiveEditor · happy path', () => {
  it('E1: initial code transpiles + renders the preview synchronously', () => {
    renderWithProviders(<LiveEditor code={TRIVIAL_CODE} />);
    // Demo Button stub renders inside the preview region.
    expect(screen.getByTestId('demo-button')).toBeInTheDocument();
    // Header advertises Editable mode by default.
    expect(screen.getByText(/Editable/i)).toBeInTheDocument();
    // No error banner.
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('E7: "Show code" toggle flips aria-expanded and reveals/hides the CodeEditor panel', () => {
    const { container } = renderWithProviders(<LiveEditor code={TRIVIAL_CODE} />);
    const button = screen.getByRole('button', { name: /Show code/i });
    expect(button.getAttribute('aria-expanded')).toBe('false');

    // The textarea exists in the DOM but its panel wrapper has the `hidden` attribute.
    const panelBefore = container.querySelector('[id$="-code"][hidden]');
    expect(panelBefore).not.toBeNull();

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const panelAfter = container.querySelector('[id$="-code"]:not([hidden])');
    expect(panelAfter).not.toBeNull();
  });

  it('E8: defaultCodeOpen=true renders the editor visible on first paint', () => {
    const { container } = renderWithProviders(<LiveEditor code={TRIVIAL_CODE} defaultCodeOpen />);
    const panel = container.querySelector('[id$="-code"]');
    expect(panel).not.toBeNull();
    expect(panel?.hasAttribute('hidden')).toBe(false);
  });

  it('E9: editable=false flips CodeEditor into read-only', () => {
    renderWithProviders(<LiveEditor code={TRIVIAL_CODE} editable={false} defaultCodeOpen />);
    const editor = screen.getByTestId('code-editor') as HTMLTextAreaElement;
    expect(editor.readOnly).toBe(true);
    // Header label flips too.
    expect(screen.getByText(/Read-only/i)).toBeInTheDocument();
  });
});

describe('LiveEditor · debounce (spec v2 §9 — 300ms)', () => {
  it('E2: multiple keystrokes < 300ms apart only trigger one transpile', () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<LiveEditor code={TRIVIAL_CODE} defaultCodeOpen />);
      const editor = screen.getByTestId('code-editor') as HTMLTextAreaElement;
      // 5 fast keystrokes, all under 300ms.
      act(() => {
        for (let i = 1; i <= 5; i += 1) {
          fireEvent.change(editor, { target: { value: `<Button>v${i}</Button>` } });
          vi.advanceTimersByTime(50);
        }
      });
      // Only the original ("OK") preview is in the DOM — debounce hasn't fired.
      expect(screen.getByTestId('demo-button').textContent).toBe('OK');
      // Now flush the debounce.
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByTestId('demo-button').textContent).toBe('v5');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('LiveEditor · parse / scope errors (spec v2 §7 keep-last-good)', () => {
  it('E3: parse-error shows amber banner and keeps the previous good preview', () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<LiveEditor code={TRIVIAL_CODE} defaultCodeOpen />);
      const editor = screen.getByTestId('code-editor') as HTMLTextAreaElement;

      // Type a syntactically broken JSX and let the debounce fire.
      act(() => {
        fireEvent.change(editor, { target: { value: '<Button' } });
        vi.advanceTimersByTime(400);
      });

      // Banner appears.
      const banner = screen.getByRole('alert');
      expect(banner.textContent).toMatch(/ParseError/i);

      // Preview still shows the previous good "OK" button (no flicker).
      expect(screen.getByTestId('demo-button').textContent).toBe('OK');
    } finally {
      vi.useRealTimers();
    }
  });

  it('E4: scope-error shows banner and keeps the previous preview', () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<LiveEditor code={TRIVIAL_CODE} defaultCodeOpen />);
      const editor = screen.getByTestId('code-editor') as HTMLTextAreaElement;

      act(() => {
        fireEvent.change(editor, { target: { value: '<UnknownCmp />' } });
        vi.advanceTimersByTime(400);
      });

      const banner = screen.getByRole('alert');
      expect(banner.textContent).toMatch(/ScopeError/i);
      expect(screen.getByTestId('demo-button').textContent).toBe('OK');
    } finally {
      vi.useRealTimers();
    }
  });

  it('E6: parse/scope error wires aria-describedby + aria-invalid on the editor', () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<LiveEditor code={TRIVIAL_CODE} defaultCodeOpen />);
      const editor = screen.getByTestId('code-editor') as HTMLTextAreaElement;
      // Initially: no banner, editor not described, not invalid.
      expect(editor.getAttribute('aria-invalid')).toBe('false');
      expect(editor.getAttribute('aria-describedby')).toBeNull();

      act(() => {
        fireEvent.change(editor, { target: { value: '<Button' } });
        vi.advanceTimersByTime(400);
      });

      const banner = screen.getByRole('alert');
      expect(editor.getAttribute('aria-invalid')).toBe('true');
      expect(editor.getAttribute('aria-describedby')).toBe(banner.id);
    } finally {
      vi.useRealTimers();
    }
  });

  it('E10: "Restore" button rolls back code to the last successful version + clears banner', () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<LiveEditor code={TRIVIAL_CODE} defaultCodeOpen />);
      const editor = screen.getByTestId('code-editor') as HTMLTextAreaElement;

      act(() => {
        fireEvent.change(editor, { target: { value: '<Button' } });
        vi.advanceTimersByTime(400);
      });
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Click restore.
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: /Restore last good code/i }));
      });
      // Editor value snapped back.
      expect((screen.getByTestId('code-editor') as HTMLTextAreaElement).value).toBe(TRIVIAL_CODE);
      // Banner gone.
      expect(screen.queryByRole('alert')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('LiveEditor · runtime errors (spec v2 §7 — full red boundary)', () => {
  it('E5a: factory-time runtime error renders a red alert instead of failing silently', () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<LiveEditor code={TRIVIAL_CODE} defaultCodeOpen />);
      const editor = screen.getByTestId('code-editor') as HTMLTextAreaElement;

      act(() => {
        fireEvent.change(editor, { target: { value: '<Button>{thrower()}</Button>' } });
        vi.advanceTimersByTime(400);
      });

      const alert = screen.getByRole('alert');
      expect(alert.textContent).toMatch(/Runtime error/i);
      expect(alert.textContent).toMatch(/boom-from-factory/);
      expect(alert.textContent).not.toMatch(/ParseError|ScopeError/);
      expect(screen.queryByTestId('demo-button')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('E5: render-time throw is caught by PreviewErrorBoundary as a red alert', () => {
    // `Crasher` throws during React render (NOT during transpile) — exactly
    // what the boundary is for. Banner stays empty (parse/scope only); the
    // boundary owns the visible alert.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      renderWithProviders(<LiveEditor code={'<Crasher />'} />);
      // Boundary's red alert appears.
      const alerts = screen.getAllByRole('alert');
      const boundary = alerts.find((n) => /Runtime error/i.test(n.textContent ?? ''));
      expect(boundary).toBeTruthy();
      expect(boundary?.textContent).toMatch(/boom-from-render/);
      // No "ParseError" / "ScopeError" wording on a render-time throw.
      expect(boundary?.textContent ?? '').not.toMatch(/ParseError|ScopeError/);
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it('boundary clears when re-keyed by a successful transpile', () => {
    vi.useFakeTimers();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { rerender } = renderWithProviders(<LiveEditor code={'<Crasher />'} defaultCodeOpen />);
      // Confirm the boundary's red alert fired.
      const initialAlert = screen
        .getAllByRole('alert')
        .find((n) => /Runtime error/i.test(n.textContent ?? ''));
      expect(initialAlert).toBeTruthy();

      // Switch to a healthy snippet — boundary key flips → boundary remounts
      // → cleared state.
      rerender(<LiveEditor code={TRIVIAL_CODE} defaultCodeOpen />);
      act(() => {
        vi.advanceTimersByTime(400);
      });
      const alertsAfter = screen.queryAllByRole('alert');
      const stillRuntime = alertsAfter.find((n) => /Runtime error/i.test(n.textContent ?? ''));
      expect(stillRuntime).toBeUndefined();
      // And the new healthy preview is in place.
      expect(screen.getByTestId('demo-button').textContent).toBe('OK');
    } finally {
      consoleSpy.mockRestore();
      vi.useRealTimers();
    }
  });
});

describe('LiveEditor · prop reactivity', () => {
  it('E11: changing the `code` prop resets the local editor state', () => {
    const { rerender } = renderWithProviders(<LiveEditor code={TRIVIAL_CODE} defaultCodeOpen />);
    expect((screen.getByTestId('code-editor') as HTMLTextAreaElement).value).toBe(TRIVIAL_CODE);

    rerender(<LiveEditor code={'<Button>NEW</Button>'} defaultCodeOpen />);
    expect((screen.getByTestId('code-editor') as HTMLTextAreaElement).value).toBe(
      '<Button>NEW</Button>',
    );
    expect(screen.getByTestId('demo-button').textContent).toBe('NEW');
  });
});

describe('LiveEditor · a11y', () => {
  it.each([{ theme: 'light' as const }, { theme: 'dark' as const }])(
    'E12: zero axe violations in $theme theme',
    async ({ theme }) => {
      const { container } = renderWithProviders(
        <LiveEditor code={TRIVIAL_CODE} defaultCodeOpen />,
        { theme },
      );
      await expectA11y(container);
    },
  );
});
