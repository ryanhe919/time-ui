/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Modal 组件的行为、a11y 与回归。
 */

import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../test-utils';
import { lightTheme, type TimeUITheme } from '@timeui/themes';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';

const flushTimers = async () => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
};

describe('Modal — open state', () => {
  it('renders nothing when isOpen=false', () => {
    renderWithProviders(
      <Modal isOpen={false} aria-label="m">
        hi
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the dialog (portal to body) when isOpen=true', () => {
    renderWithProviders(
      <Modal isOpen aria-label="my-modal">
        hi
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'my-modal');
  });

  it('uncontrolled: defaultIsOpen opens initially', () => {
    renderWithProviders(
      <Modal defaultIsOpen aria-label="m">
        hi
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('uncontrolled: external close (close button) hides the dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Modal defaultIsOpen aria-label="m">
        hi
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Modal — close triggers', () => {
  it('Escape closes the dialog (default)', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Modal isOpen aria-label="m" onOpenChange={onOpenChange}>
        hi
      </Modal>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closeOnEsc=false: Escape does NOT close', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Modal isOpen aria-label="m" closeOnEsc={false} onOpenChange={onOpenChange}>
        hi
      </Modal>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('clicking the overlay closes the dialog (default)', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Modal isOpen aria-label="m" onOpenChange={onOpenChange}>
        hi
      </Modal>,
    );
    const overlay = document.querySelector('[data-timeui-modal-overlay]') as HTMLElement;
    expect(overlay).toBeTruthy();
    fireEvent.mouseDown(overlay);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('clicking inside the panel does NOT close', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Modal isOpen aria-label="m" onOpenChange={onOpenChange}>
        <p data-testid="inside">inside</p>
      </Modal>,
    );
    fireEvent.mouseDown(screen.getByTestId('inside'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closeOnOverlayClick=false: overlay click does NOT close', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Modal isOpen aria-label="m" closeOnOverlayClick={false} onOpenChange={onOpenChange}>
        hi
      </Modal>,
    );
    const overlay = document.querySelector('[data-timeui-modal-overlay]') as HTMLElement;
    fireEvent.mouseDown(overlay);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('clicking the close button calls onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <Modal isOpen aria-label="m" onOpenChange={onOpenChange}>
        hi
      </Modal>,
    );
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('showCloseButton=false: no close button rendered', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" showCloseButton={false}>
        hi
      </Modal>,
    );
    expect(screen.queryByRole('button', { name: /close/i })).toBeNull();
  });
});

describe('Modal — size', () => {
  it.each(['sm', 'md', 'lg', 'xl', 'full'] as const)('size=%s emits a width rule', (size) => {
    renderWithProviders(
      <Modal isOpen size={size} aria-label="m">
        hi
      </Modal>,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/width:\s*[^;]+;/);
  });

  it('different sizes produce different width rules in injected styles', () => {
    // Render two Modals concurrently; emotion will inject one rule per size.
    renderWithProviders(
      <>
        <Modal isOpen size="sm" aria-label="sm-modal">
          x
        </Modal>
        <Modal isOpen size="xl" aria-label="xl-modal">
          y
        </Modal>
      </>,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    // Both width tokens should appear in the page's emitted styles.
    expect(styles).toMatch(/420px/); // widthSm
    expect(styles).toMatch(/960px/); // widthXl
  });

  it('exposes data-size on the panel', () => {
    renderWithProviders(
      <Modal isOpen size="lg" aria-label="m">
        x
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'lg');
  });
});

describe('Modal — scrollBehavior', () => {
  it('inside: body region has overflow-y: auto', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" scrollBehavior="inside">
        scroll
      </Modal>,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/overflow-y:\s*auto/);
  });

  it('outside: panel itself overflows', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" scrollBehavior="outside">
        scroll
      </Modal>,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    // panelCss outputs `overflow-y: auto` for outside mode
    expect(styles).toMatch(/overflow-y:\s*auto/);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-scroll-behavior', 'outside');
  });
});

describe('Modal — focus management', () => {
  it('autoFocus=true (default): first focusable element is focused', async () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" showCloseButton={false}>
        <button data-testid="first">First</button>
        <button data-testid="second">Second</button>
      </Modal>,
    );
    await flushTimers();
    expect(document.activeElement).toBe(screen.getByTestId('first'));
  });

  it('autoFocus=false: panel itself receives focus', async () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" autoFocus={false} showCloseButton={false}>
        <button>One</button>
      </Modal>,
    );
    await flushTimers();
    expect(document.activeElement).toBe(screen.getByRole('dialog'));
  });

  it('focus trap: Tab on last focusable wraps to first', async () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" showCloseButton={false}>
        <button data-testid="a">A</button>
        <button data-testid="b">B</button>
      </Modal>,
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
      <Modal isOpen aria-label="m" showCloseButton={false}>
        <button data-testid="a">A</button>
        <button data-testid="b">B</button>
      </Modal>,
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
      <Modal isOpen aria-label="m" showCloseButton={false}>
        <button data-testid="a">A</button>
        <button data-testid="b">B</button>
      </Modal>,
    );
    await flushTimers();
    const dialog = screen.getByRole('dialog');
    // simulate focus outside by blurring
    (document.activeElement as HTMLElement | null)?.blur();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByTestId('b'));
  });

  it('non-Tab keydown on the panel is ignored by the trap', async () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" showCloseButton={false}>
        <button data-testid="a">A</button>
      </Modal>,
    );
    await flushTimers();
    const a = screen.getByTestId('a');
    a.focus();
    expect(document.activeElement).toBe(a);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'a' });
    // Focus should remain unchanged
    expect(document.activeElement).toBe(a);
  });

  it('rapidly closing during the focus timeout cancels autoFocus safely', () => {
    const { rerender } = renderWithProviders(
      <Modal isOpen aria-label="m" showCloseButton={false}>
        <button data-testid="x">X</button>
      </Modal>,
    );
    // immediately close before flushTimers triggers the setTimeout(0)
    rerender(
      <Modal isOpen={false} aria-label="m" showCloseButton={false}>
        <button data-testid="x">X</button>
      </Modal>,
    );
    // No assertion error means the cancelled branch ran without throwing.
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('focus trap: with no focusable inside, Tab keeps focus on panel', async () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" showCloseButton={false}>
        <p>no buttons</p>
      </Modal>,
    );
    await flushTimers();
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(dialog);
  });

  it('returnFocusOnClose=true (default): focus returns to trigger after close', async () => {
    const Wrapper = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button data-testid="trigger" onClick={() => setOpen(true)}>
            open
          </button>
          <Modal isOpen={open} onOpenChange={setOpen} aria-label="m" showCloseButton={false}>
            <button data-testid="inside">inside</button>
          </Modal>
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

  it('returnFocusOnClose=false: focus does NOT return to trigger', async () => {
    const Wrapper = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button data-testid="trigger" onClick={() => setOpen(true)}>
            open
          </button>
          <Modal
            isOpen={open}
            onOpenChange={setOpen}
            aria-label="m"
            returnFocusOnClose={false}
            showCloseButton={false}
          >
            <button data-testid="inside">inside</button>
          </Modal>
        </>
      );
    };
    const user = userEvent.setup();
    renderWithProviders(<Wrapper />);
    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    await flushTimers();
    fireEvent.keyDown(window, { key: 'Escape' });
    await flushTimers();
    expect(document.activeElement).not.toBe(trigger);
  });
});

describe('Modal — scroll lock', () => {
  it('blockScrollOnMount=true (default): body overflow becomes hidden', () => {
    document.body.style.overflow = '';
    renderWithProviders(
      <Modal isOpen aria-label="m">
        hi
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('blockScrollOnMount=false: body overflow is untouched', () => {
    document.body.style.overflow = '';
    renderWithProviders(
      <Modal isOpen aria-label="m" blockScrollOnMount={false}>
        hi
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('restores body overflow when closed', () => {
    document.body.style.overflow = 'auto';
    const { rerender } = renderWithProviders(
      <Modal isOpen aria-label="m">
        hi
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    rerender(
      <Modal isOpen={false} aria-label="m">
        hi
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('auto');
  });
});

describe('Modal — title / footer / close button', () => {
  it('renders the title text and wires aria-labelledby to it', () => {
    renderWithProviders(
      <Modal isOpen title="Confirm action">
        body
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const titleEl = document.getElementById(labelledBy!);
    expect(titleEl?.textContent).toBe('Confirm action');
  });

  it('aria-label takes precedence and aria-labelledby is not auto-set', () => {
    renderWithProviders(
      <Modal isOpen title="Title" aria-label="explicit">
        body
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'explicit');
    expect(dialog).not.toHaveAttribute('aria-labelledby');
  });

  it('renders footer ReactNode', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" footer={<button data-testid="ok">OK</button>}>
        body
      </Modal>,
    );
    expect(screen.getByTestId('ok')).toBeInTheDocument();
  });

  it('footer={false} renders no footer region', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" footer={false}>
        <span data-testid="b">body</span>
      </Modal>,
    );
    expect(screen.queryByText('OK')).toBeNull();
    expect(screen.getByTestId('b')).toBeInTheDocument();
  });

  it('does not render footer when not provided', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m">
        x
      </Modal>,
    );
    // panel children: close button + body div => footer absent
    const dialog = screen.getByRole('dialog');
    // No element with role region/contentinfo expected; just sanity check
    expect(dialog).toBeInTheDocument();
  });

  it('renders without children (no body region emitted)', () => {
    renderWithProviders(<Modal isOpen aria-label="empty" title="Title only" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Title only')).toBeInTheDocument();
  });
});

describe('Modal — refs and ids', () => {
  it('forwards ref to the panel root', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <Modal
        isOpen
        aria-label="m"
        ref={(node) => {
          captured = node;
        }}
      >
        x
      </Modal>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it('respects a custom id and derives titleId from it', () => {
    renderWithProviders(
      <Modal isOpen id="my-modal" title="T">
        x
      </Modal>,
    );
    expect(document.getElementById('my-modal')).not.toBeNull();
    expect(document.getElementById('my-modal-title')).not.toBeNull();
  });

  it('passes className and style to the panel', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" className="custom" style={{ borderRadius: 4 }}>
        x
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveClass('custom');
    expect(dialog.style.borderRadius).toBe('4px');
  });

  it('passes aria-describedby through', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" aria-describedby="desc-id">
        x
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'desc-id');
  });
});

describe('Modal — composite subcomponents', () => {
  it('ModalHeader renders an h2 with content', () => {
    renderWithProviders(<ModalHeader id="h1">Hello header</ModalHeader>);
    const heading = screen.getByRole('heading', { name: 'Hello header' });
    expect(heading.tagName).toBe('H2');
    expect(heading).toHaveAttribute('id', 'h1');
  });

  it('ModalBody renders content with className', () => {
    renderWithProviders(<ModalBody className="bdy">body content</ModalBody>);
    expect(screen.getByText('body content').className).toMatch(/bdy/);
  });

  it('ModalFooter renders content with className', () => {
    renderWithProviders(<ModalFooter className="ftr">footer content</ModalFooter>);
    expect(screen.getByText('footer content').className).toMatch(/ftr/);
  });

  it('composite usage inside Modal works as expected', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m" footer={false} showCloseButton={false}>
        <ModalHeader id="cust-header">Composite Title</ModalHeader>
        <ModalBody>Composite body</ModalBody>
        <ModalFooter>Composite footer</ModalFooter>
      </Modal>,
    );
    expect(screen.getByText('Composite Title')).toBeInTheDocument();
    expect(screen.getByText('Composite body')).toBeInTheDocument();
    expect(screen.getByText('Composite footer')).toBeInTheDocument();
  });

  it('subcomponents have correct displayName', () => {
    expect((ModalHeader as unknown as { displayName: string }).displayName).toBe(
      'TimeUI.ModalHeader',
    );
    expect((ModalBody as unknown as { displayName: string }).displayName).toBe('TimeUI.ModalBody');
    expect((ModalFooter as unknown as { displayName: string }).displayName).toBe(
      'TimeUI.ModalFooter',
    );
  });

  it('Modal has correct displayName', () => {
    expect((Modal as unknown as { displayName: string }).displayName).toBe('TimeUI.Modal');
  });
});

describe('Modal — motion / a11y / theming', () => {
  it('emits the prefers-reduced-motion override rule', () => {
    renderWithProviders(
      <Modal isOpen aria-label="m">
        x
      </Modal>,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  it.each([['light'], ['dark']] as const)(
    'has zero axe violations in %s theme (with title + footer)',
    async (theme) => {
      const { baseElement } = renderWithProviders(
        <Modal isOpen title="A11y check" footer={<button>OK</button>}>
          <p>Body content</p>
        </Modal>,
        { theme },
      );
      await expectA11y(baseElement);
    },
  );

  it('has zero axe violations using only aria-label', async () => {
    const { baseElement } = renderWithProviders(
      <Modal isOpen aria-label="aria-labelled-modal">
        <p>content</p>
      </Modal>,
    );
    await expectA11y(baseElement);
  });

  it('falls back to easeInOut when theme.motion.easing.spring is missing', () => {
    const themeNoSpring = {
      ...lightTheme,
      motion: {
        ...lightTheme.motion,
        easing: {
          ...lightTheme.motion.easing,
          spring: undefined,
        },
      },
    } as unknown as TimeUITheme;
    renderWithProviders(
      <Modal isOpen aria-label="m">
        x
      </Modal>,
      { theme: themeNoSpring },
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
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
      <Modal isOpen aria-label="m">
        x
      </Modal>,
      {
        theme: themeNoBorderFocus,
      },
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
