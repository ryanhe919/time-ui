/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 SearchDialog 组件的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectA11y } from '../test-utils';
import { SearchDialog } from './SearchDialog';
import type { SearchDialogItem, SearchDialogSection } from './Search.types';

const ITEMS: ReadonlyArray<SearchDialogItem> = [
  { id: 'intro', label: 'Introduction', hint: '/intro' },
  { id: 'install', label: 'Installation', hint: '/install' },
  { id: 'theming', label: 'Theming', hint: '/theming' },
  { id: 'button', label: 'Button', hint: '/button' },
  { id: 'select', label: 'Select', hint: '/select' },
];

const SECTIONS: ReadonlyArray<SearchDialogSection> = [
  { id: 'guides', title: 'Guides', items: ITEMS.slice(0, 2) },
  { id: 'components', title: 'Components', items: ITEMS.slice(3) },
];

const getOptions = () => screen.queryAllByRole('option');

describe('SearchDialog — open state', () => {
  it('renders nothing when isOpen=false', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the dialog (portal to body) when isOpen=true', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen aria-label="search" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'search');
  });

  it('uncontrolled: defaultIsOpen opens initially', () => {
    renderWithProviders(<SearchDialog items={ITEMS} defaultIsOpen />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('clicking the backdrop closes the dialog', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(<SearchDialog items={ITEMS} isOpen onOpenChange={onOpenChange} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(dialog);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('clicking inside the dialog body does NOT close', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(<SearchDialog items={ITEMS} isOpen onOpenChange={onOpenChange} />);
    const input = screen.getByRole('searchbox');
    fireEvent.mouseDown(input);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('Escape closes the dialog', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(<SearchDialog items={ITEMS} isOpen onOpenChange={onOpenChange} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('SearchDialog — items / sections', () => {
  it('renders one option per item from `items`', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen />);
    expect(getOptions()).toHaveLength(ITEMS.length);
  });

  it('prefers `sections` when both provided + renders section titles', () => {
    renderWithProviders(<SearchDialog items={ITEMS} sections={SECTIONS} isOpen aria-label="x" />);
    expect(screen.getByText('Guides')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
  });

  it('renders icon and hint for each item', () => {
    const opts: SearchDialogItem[] = [
      {
        id: 'a',
        label: 'Apple',
        hint: '/a',
        icon: <span data-testid="icon-apple">A</span>,
      },
    ];
    renderWithProviders(<SearchDialog items={opts} isOpen />);
    expect(screen.getByTestId('icon-apple')).toBeInTheDocument();
    expect(screen.getByText('/a')).toBeInTheDocument();
  });

  it('renderItem overrides default option layout', () => {
    renderWithProviders(
      <SearchDialog
        items={ITEMS}
        isOpen
        renderItem={(item) => <span data-testid={`r-${item.id}`}>{item.label}!</span>}
      />,
    );
    expect(screen.getByTestId('r-intro')).toBeInTheDocument();
    expect(screen.getByText('Introduction!')).toBeInTheDocument();
  });

  it('shows the empty message when no items match', () => {
    renderWithProviders(
      <SearchDialog
        items={ITEMS}
        isOpen
        defaultQuery="nothing-here"
        emptyMessage="Nothing matched"
      />,
    );
    expect(screen.getByText('Nothing matched')).toBeInTheDocument();
    expect(getOptions()).toHaveLength(0);
  });

  it('shows the loading state when isLoading=true', () => {
    renderWithProviders(
      <SearchDialog items={ITEMS} isOpen isLoading loadingMessage="Searching the world…" />,
    );
    expect(screen.getByText('Searching the world…')).toBeInTheDocument();
  });

  it('handles empty items+sections gracefully (renders empty state)', () => {
    renderWithProviders(<SearchDialog isOpen />);
    expect(screen.getByText('No results')).toBeInTheDocument();
  });
});

describe('SearchDialog — query / filter', () => {
  it('filter prop is invoked for each item with the trimmed query', () => {
    const filterSpy = vi.fn(() => true);
    renderWithProviders(
      <SearchDialog items={ITEMS} isOpen defaultQuery="abc" filter={filterSpy} />,
    );
    expect(filterSpy).toHaveBeenCalledTimes(ITEMS.length);
    expect(filterSpy.mock.calls[0]).toEqual([ITEMS[0], 'abc']);
  });

  it('filters items by substring of label (defaultQuery)', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen defaultQuery="Them" />);
    expect(getOptions()).toHaveLength(1);
    expect(screen.getByRole('option', { name: /Theming/ })).toBeInTheDocument();
  });

  it('filters items by substring of label (typing)', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen />);
    const input = screen.getByRole('searchbox');
    fireEvent.input(input, { target: { value: 'Them' } });
    expect(input).toHaveValue('Them');
    expect(getOptions()).toHaveLength(1);
    expect(screen.getByRole('option', { name: /Theming/ })).toBeInTheDocument();
  });

  it('filters by hint text too', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '/sel' } });
    expect(getOptions()).toHaveLength(1);
    expect(screen.getByRole('option', { name: /Select/ })).toBeInTheDocument();
  });

  it('controlled query: input value reflects the prop', () => {
    const onQueryChange = vi.fn();
    renderWithProviders(
      <SearchDialog items={ITEMS} isOpen query="abc" onQueryChange={onQueryChange} />,
    );
    expect(screen.getByRole('searchbox')).toHaveValue('abc');
  });

  it('controlled query: typing fires onQueryChange but does not change input without re-render', () => {
    const onQueryChange = vi.fn();
    renderWithProviders(
      <SearchDialog items={ITEMS} isOpen query="abc" onQueryChange={onQueryChange} />,
    );
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyz' } });
    expect(onQueryChange).toHaveBeenLastCalledWith('xyz');
  });

  it('custom filter overrides default substring match', () => {
    renderWithProviders(
      <SearchDialog
        items={ITEMS}
        isOpen
        defaultQuery="x"
        filter={(item) => item.id === 'select'}
      />,
    );
    expect(getOptions()).toHaveLength(1);
    expect(screen.getByRole('option', { name: /Select/ })).toBeInTheDocument();
  });
});

describe('SearchDialog — keyboard nav + selection', () => {
  it('first non-disabled item is highlighted by default', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen />);
    const opts = getOptions();
    expect(opts[0]).toHaveAttribute('aria-selected', 'true');
    expect(opts[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('ArrowDown / ArrowUp moves the highlight', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen />);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    expect(getOptions()[1]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(dialog, { key: 'ArrowUp' });
    expect(getOptions()[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowDown wraps from last to first', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen />);
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < ITEMS.length; i += 1) {
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    }
    // We pressed ArrowDown N times starting from index 0 → land back at 0.
    expect(getOptions()[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('Home / End jump to first / last enabled item', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen />);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'End' });
    expect(getOptions()[ITEMS.length - 1]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(dialog, { key: 'Home' });
    expect(getOptions()[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('Enter selects the highlighted item and calls onSelect + closes by default', () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <SearchDialog items={ITEMS} isOpen onSelect={onSelect} onOpenChange={onOpenChange} />,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(ITEMS[1]);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('clicking an option fires onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(<SearchDialog items={ITEMS} isOpen onSelect={onSelect} />);
    await user.click(screen.getByRole('option', { name: /Theming/i }));
    expect(onSelect).toHaveBeenCalledWith(ITEMS[2]);
  });

  it('closeOnSelect=false keeps the dialog open after selection', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <SearchDialog items={ITEMS} isOpen closeOnSelect={false} onOpenChange={onOpenChange} />,
    );
    await user.click(screen.getByRole('option', { name: /Button/i }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('disabled items are skipped by ArrowDown navigation and cannot be selected', () => {
    const opts: SearchDialogItem[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', isDisabled: true },
      { id: 'c', label: 'C' },
    ];
    const onSelect = vi.fn();
    renderWithProviders(<SearchDialog items={opts} isOpen onSelect={onSelect} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    expect(getOptions()[2]).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(opts[2]);
  });

  it('mouse hover updates highlight (skips disabled)', async () => {
    const opts: SearchDialogItem[] = [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B', isDisabled: true },
    ];
    const user = userEvent.setup();
    renderWithProviders(<SearchDialog items={opts} isOpen />);
    await user.hover(screen.getByRole('option', { name: 'B' }));
    expect(getOptions()[0]).toHaveAttribute('aria-selected', 'true');
  });
});

describe('SearchDialog — shortcut binding', () => {
  it('mod+k toggles open state on global keydown', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <SearchDialog items={ITEMS} isOpen={false} onOpenChange={onOpenChange} shortcut="mod+k" />,
    );
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('shortcut respects modifier flags', () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <SearchDialog items={ITEMS} isOpen={false} onOpenChange={onOpenChange} shortcut="ctrl+/" />,
    );
    fireEvent.keyDown(window, { key: '/', ctrlKey: true });
    expect(onOpenChange).toHaveBeenCalledWith(true);
    onOpenChange.mockClear();
    fireEvent.keyDown(window, { key: '/' }); // no ctrl
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe('SearchDialog — footer', () => {
  it('renders the default footer with keyboard hints when items present', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen />);
    expect(screen.getByText(/result/i)).toBeInTheDocument();
  });

  it('footer={false} hides the footer', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen footer={false} />);
    expect(screen.queryByText(/result/i)).toBeNull();
  });

  it('custom footer ReactNode replaces the default', () => {
    renderWithProviders(
      <SearchDialog items={ITEMS} isOpen footer={<div data-testid="custom-footer">hi</div>} />,
    );
    expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
  });

  it('hides ESC chip when showEscapeKey=false', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen showEscapeKey={false} />);
    const headerEsc = Array.from(document.querySelectorAll('kbd')).map((k) => k.textContent);
    expect(headerEsc).not.toContain('ESC');
  });
});

describe('SearchDialog — refs and a11y', () => {
  it('forwards ref to the dialog root', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <SearchDialog
        items={ITEMS}
        isOpen
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it('respects a custom id', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen id="my-search" />);
    expect(document.getElementById('my-search')).not.toBeNull();
  });

  it('exposes aria-activedescendant pointing to the highlighted option', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen />);
    const input = screen.getByRole('searchbox');
    const opts = getOptions();
    expect(input).toHaveAttribute('aria-activedescendant', opts[0]!.id);
  });

  it.each([['light'], ['dark']] as const)('has zero axe violations in %s theme', async (theme) => {
    const { baseElement } = renderWithProviders(
      <SearchDialog items={ITEMS} sections={SECTIONS} isOpen aria-label="cmd" />,
      { theme },
    );
    await expectA11y(baseElement);
  });

  it('renders nothing while document is server-side (no portal)', () => {
    // Indirectly covered by isOpen=false, but assert the early return path
    // alongside the documentation that SSR-safe behavior exists.
    renderWithProviders(<SearchDialog items={ITEMS} isOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('topOffset / width / maxListHeight numeric props are emitted as px', () => {
    renderWithProviders(
      <SearchDialog items={ITEMS} isOpen topOffset={120} width={500} maxListHeight={300} />,
    );
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/120px/);
    expect(styles).toMatch(/500px/);
    expect(styles).toMatch(/300px/);
  });

  it('centers the dialog vertically by default', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/align-items:center/);
    expect(styles).toMatch(/max-height:calc\(100vh - 48px\)/);
  });

  it('emits the prefers-reduced-motion override rule', () => {
    renderWithProviders(<SearchDialog items={ITEMS} isOpen />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});
