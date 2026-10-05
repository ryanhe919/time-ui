'use client';

/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Menu / Dropdown 组件：基于 <Popover> 的浮层菜单，支持声明式 + 数据驱动双 API、
 *              none/single/multiple 三种选择模式、键盘导航（↑↓/Home/End/Enter/Esc/typeahead）、
 *              danger 项、href 项与 Section/Divider 分组。
 *
 *              架构选择：直接复用 <Popover trigger="click" anchor={trigger}> ——
 *              定位 / portal / ESC / click outside / 入场动画都由 Popover 处理；
 *              Menu 本体只关心 list 渲染 + 键盘 + selection。Popover 内置 padding 不适用菜单，
 *              故 list 容器自带 paddingY（来自 menu token），覆盖 Popover bodyCss 的 padding。
 *
 *              ⚠️ 行渲染（MenuRow）作为模块导出，DatePicker presets 浮层可直接复用。
 */

import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { mergeRefs, useControllableState } from '../utils';
import { Popover } from '../Popover';
import { Checkbox } from '../Checkbox';
import type {
  MenuDividerProps,
  MenuItemDescriptor,
  MenuItemProps,
  MenuItemsEntry,
  MenuProps,
  MenuSectionDescriptor,
  MenuSectionProps,
  MenuSelectionMode,
} from './Menu.types';

// ────────────────────────────────────────────────────────────
// 内部归一化结构
// ────────────────────────────────────────────────────────────

/** 解析后用于内部渲染的扁平节点：item / section-header / divider 三种。 */
type ResolvedNode =
  | { type: 'item'; item: MenuItemDescriptor; sectionKey?: string }
  | { type: 'section-header'; key: string; label?: ReactNode }
  | { type: 'divider'; key: string };

const isSection = (entry: MenuItemsEntry): entry is MenuSectionDescriptor =>
  (entry as MenuSectionDescriptor).type === 'section';

/**
 * 把 items 数组归一化为 ResolvedNode 列表（含 section-header 占位）。
 */
function itemsToResolved(items: ReadonlyArray<MenuItemsEntry>): ResolvedNode[] {
  const out: ResolvedNode[] = [];
  for (const entry of items) {
    if (isSection(entry)) {
      out.push({ type: 'section-header', key: `section-${entry.sectionKey}`, label: entry.label });
      for (const it of entry.items) {
        out.push({ type: 'item', item: it, sectionKey: entry.sectionKey });
      }
    } else {
      out.push({ type: 'item', item: entry });
    }
  }
  return out;
}

/**
 * 解析声明式 children：把 `<Menu.Item>` / `<Menu.Section>` / `<Menu.Divider>` 转成 ResolvedNode。
 *
 * 注意：children 永远不真的渲染（标记型组件返回 null），所有渲染由 Menu 本体完成。
 */
function parseChildren(children: ReactNode): ResolvedNode[] {
  const out: ResolvedNode[] = [];
  let autoSectionIdx = 0;
  let autoDividerIdx = 0;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const ctor = child.type as unknown as { __timeuiMenuKind?: string };
    const kind = ctor?.__timeuiMenuKind;

    if (kind === 'item') {
      const props = child.props as MenuItemProps;
      const item: MenuItemDescriptor = {
        itemKey: props.itemKey,
        label: props.children,
        ...(props.icon !== undefined ? { icon: props.icon } : {}),
        ...(props.shortcut !== undefined ? { shortcut: props.shortcut } : {}),
        ...(props.description !== undefined ? { description: props.description } : {}),
        ...(props.isDisabled !== undefined ? { isDisabled: props.isDisabled } : {}),
        ...(props.isDanger !== undefined ? { isDanger: props.isDanger } : {}),
        ...(props.href !== undefined ? { href: props.href } : {}),
      };
      // 复用 onAction：通过 WeakMap 存储太重，直接挂在 item 上的私有字段。
      if (props.onAction) {
        (item as MenuItemDescriptor & { __ownOnAction?: () => void }).__ownOnAction =
          props.onAction;
      }
      out.push({ type: 'item', item });
      return;
    }

    if (kind === 'section') {
      const props = child.props as MenuSectionProps;
      const sectionKey = props.sectionKey ?? `auto-${autoSectionIdx++}`;
      out.push({
        type: 'section-header',
        key: `section-${sectionKey}`,
        label: props.label,
      });
      Children.forEach(props.children, (inner) => {
        if (!isValidElement(inner)) return;
        const innerCtor = inner.type as unknown as { __timeuiMenuKind?: string };
        if (innerCtor?.__timeuiMenuKind !== 'item') return;
        const ip = inner.props as MenuItemProps;
        const item: MenuItemDescriptor = {
          itemKey: ip.itemKey,
          label: ip.children,
          ...(ip.icon !== undefined ? { icon: ip.icon } : {}),
          ...(ip.shortcut !== undefined ? { shortcut: ip.shortcut } : {}),
          ...(ip.description !== undefined ? { description: ip.description } : {}),
          ...(ip.isDisabled !== undefined ? { isDisabled: ip.isDisabled } : {}),
          ...(ip.isDanger !== undefined ? { isDanger: ip.isDanger } : {}),
          ...(ip.href !== undefined ? { href: ip.href } : {}),
        };
        if (ip.onAction) {
          (item as MenuItemDescriptor & { __ownOnAction?: () => void }).__ownOnAction = ip.onAction;
        }
        out.push({ type: 'item', item, sectionKey });
      });
      return;
    }

    if (kind === 'divider') {
      out.push({ type: 'divider', key: `divider-${autoDividerIdx++}` });
      return;
    }
  });

  return out;
}

/** ResolvedNode 中提取扁平的 item 列表（用于键盘高亮 / selection 索引）。 */
function flattenItems(nodes: ResolvedNode[]): MenuItemDescriptor[] {
  return nodes
    .filter((n): n is Extract<ResolvedNode, { type: 'item' }> => n.type === 'item')
    .map((n) => n.item);
}

function toSet(iter: Iterable<string> | undefined): Set<string> {
  return new Set(iter ?? []);
}

function nodeToString(node: ReactNode): string {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToString).join(' ');
  if (typeof node === 'object' && 'props' in (node as object)) {
    const p = (node as { props?: { children?: ReactNode } }).props;
    return p ? nodeToString(p.children) : '';
  }
  return '';
}

function findFirstEnabled(items: MenuItemDescriptor[]): number {
  for (let i = 0; i < items.length; i += 1) {
    if (!items[i]!.isDisabled) return i;
  }
  return -1;
}

function findLastEnabled(items: MenuItemDescriptor[]): number {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (!items[i]!.isDisabled) return i;
  }
  return -1;
}

// ────────────────────────────────────────────────────────────
// MenuRow：单行渲染（对外可复用，DatePicker presets 直接用）
// ────────────────────────────────────────────────────────────

export interface MenuRowProps {
  item: MenuItemDescriptor;
  /** 当前是否被键盘高亮。 */
  isHighlighted: boolean;
  /** selection 状态（none → undefined；single/multiple → boolean）。 */
  isSelected?: boolean;
  /** 选择模式（影响右侧 indicator 与 aria role）。 */
  selectionMode: MenuSelectionMode;
  /** 行 click 处理。 */
  onSelect: () => void;
  /** 鼠标进入时同步键盘高亮。 */
  onHighlight?: () => void;
  /** 该 item 在扁平列表中的索引（用于 data-index / aria-activedescendant）。 */
  index: number;
  /** id 前缀（生成稳定 option id）。 */
  baseId: string;
}

/**
 * 单行菜单项的渲染。提取为独立组件以便：
 *   1. Menu 自身复用（items / children 两条解析路径都走同一份渲染）；
 *   2. DatePicker presets 浮层复用（共享高亮 / disabled / danger / href 视觉规则）。
 */
export const MenuRow = ({
  item,
  isHighlighted,
  isSelected,
  selectionMode,
  onSelect,
  onHighlight,
  index,
  baseId,
}: MenuRowProps): ReactElement => {
  const theme = useTheme();
  const tokens = theme.components.menu;

  const isDisabled = !!item.isDisabled;
  const isDanger = !!item.isDanger;
  const isLink = typeof item.href === 'string' && item.href.length > 0;

  const textPrimary = theme.colors.text.primary;
  const textMuted = theme.colors.text.muted;
  const dangerText = theme.colors.danger[500];
  const dangerHoverBg = theme.colors.danger[100];
  const hoverBg = theme.colors.action.secondary.hover;
  const focusColor = theme.colors.border.focus ?? theme.colors.focus;

  const baseColor = isDisabled ? theme.colors.text.disabled : isDanger ? dangerText : textPrimary;
  const highlightedBg = isDanger ? dangerHoverBg : hoverBg;

  const rowCss = css`
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: ${tokens.itemGap};
    width: 100%;
    min-height: ${tokens.itemHeight};
    padding: ${tokens.itemPaddingY} ${tokens.itemPaddingX};
    border: 0;
    border-radius: ${tokens.itemRadius};
    background: ${isHighlighted && !isDisabled ? highlightedBg : 'transparent'};
    color: ${baseColor};
    font: inherit;
    font-size: ${tokens.itemFontSize};
    text-align: left;
    text-decoration: none;
    cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
    opacity: ${isDisabled ? 0.55 : 1};
    transition: background-color 120ms ease;
    user-select: none;
    &:focus-visible {
      outline: 2px solid ${focusColor};
      outline-offset: -2px;
    }
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;

  const iconCss = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${tokens.itemIconSize};
    height: ${tokens.itemIconSize};
    color: ${isDanger ? dangerText : textMuted};
    flex: none;
  `;

  const labelWrapCss = css`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  `;

  const labelCss = css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;

  const descCss = css`
    color: ${textMuted};
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;

  const shortcutCss = css`
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: ${tokens.shortcutFontSize};
    letter-spacing: ${tokens.shortcutLetterSpacing};
    color: ${textMuted};
    flex: none;
  `;

  const indicatorCss = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: ${tokens.itemIconSize};
    height: ${tokens.itemIconSize};
    color: ${theme.colors.action.primary.default};
  `;

  const role =
    selectionMode === 'multiple'
      ? 'menuitemcheckbox'
      : selectionMode === 'single'
        ? 'menuitemradio'
        : 'menuitem';

  const ariaChecked = selectionMode === 'none' ? undefined : isSelected ? true : false;

  const optionId = `${baseId}-opt-${index}`;

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    onSelect();
  };

  const handleMouseEnter = () => {
    if (isDisabled) return;
    onHighlight?.();
  };

  const commonProps = {
    id: optionId,
    role,
    tabIndex: -1,
    'aria-disabled': isDisabled || undefined,
    'aria-checked': ariaChecked,
    'data-index': index,
    'data-key': item.itemKey,
    'data-highlighted': isHighlighted || undefined,
    'data-disabled': isDisabled || undefined,
    'data-danger': isDanger || undefined,
    'data-selected': isSelected || undefined,
    onMouseEnter: handleMouseEnter,
    onClick: handleClick,
    css: rowCss,
  } as const;

  const inner = (
    <>
      {item.icon ? (
        <span aria-hidden css={iconCss}>
          {item.icon}
        </span>
      ) : null}
      <span css={labelWrapCss}>
        <span css={labelCss}>{item.label}</span>
        {item.description ? <span css={descCss}>{item.description}</span> : null}
      </span>
      {item.shortcut ? <span css={shortcutCss}>{item.shortcut}</span> : null}
      {selectionMode === 'single' && isSelected ? (
        <span aria-hidden css={indicatorCss}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8.5L6.5 12L13 5"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ) : null}
      {selectionMode === 'multiple' ? (
        <span
          aria-hidden
          css={css`
            flex: none;
          `}
        >
          <Checkbox
            isSelected={!!isSelected}
            isDisabled={isDisabled}
            size="sm"
            tabIndex={-1}
            // 行点击会触发 select；checkbox 自身不再独立处理 click。
            aria-hidden
          />
        </span>
      ) : null}
    </>
  );

  if (isLink) {
    return (
      <a {...commonProps} href={isDisabled ? undefined : item.href}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" {...commonProps} disabled={isDisabled}>
      {inner}
    </button>
  );
};

(MenuRow as unknown as { displayName: string }).displayName = 'TimeUI.Menu.Row';

// ────────────────────────────────────────────────────────────
// 复合子组件（标记型）
// ────────────────────────────────────────────────────────────

const MenuItem = (_props: MenuItemProps): null => null;
(
  MenuItem as unknown as {
    displayName: string;
    __timeuiMenuKind: 'item';
  }
).displayName = 'TimeUI.Menu.Item';
(MenuItem as unknown as { __timeuiMenuKind: 'item' }).__timeuiMenuKind = 'item';

const MenuSection = (_props: MenuSectionProps): null => null;
(
  MenuSection as unknown as {
    displayName: string;
    __timeuiMenuKind: 'section';
  }
).displayName = 'TimeUI.Menu.Section';
(MenuSection as unknown as { __timeuiMenuKind: 'section' }).__timeuiMenuKind = 'section';

const MenuDivider = (_props: MenuDividerProps): null => null;
(
  MenuDivider as unknown as {
    displayName: string;
    __timeuiMenuKind: 'divider';
  }
).displayName = 'TimeUI.Menu.Divider';
(MenuDivider as unknown as { __timeuiMenuKind: 'divider' }).__timeuiMenuKind = 'divider';

// 占位的 SubMenu —— 本轮仅暴露类型 / 显示名，方便消费者预先布局。
const MenuSubMenu = (_props: MenuItemProps): null => null;
(
  MenuSubMenu as unknown as {
    displayName: string;
    __timeuiMenuKind: 'item';
  }
).displayName = 'TimeUI.Menu.SubMenu';
(MenuSubMenu as unknown as { __timeuiMenuKind: 'item' }).__timeuiMenuKind = 'item';

// ────────────────────────────────────────────────────────────
// MenuPanel：实际渲染浮层内的 list（Popover 内部 children）
// ────────────────────────────────────────────────────────────

interface MenuPanelProps {
  nodes: ResolvedNode[];
  flatItems: MenuItemDescriptor[];
  selectionMode: MenuSelectionMode;
  selectedKeys: Set<string>;
  highlight: number;
  setHighlight: (i: number) => void;
  onSelect: (item: MenuItemDescriptor) => void;
  baseId: string;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  panelRef: Ref<HTMLDivElement>;
  onKeyDown: (e: ReactKeyboardEvent<HTMLDivElement>) => void;
}

const MenuPanel = forwardRef<HTMLDivElement, MenuPanelProps>(function MenuPanel(props, _ref) {
  const {
    nodes,
    flatItems,
    selectionMode,
    selectedKeys,
    highlight,
    setHighlight,
    onSelect,
    baseId,
    ariaLabel,
    className,
    style,
    panelRef,
    onKeyDown,
  } = props;

  const theme = useTheme();
  const tokens = theme.components.menu;
  const internalRef = useRef<HTMLDivElement | null>(null);

  // 高亮项滚入视图。
  useEffect(() => {
    const list = internalRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-index="${highlight}"]`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlight]);

  // 给 panel 聚焦：键盘事件需要 onKeyDown 捕获。
  useEffect(() => {
    const list = internalRef.current;
    if (!list) return;
    // 推迟一帧再聚焦：避免与 Popover 的入场动画冲突。
    const t = setTimeout(() => {
      try {
        list.focus({ preventScroll: true });
      } catch {
        list.focus();
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const listCss = css`
    list-style: none;
    margin: 0;
    padding: ${tokens.paddingY} 0;
    /* Popover bodyCss 自带 padding，这里通过 negative margin 抵消，使 list 占满 panel。 */
    margin: calc(-1 * ${theme.components.popover.paddingY})
      calc(-1 * ${theme.components.popover.paddingX});
    min-width: ${tokens.minWidth};
    max-width: ${tokens.maxWidth};
    max-height: ${tokens.maxHeight};
    overflow-y: auto;
    overscroll-behavior: contain;
    outline: none;

    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    &:hover,
    &:focus-within {
      scrollbar-color: rgba(120, 120, 128, 0.45) transparent;
    }
    &::-webkit-scrollbar {
      width: 8px;
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: transparent;
      border-radius: 9999px;
      transition: background-color 200ms ease;
    }
    &:hover::-webkit-scrollbar-thumb,
    &:focus-within::-webkit-scrollbar-thumb {
      background-color: rgba(120, 120, 128, 0.45);
    }
  `;

  const sectionCss = css`
    display: flex;
    align-items: center;
    height: ${tokens.sectionLabelHeight};
    padding: 0 calc(${tokens.panelPaddingX} + ${tokens.sectionLabelPaddingX});
    font-size: ${tokens.sectionLabelFontSize};
    font-weight: ${tokens.sectionLabelFontWeight};
    letter-spacing: ${tokens.sectionLabelLetterSpacing};
    color: ${theme.colors.text.muted};
    text-transform: uppercase;
  `;

  const dividerCss = css`
    height: ${tokens.dividerHeight};
    margin: ${tokens.dividerMarginY} ${tokens.panelPaddingX};
    background: ${theme.colors.border.subtle};
  `;

  const itemRowWrapCss = css`
    padding: 0 ${tokens.panelPaddingX};
  `;

  // 计算每个 item 的 flat index（与 flatItems 一一对应）。
  let runningIdx = -1;

  const activeDescId =
    flatItems.length > 0 && highlight >= 0 && highlight < flatItems.length
      ? `${baseId}-opt-${highlight}`
      : undefined;

  return (
    <div
      ref={mergeRefs(internalRef, panelRef)}
      role="menu"
      aria-label={ariaLabel}
      aria-activedescendant={activeDescId}
      tabIndex={-1}
      className={className}
      style={style}
      css={listCss}
      onKeyDown={onKeyDown}
      data-timeui-menu=""
    >
      {nodes.map((node) => {
        if (node.type === 'section-header') {
          return node.label ? (
            <div key={node.key} role="presentation" css={sectionCss}>
              {node.label}
            </div>
          ) : null;
        }
        if (node.type === 'divider') {
          return <div key={node.key} role="separator" css={dividerCss} />;
        }
        runningIdx += 1;
        const idx = runningIdx;
        const isSelected = selectedKeys.has(node.item.itemKey);
        const isHighlighted = idx === highlight;
        return (
          <div key={node.item.itemKey} role="presentation" css={itemRowWrapCss}>
            <MenuRow
              item={node.item}
              index={idx}
              baseId={baseId}
              isHighlighted={isHighlighted}
              isSelected={isSelected}
              selectionMode={selectionMode}
              onSelect={() => onSelect(node.item)}
              onHighlight={() => setHighlight(idx)}
            />
          </div>
        );
      })}
    </div>
  );
});

(MenuPanel as unknown as { displayName: string }).displayName = 'TimeUI.Menu.Panel';

// ────────────────────────────────────────────────────────────
// Menu 本体
// ────────────────────────────────────────────────────────────

const MenuImpl = forwardRef<HTMLDivElement, MenuProps>(function Menu(props, forwardedRef) {
  const {
    trigger,
    items,
    children,
    isOpen,
    defaultOpen = false,
    onOpenChange,
    placement = 'bottom-start',
    selectionMode = 'none',
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    onAction,
    closeOnSelect,
    isDisabled = false,
    portalContainer,
    className,
    style,
    id,
    'aria-label': ariaLabel,
  } = props;

  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');
  const baseId = id ?? `timeui-menu-${safeAutoId}`;

  // 受控 / 非受控 open
  const [open, setOpen] = useControllableState<boolean>({
    value: isOpen,
    defaultValue: (isOpen !== undefined ? undefined : defaultOpen) as boolean,
    onChange: onOpenChange,
    name: 'Menu',
  });

  // 受控 / 非受控 selectedKeys
  const initialSelected = useMemo(
    () => toSet(defaultSelectedKeys),
    // 仅初始读取一次；后续以 controlled 为准。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const controlledSelected = useMemo(
    () => (selectedKeys === undefined ? undefined : toSet(selectedKeys)),
    [selectedKeys],
  );
  const [internalSelected, setInternalSelected] = useState<Set<string>>(initialSelected);
  const selected = controlledSelected ?? internalSelected;
  const isSelectionControlled = controlledSelected !== undefined;

  const commitSelection = useCallback(
    (next: Set<string>) => {
      if (!isSelectionControlled) setInternalSelected(next);
      onSelectionChange?.(next);
    },
    [isSelectionControlled, onSelectionChange],
  );

  // —— 解析 nodes / flat items（items 优先于 children）——
  const nodes = useMemo<ResolvedNode[]>(
    () => (items && items.length > 0 ? itemsToResolved(items) : parseChildren(children)),
    [items, children],
  );
  const flatItems = useMemo(() => flattenItems(nodes), [nodes]);

  // —— 高亮项 ——
  const [highlight, setHighlight] = useState<number>(-1);

  // 打开时：把高亮重置到首个 enabled item；关闭时清零。
  useEffect(() => {
    if (open) {
      setHighlight(findFirstEnabled(flatItems));
    } else {
      setHighlight(-1);
    }
  }, [open, flatItems]);

  // —— typeahead 缓冲 ——
  const typeaheadRef = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: '',
    timer: null,
  });

  const clearTypeahead = useCallback(() => {
    if (typeaheadRef.current.timer) {
      clearTimeout(typeaheadRef.current.timer);
      typeaheadRef.current.timer = null;
    }
    typeaheadRef.current.buffer = '';
  }, []);

  useEffect(() => () => clearTypeahead(), [clearTypeahead]);

  const moveHighlight = useCallback(
    (dir: 1 | -1) => {
      if (flatItems.length === 0) return;
      const start = highlight < 0 ? (dir === 1 ? -1 : flatItems.length) : highlight;
      let i = start;
      for (let step = 0; step < flatItems.length; step += 1) {
        i = (i + dir + flatItems.length) % flatItems.length;
        if (!flatItems[i]!.isDisabled) {
          setHighlight(i);
          return;
        }
      }
    },
    [flatItems, highlight],
  );

  // —— 选择处理 ——
  const handleSelect = useCallback(
    (item: MenuItemDescriptor) => {
      if (item.isDisabled) return;

      // onAction 总是触发（即便有 selection）。
      onAction?.(item.itemKey);
      const own = (item as MenuItemDescriptor & { __ownOnAction?: () => void }).__ownOnAction;
      own?.();

      let didMutateSelection = false;

      if (selectionMode === 'single') {
        if (!selected.has(item.itemKey) || selected.size !== 1) {
          commitSelection(new Set([item.itemKey]));
          didMutateSelection = true;
        }
      } else if (selectionMode === 'multiple') {
        const next = new Set(selected);
        if (next.has(item.itemKey)) next.delete(item.itemKey);
        else next.add(item.itemKey);
        commitSelection(next);
        didMutateSelection = true;
      }

      // closeOnSelect 默认值：none → true（点击即关）；single → true；multiple → false。
      const defaultClose =
        selectionMode === 'none' ? true : selectionMode === 'single' ? true : false;
      const shouldClose = closeOnSelect ?? defaultClose;
      if (shouldClose) setOpen(false);

      // 防 unused 警告
      void didMutateSelection;
    },
    [closeOnSelect, commitSelection, onAction, selected, selectionMode, setOpen],
  );

  // —— 键盘 ——
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveHighlight(1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveHighlight(-1);
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        const first = findFirstEnabled(flatItems);
        if (first >= 0) setHighlight(first);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        const last = findLastEnabled(flatItems);
        if (last >= 0) setHighlight(last);
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        const target = flatItems[highlight];
        if (!target) return;
        e.preventDefault();
        handleSelect(target);
        return;
      }
      if (e.key === 'Escape') {
        // ESC 由 Popover 处理；这里 stopPropagation 让 Popover window 监听拿到。
        return;
      }
      // typeahead：单字母键（且无修饰键）追加到 buffer，匹配第一个以 buffer 开头的 enabled item。
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const ch = e.key.toLowerCase();
        if (typeaheadRef.current.timer) clearTimeout(typeaheadRef.current.timer);
        typeaheadRef.current.buffer += ch;
        typeaheadRef.current.timer = setTimeout(() => {
          typeaheadRef.current.buffer = '';
          typeaheadRef.current.timer = null;
        }, 500);
        const buf = typeaheadRef.current.buffer;
        const idx = flatItems.findIndex(
          (it) => !it.isDisabled && nodeToString(it.label).toLowerCase().startsWith(buf),
        );
        if (idx >= 0) {
          e.preventDefault();
          setHighlight(idx);
        }
      }
    },
    [flatItems, handleSelect, highlight, moveHighlight],
  );

  // —— Panel ref（forward 给外部 + 内部聚焦使用）——
  const panelRefInternal = useRef<HTMLDivElement | null>(null);
  const setPanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      panelRefInternal.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [forwardedRef],
  );

  // —— 函数式 trigger 的 click 绑定 ——
  // Popover 不会给 render-prop anchor 注入 click，所以由 Menu 自己挂一个 listener 在 trigger 节点上。
  // 用 ref 跟踪当前绑定的节点，并把 toggle 逻辑放在 stable callback 中（通过 ref 读取最新 open 值）。
  const triggerNodeRef = useRef<HTMLElement | null>(null);
  const openStateRef = useRef(open);
  useEffect(() => {
    openStateRef.current = open;
  }, [open]);
  const isDisabledRef = useRef(isDisabled);
  useEffect(() => {
    isDisabledRef.current = isDisabled;
  }, [isDisabled]);

  const handleRenderPropTriggerClick = useCallback(() => {
    if (isDisabledRef.current) return;
    setOpen(!openStateRef.current);
  }, [setOpen]);

  const attachToggleListener = useCallback(
    (node: HTMLElement | null) => {
      if (triggerNodeRef.current === node) return;
      // 卸载旧节点
      if (triggerNodeRef.current) {
        triggerNodeRef.current.removeEventListener('click', handleRenderPropTriggerClick);
      }
      triggerNodeRef.current = node;
      if (node) {
        node.addEventListener('click', handleRenderPropTriggerClick);
      }
    },
    [handleRenderPropTriggerClick],
  );

  useEffect(
    () => () => {
      if (triggerNodeRef.current) {
        triggerNodeRef.current.removeEventListener('click', handleRenderPropTriggerClick);
        triggerNodeRef.current = null;
      }
    },
    [handleRenderPropTriggerClick],
  );

  // —— trigger 适配：ReactElement 直接交给 Popover；函数式 trigger 由 Menu 自己包装 ref。 ——
  const wrappedAnchor:
    | ReactElement
    | ((opts: { isOpen: boolean; ref: Ref<HTMLElement> }) => ReactNode) = useMemo(() => {
    if (typeof trigger === 'function') {
      const userTrigger = trigger as (opts: {
        isOpen: boolean;
        ref: Ref<HTMLElement>;
      }) => ReactNode;
      return ({ isOpen: openState, ref: popRef }) => {
        const composedRef = (node: HTMLElement | null) => {
          if (typeof popRef === 'function') popRef(node);
          else if (popRef) {
            (popRef as React.MutableRefObject<HTMLElement | null>).current = node;
          }
          attachToggleListener(node);
        };
        return userTrigger({ isOpen: openState, ref: composedRef });
      };
    }
    if (!isValidElement(trigger)) return trigger as unknown as ReactElement;
    if (!isDisabled) return trigger;
    const elem = trigger as ReactElement<Record<string, unknown>>;
    return cloneElement(elem, {
      ...(elem.props as Record<string, unknown>),
      disabled: true,
      'aria-disabled': true,
      onClickCapture: (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      },
    });
  }, [trigger, isDisabled, attachToggleListener]);

  // 受控开关 + isDisabled 时不允许打开。
  const effectiveIsOpen = isDisabled ? false : open;

  return (
    <Popover
      anchor={wrappedAnchor}
      isOpen={effectiveIsOpen}
      onOpenChange={(next) => {
        if (isDisabled) return;
        setOpen(next);
      }}
      placement={placement}
      hasArrow={false}
      closeOnBlur
      closeOnEsc
      portalContainer={portalContainer}
      aria-label={ariaLabel ?? 'Menu'}
    >
      <MenuPanel
        nodes={nodes}
        flatItems={flatItems}
        selectionMode={selectionMode}
        selectedKeys={selected}
        highlight={highlight}
        setHighlight={setHighlight}
        onSelect={handleSelect}
        baseId={baseId}
        ariaLabel={ariaLabel}
        className={className}
        style={style}
        panelRef={setPanelRef}
        onKeyDown={handleKeyDown}
      />
    </Popover>
  );
});

(MenuImpl as unknown as { displayName: string }).displayName = 'TimeUI.Menu';

// ────────────────────────────────────────────────────────────
// 复合导出：Menu.Item / Menu.Section / Menu.Divider / Menu.SubMenu
// ────────────────────────────────────────────────────────────

type MenuComponent = typeof MenuImpl & {
  Item: typeof MenuItem;
  Section: typeof MenuSection;
  Divider: typeof MenuDivider;
  SubMenu: typeof MenuSubMenu;
};

export const Menu = MenuImpl as MenuComponent;
Menu.Item = MenuItem;
Menu.Section = MenuSection;
Menu.Divider = MenuDivider;
Menu.SubMenu = MenuSubMenu;

export { MenuItem, MenuSection, MenuDivider, MenuSubMenu };
