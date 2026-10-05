/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 验证 Tabs 模块的行为与回归。
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { Tabs, Tab, TabPanel } from '../';
import type { TabItem, TabsSize, TabsVariant } from '../Tabs.types';

const ITEMS: ReadonlyArray<TabItem> = [
  { itemKey: 'profile', label: 'Profile', content: <p>Profile panel</p> },
  { itemKey: 'settings', label: 'Settings', content: <p>Settings panel</p> },
  { itemKey: 'billing', label: 'Billing', content: <p>Billing panel</p> },
];

const ITEMS_WITH_DISABLED: ReadonlyArray<TabItem> = [
  { itemKey: 'a', label: 'A', content: <p>A panel</p> },
  { itemKey: 'b', label: 'B', content: <p>B panel</p>, isDisabled: true },
  { itemKey: 'c', label: 'C', content: <p>C panel</p> },
];

const getTabs = (): HTMLButtonElement[] => screen.getAllByRole('tab') as HTMLButtonElement[];

describe('Tabs — basic rendering', () => {
  it('renders one role=tab per item and a tablist', () => {
    renderWithProviders(<Tabs aria-label="Account" items={ITEMS} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(getTabs()).toHaveLength(ITEMS.length);
  });

  it('selects first non-disabled tab by default', () => {
    renderWithProviders(<Tabs aria-label="A" items={ITEMS_WITH_DISABLED} />);
    const tabs = getTabs();
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('respects defaultSelectedKey', () => {
    renderWithProviders(<Tabs aria-label="A" items={ITEMS} defaultSelectedKey="settings" />);
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows the panel of the selected tab; hides others (non-lazy)', () => {
    renderWithProviders(<Tabs aria-label="A" items={ITEMS} defaultSelectedKey="profile" />);
    // All panels mount; non-selected ones should be hidden.
    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(panels).toHaveLength(ITEMS.length);
    const profilePanel = panels.find((p) => p.textContent === 'Profile panel');
    const settingsPanel = panels.find((p) => p.textContent === 'Settings panel');
    expect(profilePanel?.hasAttribute('hidden')).toBe(false);
    expect(settingsPanel?.hasAttribute('hidden')).toBe(true);
  });
});

describe('Tabs — children (declarative) API', () => {
  it('parses <Tab>/<TabPanel> children and renders correctly', () => {
    renderWithProviders(
      <Tabs aria-label="A" defaultSelectedKey="two">
        <Tab itemKey="one" label="One">
          <TabPanel itemKey="one">
            <p>Panel one</p>
          </TabPanel>
        </Tab>
        <Tab itemKey="two" label="Two">
          <TabPanel itemKey="two">
            <p>Panel two</p>
          </TabPanel>
        </Tab>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'One' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Two' })).toBeInTheDocument();
    expect(screen.getByText('Panel two')).toBeVisible();
  });

  it('treats Tab children as panel content when no <TabPanel> wrapper is used', () => {
    renderWithProviders(
      <Tabs aria-label="A" defaultSelectedKey="x">
        <Tab itemKey="x" label="X">
          <p>Direct panel content</p>
        </Tab>
      </Tabs>,
    );
    expect(screen.getByText('Direct panel content')).toBeInTheDocument();
  });

  it('items prop overrides children when both provided', () => {
    renderWithProviders(
      <Tabs aria-label="A" items={ITEMS}>
        <Tab itemKey="x" label="X">
          <p>Should not appear</p>
        </Tab>
      </Tabs>,
    );
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
    expect(screen.getByText('Profile panel')).toBeInTheDocument();
  });

  it('skips non-Tab children (and non-element nodes) silently', () => {
    renderWithProviders(
      <Tabs aria-label="A" defaultSelectedKey="ok">
        {'just text'}
        {null}
        <span>not a tab</span>
        <Tab itemKey="ok" label="OK">
          <p>OK panel</p>
        </Tab>
      </Tabs>,
    );
    expect(getTabs()).toHaveLength(1);
    expect(screen.getByText('OK panel')).toBeInTheDocument();
  });
});

describe('Tabs — controlled / uncontrolled', () => {
  it('selects an available panel when an uncontrolled selected item is removed', () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <Tabs items={ITEMS} defaultSelectedKey="settings" onSelectionChange={onChange} />,
    );
    rerender(
      <Tabs
        items={ITEMS.filter((item) => item.itemKey !== 'settings')}
        onSelectionChange={onChange}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Profile panel');
    expect(onChange).toHaveBeenLastCalledWith('profile');
  });

  it('recovers after asynchronous items arrive or the current tab is disabled', () => {
    const { rerender } = renderWithProviders(<Tabs items={[]} />);
    rerender(<Tabs items={ITEMS} />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Profile panel');
    rerender(<Tabs items={ITEMS} disabledKeys={['profile']} />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Settings panel');
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('tabindex', '0');
  });

  it('only reports string selections when all remaining tabs are disabled', () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(<Tabs items={ITEMS} onSelectionChange={onChange} />);
    const remaining = ITEMS.filter((item) => item.itemKey === 'settings');
    rerender(<Tabs items={remaining} disabledKeys={['settings']} onSelectionChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('tabpanel')).toBeNull();
    rerender(<Tabs items={remaining} onSelectionChange={onChange} />);
    expect(onChange).toHaveBeenCalledWith('settings');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Settings panel');
  });

  it('leaves selection driven by props when a controlled item becomes unavailable', () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <Tabs items={ITEMS} selectedKey="settings" onSelectionChange={onChange} />,
    );
    rerender(
      <Tabs
        items={ITEMS.filter((item) => item.itemKey !== 'settings')}
        selectedKey="settings"
        onSelectionChange={onChange}
      />,
    );
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
  it('uncontrolled: clicking a tab updates selection and fires onSelectionChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS}
        defaultSelectedKey="profile"
        onSelectionChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(onChange).toHaveBeenCalledWith('settings');
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
  });

  it('controlled: aria-selected stays driven by props after click', async () => {
    const onChange = vi.fn();
    const { rerender } = renderWithProviders(
      <Tabs aria-label="A" items={ITEMS} selectedKey="profile" onSelectionChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(onChange).toHaveBeenCalledWith('settings');
    // Without parent re-render, profile stays selected (controlled).
    expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute('aria-selected', 'true');
    rerender(
      <Tabs aria-label="A" items={ITEMS} selectedKey="settings" onSelectionChange={onChange} />,
    );
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
  });

  it('clicking the already-selected tab does not refire onSelectionChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS}
        defaultSelectedKey="profile"
        onSelectionChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Profile' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Tabs — disabled', () => {
  it('per-item isDisabled: clicks do not change selection', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS_WITH_DISABLED}
        defaultSelectedKey="a"
        onSelectionChange={onChange}
      />,
    );
    const disabled = screen.getByRole('tab', { name: 'B' });
    expect(disabled).toBeDisabled();
    // userEvent skips disabled buttons (and would error). Use fireEvent to assert no-op.
    fireEvent.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('disabledKeys prop: applies disabled to listed keys', () => {
    renderWithProviders(<Tabs aria-label="A" items={ITEMS} disabledKeys={['settings']} />);
    expect(screen.getByRole('tab', { name: 'Settings' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Profile' })).not.toBeDisabled();
  });

  it('global isDisabled: every tab disabled and clicks no-op', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs aria-label="A" items={ITEMS} isDisabled onSelectionChange={onChange} />,
    );
    getTabs().forEach((t) => expect(t).toBeDisabled());
    fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Tabs — keyboard interaction (horizontal)', () => {
  it('ArrowRight moves to next tab and updates selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS}
        defaultSelectedKey="profile"
        onSelectionChange={onChange}
      />,
    );
    const first = screen.getByRole('tab', { name: 'Profile' });
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('settings');
  });

  it('ArrowLeft wraps from first to last', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS}
        defaultSelectedKey="profile"
        onSelectionChange={onChange}
      />,
    );
    const first = screen.getByRole('tab', { name: 'Profile' });
    first.focus();
    await user.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith('billing');
  });

  it('ArrowRight skips disabled tabs', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS_WITH_DISABLED}
        defaultSelectedKey="a"
        onSelectionChange={onChange}
      />,
    );
    const first = screen.getByRole('tab', { name: 'A' });
    first.focus();
    await user.keyboard('{ArrowRight}');
    // skips B, lands on C
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('Home jumps to first enabled, End jumps to last enabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS}
        defaultSelectedKey="settings"
        onSelectionChange={onChange}
      />,
    );
    screen.getByRole('tab', { name: 'Settings' }).focus();
    await user.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith('billing');
    await user.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith('profile');
  });

  it('ArrowUp/Down do nothing in horizontal orientation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS}
        defaultSelectedKey="profile"
        onSelectionChange={onChange}
      />,
    );
    screen.getByRole('tab', { name: 'Profile' }).focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Enter / Space activate the focused tab (default button click)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS}
        defaultSelectedKey="profile"
        onSelectionChange={onChange}
      />,
    );
    const settings = screen.getByRole('tab', { name: 'Settings' });
    settings.focus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('settings');
  });
});

describe('Tabs — keyboard interaction (vertical)', () => {
  it('ArrowDown moves to next tab in vertical orientation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS}
        orientation="vertical"
        defaultSelectedKey="profile"
        onSelectionChange={onChange}
      />,
    );
    screen.getByRole('tab', { name: 'Profile' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith('settings');
  });

  it('ArrowUp wraps to last in vertical orientation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS}
        orientation="vertical"
        defaultSelectedKey="profile"
        onSelectionChange={onChange}
      />,
    );
    screen.getByRole('tab', { name: 'Profile' }).focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('billing');
  });

  it('ArrowLeft/Right do nothing in vertical orientation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS}
        orientation="vertical"
        defaultSelectedKey="profile"
        onSelectionChange={onChange}
      />,
    );
    screen.getByRole('tab', { name: 'Profile' }).focus();
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowLeft}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('aria-orientation="vertical" set on tablist', () => {
    renderWithProviders(<Tabs aria-label="A" items={ITEMS} orientation="vertical" />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
  });
});

describe('Tabs — isLazy', () => {
  it('isLazy=true mounts only the active panel', () => {
    renderWithProviders(<Tabs aria-label="A" items={ITEMS} defaultSelectedKey="profile" isLazy />);
    expect(screen.getByText('Profile panel')).toBeInTheDocument();
    expect(screen.queryByText('Settings panel')).not.toBeInTheDocument();
    expect(screen.queryByText('Billing panel')).not.toBeInTheDocument();
  });

  it('isLazy=false (default) mounts all panels but hides inactive ones', () => {
    renderWithProviders(<Tabs aria-label="A" items={ITEMS} defaultSelectedKey="profile" />);
    const allPanels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(allPanels).toHaveLength(ITEMS.length);
    const settingsPanel = allPanels.find((p) => p.textContent === 'Settings panel');
    expect(settingsPanel).toBeDefined();
    expect(settingsPanel!.hasAttribute('hidden')).toBe(true);
    expect(settingsPanel!.style.display).toBe('none');
  });

  it('switching tabs while lazy mounts the new active panel and unmounts the old', async () => {
    renderWithProviders(<Tabs aria-label="A" items={ITEMS} defaultSelectedKey="profile" isLazy />);
    expect(screen.getByText('Profile panel')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Billing' }));
    expect(screen.queryByText('Profile panel')).not.toBeInTheDocument();
    expect(screen.getByText('Billing panel')).toBeInTheDocument();
  });
});

describe('Tabs — variants', () => {
  it.each(['underline', 'pills', 'bordered'] as const)(
    'renders variant=%s without crashing',
    (variant: TabsVariant) => {
      const { container } = renderWithProviders(
        <Tabs aria-label="A" items={ITEMS} variant={variant} />,
      );
      expect(getTabs()).toHaveLength(ITEMS.length);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.dataset.variant).toBe(variant);
    },
  );

  it('underline variant exposes a data-tabs-indicator="underline" node', () => {
    const { container } = renderWithProviders(
      <Tabs aria-label="A" items={ITEMS} variant="underline" />,
    );
    expect(container.querySelector('[data-tabs-indicator="underline"]')).not.toBeNull();
  });

  it('pills variant exposes a data-tabs-indicator="pills" node', () => {
    const { container } = renderWithProviders(
      <Tabs aria-label="A" items={ITEMS} variant="pills" />,
    );
    expect(container.querySelector('[data-tabs-indicator="pills"]')).not.toBeNull();
  });

  it('bordered variant has no sliding indicator (uses inset box-shadow)', () => {
    const { container } = renderWithProviders(
      <Tabs aria-label="A" items={ITEMS} variant="bordered" />,
    );
    expect(container.querySelector('[data-tabs-indicator]')).toBeNull();
  });

  it('bordered + vertical renders without crashing (covers vertical-bordered branch)', () => {
    const { container } = renderWithProviders(
      <Tabs aria-label="A" items={ITEMS} variant="bordered" orientation="vertical" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.dataset.variant).toBe('bordered');
    expect(wrapper.dataset.orientation).toBe('vertical');
  });

  it('underline + vertical renders the indicator on the right edge', () => {
    const { container } = renderWithProviders(
      <Tabs aria-label="A" items={ITEMS} variant="underline" orientation="vertical" />,
    );
    expect(container.querySelector('[data-tabs-indicator="underline"]')).not.toBeNull();
  });

  it('pills + vertical renders the pills indicator', () => {
    const { container } = renderWithProviders(
      <Tabs aria-label="A" items={ITEMS} variant="pills" orientation="vertical" />,
    );
    expect(container.querySelector('[data-tabs-indicator="pills"]')).not.toBeNull();
  });
});

describe('Tabs — sizes', () => {
  it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
    'renders size=%s without crashing',
    (size: TabsSize) => {
      const { container } = renderWithProviders(<Tabs aria-label="A" items={ITEMS} size={size} />);
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper.dataset.size).toBe(size);
    },
  );
});

describe('Tabs — aria & ids', () => {
  it('each tab has aria-controls referencing its panel id (and vice versa)', () => {
    renderWithProviders(<Tabs aria-label="A" items={ITEMS} />);
    const tabs = getTabs();
    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    tabs.forEach((tab) => {
      const controls = tab.getAttribute('aria-controls');
      expect(controls).toBeTruthy();
      const panel = panels.find((p) => p.id === controls);
      expect(panel).toBeDefined();
      expect(panel!.getAttribute('aria-labelledby')).toBe(tab.id);
    });
  });

  it('selected tab has tabIndex=0; others tabIndex=-1 (roving tabindex)', () => {
    renderWithProviders(<Tabs aria-label="A" items={ITEMS} defaultSelectedKey="settings" />);
    const tabs = getTabs();
    expect(tabs[0]!.getAttribute('tabindex')).toBe('-1');
    expect(tabs[1]!.getAttribute('tabindex')).toBe('0');
    expect(tabs[2]!.getAttribute('tabindex')).toBe('-1');
  });

  it('aria-label vs aria-labelledby precedence on tablist', () => {
    renderWithProviders(
      <>
        <span id="ext-label">External</span>
        <Tabs items={ITEMS} aria-labelledby="ext-label" />
      </>,
    );
    const list = screen.getByRole('tablist');
    expect(list).toHaveAttribute('aria-labelledby', 'ext-label');
    expect(list).not.toHaveAttribute('aria-label');
  });

  it('respects custom id on the wrapper', () => {
    const { container } = renderWithProviders(<Tabs id="my-tabs" aria-label="A" items={ITEMS} />);
    expect(container.querySelector('#my-tabs')).not.toBeNull();
  });
});

describe('Tabs — refs and a11y', () => {
  it('forwards ref to the wrapper div', () => {
    let captured: HTMLDivElement | null = null;
    renderWithProviders(
      <Tabs
        aria-label="A"
        items={ITEMS}
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });

  it('emits a prefers-reduced-motion override rule', () => {
    renderWithProviders(<Tabs aria-label="A" items={ITEMS} />);
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('\n');
    expect(styles).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});

describe('Tabs — marker components', () => {
  it('Tab and TabPanel render to null when used outside of <Tabs>', () => {
    // Marker components are parsed by Tabs and never rendered themselves.
    // Calling them directly must not throw and must yield no DOM.
    const { container } = renderWithProviders(
      <div data-testid="root">
        <Tab itemKey="x" label="X" />
        <TabPanel itemKey="x">hidden body</TabPanel>
      </div>,
    );
    expect(container.querySelector('[data-testid="root"]')!.children).toHaveLength(0);
    expect(screen.queryByText('hidden body')).not.toBeInTheDocument();
  });

  it('Tab and TabPanel expose stable displayNames', () => {
    expect((Tab as unknown as { displayName: string }).displayName).toBe('TimeUI.Tab');
    expect((TabPanel as unknown as { displayName: string }).displayName).toBe('TimeUI.TabPanel');
    expect((Tabs as unknown as { displayName: string }).displayName).toBe('TimeUI.Tabs');
  });
});

describe('Tabs — edge cases', () => {
  it('renders without crashing when items is empty', () => {
    const { container } = renderWithProviders(<Tabs aria-label="A" items={[]} />);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(container.querySelector('[role="tablist"]')).not.toBeNull();
  });

  it('renders an icon next to label when provided', () => {
    const items: TabItem[] = [
      {
        itemKey: 'home',
        label: 'Home',
        icon: <span data-testid="home-icon">🏠</span>,
        content: <p>Home</p>,
      },
    ];
    renderWithProviders(<Tabs aria-label="A" items={items} />);
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
  });

  it('keyboard navigation is a no-op when all tabs are disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const allDisabled: TabItem[] = ITEMS.map((it) => ({
      ...it,
      isDisabled: true,
    }));
    renderWithProviders(<Tabs aria-label="A" items={allDisabled} onSelectionChange={onChange} />);
    // No selection should be possible; focus the list and try.
    screen.getByRole('tablist').focus();
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{Home}');
    await user.keyboard('{End}');
    expect(onChange).not.toHaveBeenCalled();
  });
});
