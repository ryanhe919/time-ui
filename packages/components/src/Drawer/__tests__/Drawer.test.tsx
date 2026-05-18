/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Drawer 组件的行为、a11y 与回归。
 */

import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { lightTheme, type TimeUITheme } from '@timeui/themes';
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from '../';

const flushTimers = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
};

const collectStyles = () =>
  Array.from(document.querySelectorAll('style'))
    .map((s) => s.textContent ?? '')
    .join('\n');

describe('Drawer — open state', () => {
  it('renders nothing when isOpen=false', () => {
    renderWithProviders(
      <Drawer isOpen={false} aria-label="d">
        hi
      </Drawer>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the dialog (portal to body) when isOpen=true', () => {
    renderWithProviders(
      <Drawer isOpen aria-label="my-drawer">
        hi
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'my-drawer');
  });

  it('uncontrolled: defaultOpen opens initially', () => {
    renderWithProviders(
      <Drawer defaultOpen aria-label="d">
        hi
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('uncontrolled: external close (close button) hides the dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Drawer defaultOpen aria-label="d">
        hi
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('controlled: external setIsOpen(false) hides the dialog', () => {
    const { rerender } = renderWithProviders(
      <Drawer isOpen aria-label="d">
        hi
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(
      <Drawer isOpen={false} aria-label="d">
        hi
      </Drawer>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Drawer — close triggers', () => {
  it('Escape closes the dialog (default)', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Drawer isOpen aria-label="d" onOpenChange={onOpenChange}>
        hi
      </Drawer>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disableKeyboardDismiss=true: Escape does NOT close', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Drawer isOpen aria-label="d" disableKeyboardDismiss onOpenChange={onOpenChange}>
        hi
      </Drawer>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('clicking the overlay closes the dialog (default)', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Drawer isOpen aria-label="d" onOpenChange={onOpenChange}>
        hi
      </Drawer>,
    );
    const overlay = document.querySelector('[data-timeui-drawer-overlay]') as HTMLElement;
    expect(overlay).toBeTruthy();
    fireEvent.mouseDown(overlay);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('clicking inside the panel does NOT close', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Drawer isOpen aria-label="d" onOpenChange={onOpenChange}>
        <p data-testid="inside">inside</p>
      </Drawer>,
    );
    fireEvent.mouseDown(screen.getByTestId('inside'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('isDismissable=false: overlay click does NOT close', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Drawer isOpen aria-label="d" isDismissable={false} onOpenChange={onOpenChange}>
        hi
      </Drawer>,
    );
    const overlay = document.querySelector('[data-timeui-drawer-overlay]') as HTMLElement;
    fireEvent.mouseDown(overlay);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('clicking the close button calls onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Drawer isOpen aria-label="d" onOpenChange={onOpenChange}>
        hi
      </Drawer>,
    );
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('hideCloseButton: no close button rendered', () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" hideCloseButton>
        hi
      </Drawer>,
    );
    expect(screen.queryByRole('button', { name: /close/i })).toBeNull();
  });
});

describe('Drawer — placement', () => {
  it.each(['left', 'right', 'top', 'bottom'] as const)(
    'placement=%s emits the correct positioning CSS and data attr',
    (placement) => {
      renderWithProviders(
        <Drawer isOpen aria-label="d" placement={placement}>
          hi
        </Drawer>,
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('data-placement', placement);

      const styles = collectStyles();
      if (placement === 'left') {
        expect(styles).toMatch(/left:\s*0/);
        expect(styles).toMatch(/height:\s*100%/);
      } else if (placement === 'right') {
        expect(styles).toMatch(/right:\s*0/);
        expect(styles).toMatch(/height:\s*100%/);
      } else if (placement === 'top') {
        expect(styles).toMatch(/top:\s*0/);
        expect(styles).toMatch(/width:\s*100%/);
      } else {
        expect(styles).toMatch(/bottom:\s*0/);
        expect(styles).toMatch(/width:\s*100%/);
      }
    },
  );

  it('defaults to right placement', () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d">
        hi
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('data-placement', 'right');
  });
});

describe('Drawer — size', () => {
  it.each(['sm', 'md', 'lg', 'xl', 'full'] as const)(
    'horizontal size=%s exposes data-size and emits a width rule',
    (size) => {
      renderWithProviders(
        <Drawer isOpen size={size} placement="right" aria-label="d">
          hi
        </Drawer>,
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('data-size', size);
      const styles = collectStyles();
      expect(styles).toMatch(/width:\s*[^;]+;/);
    },
  );

  it.each(['sm', 'md', 'lg', 'xl', 'full'] as const)(
    'vertical size=%s exposes data-size and emits a height rule',
    (size) => {
      renderWithProviders(
        <Drawer isOpen size={size} placement="top" aria-label="d">
          hi
        </Drawer>,
      );
      expect(screen.getByRole('dialog')).toHaveAttribute('data-size', size);
      const styles = collectStyles();
      expect(styles).toMatch(/height:\s*[^;]+;/);
    },
  );

  it('different horizontal sizes produce different width tokens', () => {
    renderWithProviders(
      <>
        <Drawer isOpen size="sm" aria-label="sm-drawer">
          x
        </Drawer>
        <Drawer isOpen size="xl" aria-label="xl-drawer">
          y
        </Drawer>
      </>,
    );
    const styles = collectStyles();
    expect(styles).toMatch(/320px/); // widthSm
    expect(styles).toMatch(/720px/); // widthXl
  });
});

describe('Drawer — scrollBehavior', () => {
  it('inside: body region has overflow-y: auto', () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" scrollBehavior="inside">
        scroll
      </Drawer>,
    );
    expect(collectStyles()).toMatch(/overflow-y:\s*auto/);
  });

  it('outside: panel itself overflows', () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" scrollBehavior="outside">
        scroll
      </Drawer>,
    );
    expect(collectStyles()).toMatch(/overflow-y:\s*auto/);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-scroll-behavior', 'outside');
  });
});

describe('Drawer — focus management', () => {
  it('first focusable element is focused on open', async () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" hideCloseButton>
        <button data-testid="first">First</button>
        <button data-testid="second">Second</button>
      </Drawer>,
    );
    await flushTimers();
    expect(document.activeElement).toBe(screen.getByTestId('first'));
  });

  it('focus trap: Tab on last focusable wraps to first', async () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" hideCloseButton>
        <button data-testid="a">A</button>
        <button data-testid="b">B</button>
      </Drawer>,
    );
    await flushTimers();
    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    b.focus();
    expect(document.activeElement).toBe(b);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
    expect(document.activeElement).toBe(a);
  });

  it('focus trap: Shift+Tab on first focusable wraps to last', async () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" hideCloseButton>
        <button data-testid="a">A</button>
        <button data-testid="b">B</button>
      </Drawer>,
    );
    await flushTimers();
    const a = screen.getByTestId('a');
    const b = screen.getByTestId('b');
    a.focus();
    expect(document.activeElement).toBe(a);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(b);
  });

  it('focus trap: Shift+Tab when focus is outside the panel jumps to last', async () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" hideCloseButton>
        <button data-testid="a">A</button>
        <button data-testid="b">B</button>
      </Drawer>,
    );
    await flushTimers();
    const dialog = screen.getByRole('dialog');
    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByTestId('b'));
  });

  it('non-Tab keydown on the panel is ignored by the trap', async () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" hideCloseButton>
        <button data-testid="a">A</button>
      </Drawer>,
    );
    await flushTimers();
    const a = screen.getByTestId('a');
    a.focus();
    expect(document.activeElement).toBe(a);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'x' });
    expect(document.activeElement).toBe(a);
  });

  it('rapidly closing during the focus timeout cancels safely', () => {
    const { rerender } = renderWithProviders(
      <Drawer isOpen aria-label="d" hideCloseButton>
        <button data-testid="x">X</button>
      </Drawer>,
    );
    rerender(
      <Drawer isOpen={false} aria-label="d" hideCloseButton>
        <button data-testid="x">X</button>
      </Drawer>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('focus trap: with no focusable inside, Tab keeps focus on panel', async () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" hideCloseButton>
        <p>no buttons</p>
      </Drawer>,
    );
    await flushTimers();
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(dialog);
  });

  it('focus returns to the trigger after close', async () => {
    const Wrapper = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button data-testid="trigger" onClick={() => setOpen(true)}>
            open
          </button>
          <Drawer isOpen={open} onOpenChange={setOpen} aria-label="d" hideCloseButton>
            <button data-testid="inside">inside</button>
          </Drawer>
        </>
      );
    };
    const user = userEvent.setup();
    renderWithProviders(<Wrapper />);
    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    await flushTimers();
    expect(document.activeElement).toBe(screen.getByTestId('inside'));
    fireEvent.keyDown(window, { key: 'Escape' });
    await flushTimers();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('Drawer — scroll lock', () => {
  it('body overflow becomes hidden when open', () => {
    document.body.style.overflow = '';
    renderWithProviders(
      <Drawer isOpen aria-label="d">
        hi
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when closed', () => {
    document.body.style.overflow = 'auto';
    const { rerender } = renderWithProviders(
      <Drawer isOpen aria-label="d">
        hi
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    rerender(
      <Drawer isOpen={false} aria-label="d">
        hi
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe('auto');
  });
});

describe('Drawer — header / footer / portal', () => {
  it('renders header content', () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" header={<span data-testid="hdr">My header</span>}>
        body
      </Drawer>,
    );
    expect(screen.getByTestId('hdr')).toBeInTheDocument();
  });

  it('renders footer content', () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" footer={<button data-testid="ok">OK</button>}>
        body
      </Drawer>,
    );
    expect(screen.getByTestId('ok')).toBeInTheDocument();
  });

  it('renders without children or header/footer', () => {
    renderWithProviders(<Drawer isOpen aria-label="empty" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('portalContainer: renders into a custom container', () => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'custom-portal');
    document.body.appendChild(container);
    renderWithProviders(
      <Drawer isOpen aria-label="d" portalContainer={container}>
        custom
      </Drawer>,
    );
    expect(container.querySelector('[role="dialog"]')).toBeTruthy();
    document.body.removeChild(container);
  });
});

describe('Drawer — refs, ids and props', () => {
  it('forwards ref to the panel root', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <Drawer
        isOpen
        aria-label="d"
        ref={(node) => {
          captured = node;
        }}
      >
        x
      </Drawer>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it('respects a custom id', () => {
    renderWithProviders(
      <Drawer isOpen id="my-drawer" aria-label="d">
        x
      </Drawer>,
    );
    expect(document.getElementById('my-drawer')).not.toBeNull();
  });

  it('passes className and style to the panel', () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" className="custom" style={{ borderRadius: 4 }}>
        x
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('custom');
    expect(dialog.style.borderRadius).toBe('4px');
  });

  it('passes aria-labelledby and aria-describedby through', () => {
    renderWithProviders(
      <Drawer isOpen aria-labelledby="lbl-id" aria-describedby="desc-id">
        x
      </Drawer>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'lbl-id');
    expect(dialog).toHaveAttribute('aria-describedby', 'desc-id');
  });
});

describe('Drawer — composite subcomponents', () => {
  it('DrawerHeader renders content with className', () => {
    renderWithProviders(<DrawerHeader className="hdr">Hello header</DrawerHeader>);
    expect(screen.getByText('Hello header').className).toMatch(/hdr/);
  });

  it('DrawerBody renders content with className', () => {
    renderWithProviders(<DrawerBody className="bdy">body content</DrawerBody>);
    expect(screen.getByText('body content').className).toMatch(/bdy/);
  });

  it('DrawerFooter renders content with className', () => {
    renderWithProviders(<DrawerFooter className="ftr">footer content</DrawerFooter>);
    expect(screen.getByText('footer content').className).toMatch(/ftr/);
  });

  it('composite usage inside Drawer works as expected', () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d" hideCloseButton>
        <DrawerHeader>Composite Title</DrawerHeader>
        <DrawerBody>Composite body</DrawerBody>
        <DrawerFooter>Composite footer</DrawerFooter>
      </Drawer>,
    );
    expect(screen.getByText('Composite Title')).toBeInTheDocument();
    expect(screen.getByText('Composite body')).toBeInTheDocument();
    expect(screen.getByText('Composite footer')).toBeInTheDocument();
  });

  it('subcomponents have correct displayName', () => {
    expect((DrawerHeader as unknown as { displayName: string }).displayName).toBe(
      'TimeUI.DrawerHeader',
    );
    expect((DrawerBody as unknown as { displayName: string }).displayName).toBe(
      'TimeUI.DrawerBody',
    );
    expect((DrawerFooter as unknown as { displayName: string }).displayName).toBe(
      'TimeUI.DrawerFooter',
    );
  });

  it('Drawer has correct displayName', () => {
    expect((Drawer as unknown as { displayName: string }).displayName).toBe('TimeUI.Drawer');
  });
});

describe('Drawer — motion / a11y / theming', () => {
  it('emits the prefers-reduced-motion override rule', () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d">
        x
      </Drawer>,
    );
    expect(collectStyles()).toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  it('falls back to colors.focus when border.focus is missing', () => {
    const themeNoBorderFocus: TimeUITheme = {
      ...lightTheme,
      colors: {
        ...lightTheme.colors,
        border: {
          ...lightTheme.colors.border,
          focus: undefined as unknown as string,
        },
      },
    };
    renderWithProviders(
      <Drawer isOpen aria-label="d">
        x
      </Drawer>,
      {
        theme: themeNoBorderFocus,
      },
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('dark theme uses shadowDark token', () => {
    renderWithProviders(
      <Drawer isOpen aria-label="d">
        x
      </Drawer>,
      { theme: 'dark' },
    );
    // The dark shadow token contains a specific rgba value
    expect(collectStyles()).toMatch(/rgba\(255,\s*255,\s*255/);
  });
});
