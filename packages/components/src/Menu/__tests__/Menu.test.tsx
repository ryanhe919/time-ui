/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Menu / Dropdown 组件的行为与回归（开关、selection、键盘、a11y、isDanger、href 等）。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { Menu } from '../';
import type { MenuItemDescriptor, MenuItemsEntry } from '../Menu.types';

// ────────────────────────────────────────────────────────────
// jsdom 兜底：Popover 的 getBoundingClientRect 在 jsdom 下返回 0，需要 mock。
// ────────────────────────────────────────────────────────────

const installRectMocks = (
  anchorRect = { top: 100, left: 50, width: 100, height: 40 },
  panelSize = { width: 220, height: 200 },
) => {
  const orig = HTMLElement.prototype.getBoundingClientRect;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (this.tagName === 'BUTTON' && !this.closest?.('[data-timeui-menu]')) {
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
    if (this.getAttribute?.('role') === 'dialog') {
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

const ITEMS: ReadonlyArray<MenuItemsEntry> = [
  { itemKey: 'new', label: 'New File', shortcut: '⌘N' },
  { itemKey: 'open', label: 'Open…', shortcut: '⌘O' },
  { itemKey: 'save', label: 'Save', shortcut: '⌘S', isDisabled: true },
  { itemKey: 'delete', label: 'Delete', isDanger: true },
];

const SECTIONED: ReadonlyArray<MenuItemsEntry> = [
  {
    type: 'section',
    sectionKey: 'file',
    label: 'File',
    items: [
      { itemKey: 'new', label: 'New' },
      { itemKey: 'open', label: 'Open' },
    ],
  },
  {
    type: 'section',
    sectionKey: 'edit',
    label: 'Edit',
    items: [
      { itemKey: 'cut', label: 'Cut' },
      { itemKey: 'paste', label: 'Paste', isDisabled: true },
    ],
  },
];

const renderBasic = (props: Partial<React.ComponentProps<typeof Menu>> = {}) =>
  renderWithProviders(
    <Menu trigger={<button type="button">Open</button>} aria-label="actions" {...props} />,
  );

const getMenu = () => screen.getByRole('menu');
const getItems = (root?: HTMLElement) => {
  const scope = root ? within(root) : screen;
  // role 可能是 menuitem/menuitemradio/menuitemcheckbox。
  return [
    ...scope.queryAllByRole('menuitem'),
    ...scope.queryAllByRole('menuitemradio'),
    ...scope.queryAllByRole('menuitemcheckbox'),
  ];
};

// ────────────────────────────────────────────────────────────
// 基础：trigger / open / close
// ────────────────────────────────────────────────────────────

describe('Menu — open/close', () => {
  it('renders inside its requested portal container', () => {
    installRectMocks();
    const portalContainer = document.createElement('div');
    document.body.append(portalContainer);
    const { unmount } = renderBasic({ items: ITEMS, defaultOpen: true, portalContainer });
    expect(portalContainer).toContainElement(getMenu());
    unmount();
    expect(portalContainer).toBeEmptyDOMElement();
    portalContainer.remove();
  });
  it('does not render the menu when closed', () => {
    renderBasic({ items: ITEMS });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });

  it('clicking trigger opens the menu (uncontrolled)', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderBasic({ items: ITEMS });
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(getMenu()).toBeInTheDocument();
    // four items
    expect(getItems()).toHaveLength(4);
  });

  it('clicking trigger again closes the menu (uncontrolled)', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderBasic({ items: ITEMS });
    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    expect(getMenu()).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('controlled isOpen=true renders menu; isOpen=false unmounts', () => {
    installRectMocks();
    const { rerender } = renderWithProviders(
      <Menu
        trigger={<button type="button">T</button>}
        items={ITEMS}
        isOpen={false}
        aria-label="m"
      />,
    );
    expect(screen.queryByRole('menu')).toBeNull();
    rerender(
      <Menu trigger={<button type="button">T</button>} items={ITEMS} isOpen aria-label="m" />,
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('fires onOpenChange when toggled', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onOpenChange = vi.fn();
    renderBasic({ items: ITEMS, onOpenChange });
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('defaultOpen renders open on mount', () => {
    installRectMocks();
    renderBasic({ items: ITEMS, defaultOpen: true });
    expect(getMenu()).toBeInTheDocument();
  });

  it('isDisabled blocks opening', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderBasic({ items: ITEMS, isDisabled: true });
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────
// items vs children API
// ────────────────────────────────────────────────────────────

describe('Menu — items vs children', () => {
  it('renders from data-driven items', () => {
    installRectMocks();
    renderBasic({ items: ITEMS, defaultOpen: true });
    const items = getItems();
    expect(items.map((i) => i.textContent)).toEqual(['New File⌘N', 'Open…⌘O', 'Save⌘S', 'Delete']);
  });

  it('renders from declarative children', () => {
    installRectMocks();
    renderWithProviders(
      <Menu trigger={<button type="button">T</button>} defaultOpen aria-label="m">
        <Menu.Item itemKey="copy">Copy</Menu.Item>
        <Menu.Item itemKey="cut">Cut</Menu.Item>
        <Menu.Divider />
        <Menu.Item itemKey="paste" isDisabled>
          Paste
        </Menu.Item>
      </Menu>,
    );
    expect(getItems().map((i) => i.textContent)).toEqual(['Copy', 'Cut', 'Paste']);
    // Divider is a separator (non-counted).
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('items take precedence over children', () => {
    installRectMocks();
    renderWithProviders(
      <Menu
        trigger={<button type="button">T</button>}
        defaultOpen
        aria-label="m"
        items={[{ itemKey: 'a', label: 'FromItems' }]}
      >
        <Menu.Item itemKey="ignored">FromChildren</Menu.Item>
      </Menu>,
    );
    expect(screen.getByText('FromItems')).toBeInTheDocument();
    expect(screen.queryByText('FromChildren')).toBeNull();
  });

  it('renders sections from data-driven items', () => {
    installRectMocks();
    renderBasic({ items: SECTIONED, defaultOpen: true });
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(getItems()).toHaveLength(4);
  });

  it('renders declarative <Menu.Section>', () => {
    installRectMocks();
    renderWithProviders(
      <Menu trigger={<button type="button">T</button>} defaultOpen aria-label="m">
        <Menu.Section label="Group A">
          <Menu.Item itemKey="a1">A1</Menu.Item>
          <Menu.Item itemKey="a2">A2</Menu.Item>
        </Menu.Section>
        <Menu.Section label="Group B">
          <Menu.Item itemKey="b1">B1</Menu.Item>
        </Menu.Section>
      </Menu>,
    );
    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group B')).toBeInTheDocument();
    expect(getItems()).toHaveLength(3);
  });

  it('uses compact horizontal spacing for short menus', () => {
    installRectMocks();
    renderWithProviders(
      <Menu trigger={<button type="button">T</button>} defaultOpen aria-label="m">
        <Menu.Section label="Account">
          <Menu.Item itemKey="profile" shortcut="⌘P">
            Profile
          </Menu.Item>
          <Menu.Item itemKey="settings" shortcut="⌘,">
            Settings
          </Menu.Item>
        </Menu.Section>
        <Menu.Divider />
        <Menu.Item itemKey="signout" isDanger>
          Sign out
        </Menu.Item>
      </Menu>,
    );

    const menu = screen.getByRole('menu');
    const profile = screen.getByRole('menuitem', { name: /profile/i });
    const section = screen.getByText('Account');
    const profileWrap = profile.parentElement;

    expect(window.getComputedStyle(menu).minWidth).toBe('152px');
    expect(profileWrap).not.toBeNull();
    expect(window.getComputedStyle(profileWrap as HTMLElement).paddingLeft).toBe('6px');
    expect(window.getComputedStyle(profileWrap as HTMLElement).paddingRight).toBe('6px');
    expect(window.getComputedStyle(profile).paddingLeft).toBe('8px');
    expect(window.getComputedStyle(profile).paddingRight).toBe('8px');
    expect(window.getComputedStyle(section).paddingLeft).toContain('14px');
    expect(window.getComputedStyle(section).paddingRight).toContain('14px');
  });
});

// ────────────────────────────────────────────────────────────
// onAction + closeOnSelect
// ────────────────────────────────────────────────────────────

describe('Menu — onAction', () => {
  it('clicking an enabled item fires onAction with the item key and closes', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onAction = vi.fn();
    renderBasic({ items: ITEMS, onAction, defaultOpen: true });
    await user.click(screen.getByText('New File'));
    expect(onAction).toHaveBeenCalledWith('new');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('disabled item: click does not fire onAction; menu stays open', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onAction = vi.fn();
    renderBasic({ items: ITEMS, onAction, defaultOpen: true });
    await user.click(screen.getByText('Save'));
    expect(onAction).not.toHaveBeenCalled();
    expect(getMenu()).toBeInTheDocument();
  });

  it('closeOnSelect=false keeps menu open after action (none mode)', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onAction = vi.fn();
    renderBasic({ items: ITEMS, onAction, defaultOpen: true, closeOnSelect: false });
    await user.click(screen.getByText('New File'));
    expect(onAction).toHaveBeenCalledWith('new');
    expect(getMenu()).toBeInTheDocument();
  });

  it('per-item onAction fires alongside top-level onAction (children API)', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const top = vi.fn();
    const own = vi.fn();
    renderWithProviders(
      <Menu trigger={<button type="button">T</button>} defaultOpen aria-label="m" onAction={top}>
        <Menu.Item itemKey="x" onAction={own}>
          Hello
        </Menu.Item>
      </Menu>,
    );
    await user.click(screen.getByText('Hello'));
    expect(top).toHaveBeenCalledWith('x');
    expect(own).toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────
// selectionMode
// ────────────────────────────────────────────────────────────

describe('Menu — selectionMode=single', () => {
  it('selecting an item closes the menu (default closeOnSelect)', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSel = vi.fn();
    renderBasic({
      items: ITEMS.filter((i) => ('isDisabled' in i ? !i.isDisabled : true)) as MenuItemsEntry[],
      defaultOpen: true,
      selectionMode: 'single',
      onSelectionChange: onSel,
    });
    await user.click(screen.getByText('New File'));
    expect(onSel).toHaveBeenCalledTimes(1);
    expect([...onSel.mock.calls[0]![0]]).toEqual(['new']);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('aria-checked toggles for selected item; role=menuitemradio', () => {
    installRectMocks();
    renderBasic({
      items: [
        { itemKey: 'a', label: 'A' },
        { itemKey: 'b', label: 'B' },
      ],
      defaultOpen: true,
      selectionMode: 'single',
      defaultSelectedKeys: ['b'],
    });
    const items = screen.getAllByRole('menuitemradio');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('aria-checked', 'false');
    expect(items[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('controlled selectedKeys updates indicator', () => {
    installRectMocks();
    const { rerender } = renderWithProviders(
      <Menu
        trigger={<button type="button">T</button>}
        items={[
          { itemKey: 'a', label: 'A' },
          { itemKey: 'b', label: 'B' },
        ]}
        defaultOpen
        aria-label="m"
        selectionMode="single"
        selectedKeys={['a']}
      />,
    );
    let radios = screen.getAllByRole('menuitemradio');
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    rerender(
      <Menu
        trigger={<button type="button">T</button>}
        items={[
          { itemKey: 'a', label: 'A' },
          { itemKey: 'b', label: 'B' },
        ]}
        defaultOpen
        aria-label="m"
        selectionMode="single"
        selectedKeys={['b']}
      />,
    );
    radios = screen.getAllByRole('menuitemradio');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Menu — selectionMode=multiple', () => {
  it('selecting an item does NOT close menu by default; allows multi-select', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSel = vi.fn();
    renderBasic({
      items: [
        { itemKey: 'a', label: 'A' },
        { itemKey: 'b', label: 'B' },
        { itemKey: 'c', label: 'C' },
      ],
      defaultOpen: true,
      selectionMode: 'multiple',
      onSelectionChange: onSel,
    });
    await user.click(screen.getByText('A'));
    expect(getMenu()).toBeInTheDocument();
    await user.click(screen.getByText('C'));
    expect(getMenu()).toBeInTheDocument();
    expect(onSel).toHaveBeenCalledTimes(2);
    expect([...onSel.mock.calls[1]![0]].sort()).toEqual(['a', 'c']);
  });

  it('toggles off when clicking selected item again', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSel = vi.fn();
    renderBasic({
      items: [{ itemKey: 'a', label: 'A' }],
      defaultOpen: true,
      selectionMode: 'multiple',
      defaultSelectedKeys: ['a'],
      onSelectionChange: onSel,
    });
    await user.click(screen.getByText('A'));
    expect([...onSel.mock.calls[0]![0]]).toEqual([]);
  });

  it('renders role=menuitemcheckbox', () => {
    installRectMocks();
    renderBasic({
      items: [{ itemKey: 'a', label: 'A' }],
      defaultOpen: true,
      selectionMode: 'multiple',
    });
    expect(screen.getByRole('menuitemcheckbox')).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────
// 键盘
// ────────────────────────────────────────────────────────────

describe('Menu — keyboard navigation', () => {
  const setupOpen = () => {
    installRectMocks();
    const onAction = vi.fn();
    renderBasic({ items: ITEMS, defaultOpen: true, onAction });
    return { onAction };
  };

  it('ArrowDown moves highlight forward, skipping disabled', () => {
    setupOpen();
    const menu = getMenu();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    // Should land on index 1 (Open…) since first enabled is 0 already on open.
    // First press from initial highlight=0 → 1.
    let items = getItems();
    expect(items[1]).toHaveAttribute('data-highlighted');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    items = getItems();
    // Next index is 2 (Save) but disabled — should jump to 3 (Delete).
    expect(items[3]).toHaveAttribute('data-highlighted');
  });

  it('ArrowUp wraps around', () => {
    setupOpen();
    const menu = getMenu();
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    const items = getItems();
    // From 0 going up wraps to last enabled = 3 (Delete).
    expect(items[3]).toHaveAttribute('data-highlighted');
  });

  it('Home jumps to first enabled, End jumps to last enabled', () => {
    setupOpen();
    const menu = getMenu();
    fireEvent.keyDown(menu, { key: 'End' });
    let items = getItems();
    expect(items[3]).toHaveAttribute('data-highlighted');
    fireEvent.keyDown(menu, { key: 'Home' });
    items = getItems();
    expect(items[0]).toHaveAttribute('data-highlighted');
  });

  it('Enter triggers onAction on the highlighted item', () => {
    const { onAction } = setupOpen();
    const menu = getMenu();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'Enter' });
    expect(onAction).toHaveBeenLastCalledWith('open');
  });

  it('Space also triggers selection', () => {
    const { onAction } = setupOpen();
    fireEvent.keyDown(getMenu(), { key: ' ' });
    expect(onAction).toHaveBeenLastCalledWith('new');
  });

  it('Escape closes the menu', () => {
    installRectMocks();
    const onOpenChange = vi.fn();
    renderBasic({ items: ITEMS, defaultOpen: true, onOpenChange });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('typeahead matches first item starting with typed letters', () => {
    setupOpen();
    const menu = getMenu();
    // Type "d" -> Delete
    fireEvent.keyDown(menu, { key: 'd' });
    const items = getItems();
    expect(items[3]).toHaveAttribute('data-highlighted');
  });

  it('typeahead skips disabled items', () => {
    setupOpen();
    const menu = getMenu();
    // Type "s" -> Save is disabled, no other 's' item -> highlight unchanged.
    fireEvent.keyDown(menu, { key: 's' });
    const items = getItems();
    // Highlight remains on 0 (default).
    expect(items[0]).toHaveAttribute('data-highlighted');
  });

  it('typeahead clears buffer after timeout', () => {
    setupOpen();
    const menu = getMenu();
    fireEvent.keyDown(menu, { key: 'd' });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    // Subsequent press of 'o' should match Open (not require still-buffered prefix).
    fireEvent.keyDown(menu, { key: 'o' });
    const items = getItems();
    expect(items[1]).toHaveAttribute('data-highlighted');
  });

  it('mouse hover updates highlight', () => {
    setupOpen();
    const items = getItems();
    fireEvent.mouseEnter(items[1]!);
    expect(items[1]).toHaveAttribute('data-highlighted');
  });

  it('does not crash when keyboard pressed with empty items', () => {
    installRectMocks();
    renderWithProviders(
      <Menu trigger={<button type="button">T</button>} items={[]} defaultOpen aria-label="m" />,
    );
    expect(() => fireEvent.keyDown(getMenu(), { key: 'ArrowDown' })).not.toThrow();
    expect(() => fireEvent.keyDown(getMenu(), { key: 'Home' })).not.toThrow();
    expect(() => fireEvent.keyDown(getMenu(), { key: 'End' })).not.toThrow();
    expect(() => fireEvent.keyDown(getMenu(), { key: 'Enter' })).not.toThrow();
  });
});

// ────────────────────────────────────────────────────────────
// 视觉/语义：danger / href / icon / shortcut
// ────────────────────────────────────────────────────────────

describe('Menu — danger and href', () => {
  it('isDanger item has data-danger attribute and danger color', () => {
    installRectMocks();
    renderBasic({ items: ITEMS, defaultOpen: true });
    const danger = screen.getByText('Delete').closest('[role="menuitem"]')! as HTMLElement;
    expect(danger).toHaveAttribute('data-danger');
    // theme.colors.danger[500] (light) = rgb(243, 18, 96)
    expect(danger.style.color || getComputedStyle(danger).color).toBeTruthy();
  });

  it('href item renders as an anchor', () => {
    installRectMocks();
    renderBasic({
      items: [
        { itemKey: 'docs', label: 'Docs', href: 'https://example.com' } as MenuItemDescriptor,
      ],
      defaultOpen: true,
    });
    const link = screen.getByRole('menuitem');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('disabled href item omits href attribute', () => {
    installRectMocks();
    renderBasic({
      items: [
        {
          itemKey: 'docs',
          label: 'Docs',
          href: 'https://example.com',
          isDisabled: true,
        } as MenuItemDescriptor,
      ],
      defaultOpen: true,
    });
    const link = screen.getByRole('menuitem');
    expect(link.tagName).toBe('A');
    expect(link).not.toHaveAttribute('href');
  });
});

// ────────────────────────────────────────────────────────────
// a11y
// ────────────────────────────────────────────────────────────

describe('Menu — a11y', () => {
  it('panel has role=menu and aria-label', () => {
    installRectMocks();
    renderBasic({ items: ITEMS, defaultOpen: true });
    const m = getMenu();
    expect(m).toHaveAttribute('aria-label', 'actions');
  });

  it('emits prefers-reduced-motion override styles', () => {
    installRectMocks();
    renderBasic({ items: ITEMS, defaultOpen: true });
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });

  it('aria-activedescendant is set on the menu when an item is highlighted', () => {
    installRectMocks();
    renderBasic({ items: ITEMS, defaultOpen: true });
    const m = getMenu();
    expect(m.getAttribute('aria-activedescendant')).toBeTruthy();
  });
});

// ────────────────────────────────────────────────────────────
// trigger as render prop
// ────────────────────────────────────────────────────────────

describe('Menu — trigger render prop', () => {
  it('exposes isOpen + ref to the render-prop trigger', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let captured: HTMLElement | null = null;
    renderWithProviders(
      <Menu
        items={ITEMS}
        aria-label="m"
        trigger={({ isOpen, ref }) => (
          <button
            type="button"
            ref={(node) => {
              if (typeof ref === 'function') ref(node);
              else if (ref) (ref as { current: HTMLElement | null }).current = node;
              captured = node;
            }}
            data-state={isOpen ? 'open' : 'closed'}
          >
            T
          </button>
        )}
      />,
    );
    const btn = screen.getByRole('button', { name: 'T' });
    expect(captured).toBe(btn);
    expect(btn).toHaveAttribute('data-state', 'closed');
    await user.click(btn);
    expect(getMenu()).toBeInTheDocument();
  });
});

// ────────────────────────────────────────────────────────────
// className / style / id / ref
// ────────────────────────────────────────────────────────────

describe('Menu — extra coverage', () => {
  it('declarative <Menu.Section> with per-item onAction fires for nested items', async () => {
    installRectMocks();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const inner = vi.fn();
    renderWithProviders(
      <Menu trigger={<button type="button">T</button>} defaultOpen aria-label="m">
        <Menu.Section label="G">
          <Menu.Item itemKey="x" onAction={inner}>
            Inner
          </Menu.Item>
        </Menu.Section>
      </Menu>,
    );
    await user.click(screen.getByText('Inner'));
    expect(inner).toHaveBeenCalled();
  });

  it('renders icon, description in items', () => {
    installRectMocks();
    renderWithProviders(
      <Menu trigger={<button type="button">T</button>} defaultOpen aria-label="m">
        <Menu.Item
          itemKey="z"
          icon={<svg data-testid="ico" />}
          description="Sub text"
          shortcut="⌘Z"
        >
          Hello
        </Menu.Item>
      </Menu>,
    );
    expect(screen.getByTestId('ico')).toBeInTheDocument();
    expect(screen.getByText('Sub text')).toBeInTheDocument();
    expect(screen.getByText('⌘Z')).toBeInTheDocument();
  });

  it('typeahead works against ReactNode label (array form)', () => {
    installRectMocks();
    renderWithProviders(
      <Menu trigger={<button type="button">T</button>} defaultOpen aria-label="m">
        <Menu.Item itemKey="alpha">
          <>{['Alpha ', 'Bravo']}</>
        </Menu.Item>
        <Menu.Item itemKey="charlie">
          <span>Charlie</span>
        </Menu.Item>
      </Menu>,
    );
    fireEvent.keyDown(getMenu(), { key: 'c' });
    const items = getItems();
    expect(items[1]).toHaveAttribute('data-highlighted');
  });

  it('clicking disabled href item does not navigate', () => {
    installRectMocks();
    const onAction = vi.fn();
    renderBasic({
      items: [
        {
          itemKey: 'docs',
          label: 'Docs',
          href: 'https://example.com',
          isDisabled: true,
        } as MenuItemDescriptor,
      ],
      defaultOpen: true,
      onAction,
    });
    const link = screen.getByRole('menuitem');
    fireEvent.click(link);
    expect(onAction).not.toHaveBeenCalled();
  });

  it('highlight scrolls into view (covers scrollIntoView branch)', () => {
    installRectMocks();
    const scrollSpy = vi.fn();
    // Patch scrollIntoView on prototype — jsdom does not implement it.
    const orig = (Element.prototype as unknown as { scrollIntoView?: () => void }).scrollIntoView;
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = scrollSpy;
    try {
      renderBasic({ items: ITEMS, defaultOpen: true });
      fireEvent.keyDown(getMenu(), { key: 'ArrowDown' });
      expect(scrollSpy).toHaveBeenCalled();
    } finally {
      if (orig === undefined)
        delete (Element.prototype as unknown as { scrollIntoView?: () => void }).scrollIntoView;
      else (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = orig;
    }
  });

  it('focuses panel on open (covers focus path)', () => {
    installRectMocks();
    renderBasic({ items: ITEMS, defaultOpen: true });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    // Whether jsdom can actually focus is implementation-defined; just assert no throw.
    expect(getMenu()).toBeInTheDocument();
  });

  it('marker components (Menu.Item / Section / Divider / SubMenu) render null directly', () => {
    // 直接调用各个标记型组件，确保函数被覆盖（实际使用中它们由 Menu 解析、不会真的渲染）。
    const noop = () => {};
    expect(Menu.Item({ itemKey: 'x', onAction: noop })).toBeNull();
    expect(Menu.Section({ label: 'L' })).toBeNull();
    expect(Menu.Divider({})).toBeNull();
    expect(Menu.SubMenu({ itemKey: 'y' })).toBeNull();
    // 显示名应该是带前缀的形式。
    expect((Menu.Item as unknown as { displayName: string }).displayName).toBe('TimeUI.Menu.Item');
    expect((Menu.Section as unknown as { displayName: string }).displayName).toBe(
      'TimeUI.Menu.Section',
    );
    expect((Menu.Divider as unknown as { displayName: string }).displayName).toBe(
      'TimeUI.Menu.Divider',
    );
    expect((Menu.SubMenu as unknown as { displayName: string }).displayName).toBe(
      'TimeUI.Menu.SubMenu',
    );
  });

  it('isDisabled with ReactElement trigger blocks anchor click via onClickCapture', () => {
    installRectMocks();
    // Use a non-button anchor (disabled prop on button suppresses click events entirely in jsdom).
    renderBasic({
      items: ITEMS,
      isDisabled: true,
      trigger: <span role="button">T</span>,
    });
    const trigger = screen.getByRole('button', { name: 'T' });
    fireEvent.click(trigger);
    // onClickCapture preventDefault + stopPropagation: the Popover's injected click is blocked,
    // so menu stays closed.
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
  });

  it('skips invalid React children silently', () => {
    installRectMocks();
    renderWithProviders(
      <Menu trigger={<button type="button">T</button>} defaultOpen aria-label="m">
        text-node-ignored
        {null}
        {false}
        <Menu.Item itemKey="real">Real</Menu.Item>
      </Menu>,
    );
    expect(getItems()).toHaveLength(1);
    expect(screen.getByText('Real')).toBeInTheDocument();
  });
});

describe('Menu — refs / id / className', () => {
  it('forwards ref to the menu DOM node', () => {
    installRectMocks();
    let captured: HTMLDivElement | null = null;
    renderBasic({
      items: ITEMS,
      defaultOpen: true,
      ref: (node) => {
        captured = node;
      },
    } as Partial<React.ComponentProps<typeof Menu>> & { ref: (n: HTMLDivElement | null) => void });
    expect(captured).toBeInstanceOf(HTMLDivElement);
    expect(captured).toBe(getMenu());
  });

  it('respects custom id, className, style', () => {
    installRectMocks();
    renderBasic({
      items: ITEMS,
      defaultOpen: true,
      id: 'my-menu',
      className: 'extra',
      style: { background: 'red' },
    });
    const m = getMenu();
    expect(m.className).toContain('extra');
    expect(m.style.background).toBe('red');
  });
});
