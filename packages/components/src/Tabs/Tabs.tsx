/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Tabs 组件：支持 underline / pills / bordered 三种 variant、horizontal / vertical 两种方向，
 *              声明式（<Tab>）与数据驱动（items）双 API；roving tabindex + indicator 滑动 + lazy panel。
 */

'use client';

import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { useControllableState } from '../utils';
import type { TabItem, TabPanelProps, TabProps, TabsProps } from './Tabs.types';

// SSR 安全的 layout effect。
const useSafeLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** 解析后用于内部渲染的 tab 描述：合并自 children 或 items。 */
interface ResolvedTab {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  isDisabled: boolean;
  content: ReactNode;
}

const Tab = (_props: TabProps): null => {
  // Tab 是一个标记型组件：实际渲染由 Tabs 完成（通过 Children 解析）。
  // 渲染 null 即可，类型上保留 props 以支持 IDE 智能提示。
  return null;
};
(Tab as unknown as { displayName: string }).displayName = 'TimeUI.Tab';

const TabPanel = (_props: TabPanelProps): null => {
  // TabPanel 是标记型组件：实际 panel 渲染由 Tabs 完成（通过 parseChildren 读取它的 children）。
  // 必须返回 null —— 因为它通常嵌在 <Tab> 内，而 Tab 也返回 null，整个子树不会经历正常 render。
  // 这里保持同样语义，确保即使有人误用（直接渲染 TabPanel），也不会产生孤儿节点。
  return null;
};
(TabPanel as unknown as { displayName: string }).displayName = 'TimeUI.TabPanel';

// 用 props 形状而非引用相等 / displayName 比较来识别 Tab / TabPanel：
//
// Next.js 15 + RSC 把每个 client component 包成 React.lazy proxy（
// `{ $$typeof: Symbol(react.lazy), _payload, _init }`）。在 Tabs 的 parseChildren 跑的时候，
// Tab 子元素的 element.type 还是这个未 resolve 的 lazy 对象 ——
//   - typeof type === 'object' 而非 'function'，引用相等失败
//   - 没有 displayName / name，displayName 比较也失败
//
// 唯一可靠的运行时判别是看 props 形状：Tab 必有 itemKey + label（tab 按钮要显示标签），
// TabPanel 只有 itemKey 不带 label。这与组件类型签名一致，约束消费者不要在
// children 里塞其它带这两个 prop 的元素。
function isTabElement(el: unknown): el is React.ReactElement<TabProps> {
  if (!isValidElement(el)) return false;
  const props = el.props as Record<string, unknown>;
  return 'itemKey' in props && 'label' in props;
}

function isTabPanelElement(el: unknown): el is React.ReactElement<TabPanelProps> {
  if (!isValidElement(el)) return false;
  const props = el.props as Record<string, unknown>;
  return 'itemKey' in props && !('label' in props);
}

/**
 * 解析 children：
 * - 遍历顶层 children，过滤 displayName === 'TimeUI.Tab' 的节点
 * - 每个 Tab 子节点的 props.children 中查找 'TimeUI.TabPanel' 节点；找到则取其 children 作为 panel
 * - 若 Tab 没有 TabPanel 子节点，则 props.children 整体作为 panel 内容（约定式简写）
 */
function parseChildren(children: ReactNode): ResolvedTab[] {
  const out: ResolvedTab[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (!isTabElement(child)) return;
    const tabProps = child.props as TabProps;
    let panelContent: ReactNode = null;
    let foundPanel = false;
    Children.forEach(tabProps.children, (inner) => {
      if (!isValidElement(inner)) return;
      if (isTabPanelElement(inner)) {
        const panelProps = inner.props as TabPanelProps;
        panelContent = panelProps.children;
        foundPanel = true;
      }
    });
    if (!foundPanel) panelContent = tabProps.children ?? null;
    out.push({
      key: tabProps.itemKey,
      label: tabProps.label,
      ...(tabProps.icon !== undefined ? { icon: tabProps.icon } : {}),
      isDisabled: !!tabProps.isDisabled,
      content: panelContent,
    });
  });
  return out;
}

function itemsToResolved(items: ReadonlyArray<TabItem>): ResolvedTab[] {
  return items.map((it) => ({
    key: it.key,
    label: it.label,
    ...(it.icon !== undefined ? { icon: it.icon } : {}),
    isDisabled: !!it.isDisabled,
    content: it.content ?? null,
  }));
}

function findFirstEnabled(tabs: ResolvedTab[]): string | undefined {
  for (const t of tabs) {
    if (!t.isDisabled) return t.key;
  }
  return undefined;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(props, forwardedRef) {
  const {
    selectedKey,
    defaultSelectedKey,
    onSelectionChange,
    items,
    children,
    variant = 'underline',
    size = 'md',
    orientation = 'horizontal',
    isLazy = false,
    isDisabled = false,
    disabledKeys,
    className,
    style,
    id,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
  } = props;

  const theme = useTheme();
  const isVertical = orientation === 'vertical';

  // 解析 tabs：items 优先于 children。
  const resolvedTabs = useMemo<ResolvedTab[]>(() => {
    const base = items ? itemsToResolved(items) : parseChildren(children);
    if (!disabledKeys || disabledKeys.length === 0) return base;
    const disSet = new Set(disabledKeys);
    return base.map((t) => (disSet.has(t.key) ? { ...t, isDisabled: true } : t));
  }, [items, children, disabledKeys]);

  const fallback = defaultSelectedKey ?? findFirstEnabled(resolvedTabs);
  const [selected, setSelected] = useControllableState<string | undefined>({
    value: selectedKey,
    defaultValue: (selectedKey !== undefined ? undefined : fallback) as string | undefined,
    onChange: onSelectionChange as ((v: string | undefined) => void) | undefined,
    name: 'Tabs',
  });

  // 生成稳定 id 前缀，去掉 React 默认 id 中的冒号（避免 aria-labelledby 解析问题）。
  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');
  const baseId = id ?? `timeui-tabs-${safeAutoId}`;
  const tabId = (key: string) => `${baseId}-tab-${key}`;
  const panelId = (key: string) => `${baseId}-panel-${key}`;

  const selectedIndex = useMemo(
    () => resolvedTabs.findIndex((t) => t.key === selected),
    [resolvedTabs, selected],
  );

  // 选择某个 key（跳过禁用 / 全局禁用）。
  const select = useCallback(
    (key: string) => {
      if (isDisabled) return;
      const tab = resolvedTabs.find((t) => t.key === key);
      if (!tab || tab.isDisabled) return;
      if (selected === key) return;
      setSelected(key);
    },
    [isDisabled, resolvedTabs, selected, setSelected],
  );

  // 计算 indicator 的位置 & 尺寸。基于 ref 数组测量每个 tab 节点。
  const tabRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const listRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState<{
    offset: number;
    size: number;
    visible: boolean;
  }>({ offset: 0, size: 0, visible: false });

  const measure = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    if (selectedIndex < 0) {
      setIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }
    const key = resolvedTabs[selectedIndex]?.key;
    if (!key) return;
    const node = tabRefs.current.get(key);
    if (!node) return;
    const listRect = list.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    if (isVertical) {
      setIndicator({
        offset: rect.top - listRect.top + list.scrollTop,
        size: rect.height,
        visible: true,
      });
    } else {
      setIndicator({
        offset: rect.left - listRect.left + list.scrollLeft,
        size: rect.width,
        visible: true,
      });
    }
  }, [isVertical, resolvedTabs, selectedIndex]);

  useSafeLayoutEffect(() => {
    measure();
  }, [measure]);

  // 监听 list 尺寸变化（响应式 / 字体加载）。
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    return () => ro.disconnect();
  }, [measure]);

  // 键盘：上下/左右切换 + 自动跳过 disabled；Home/End 跳首尾；Enter/Space 已经由 button 默认行为触发 click。
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const enabledIdx = resolvedTabs.map((t, i) => ({ t, i })).filter(({ t }) => !t.isDisabled);
      if (enabledIdx.length === 0) return;
      const currentEnabledPos = enabledIdx.findIndex(({ i }) => i === selectedIndex);

      const moveBy = (delta: number) => {
        // 起点：当前未在 enabled 列表中（selectedIndex 是 disabled 或 -1）则从 0 开始。
        const startPos = currentEnabledPos === -1 ? 0 : currentEnabledPos;
        const len = enabledIdx.length;
        const nextPos = (startPos + delta + len) % len;
        const targetKey = enabledIdx[nextPos]?.t.key;
        if (targetKey) {
          select(targetKey);
          // 把焦点也移过去（roving tabindex 的核心）。
          const node = tabRefs.current.get(targetKey);
          node?.focus();
        }
      };

      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';

      if (e.key === prevKey) {
        e.preventDefault();
        moveBy(-1);
      } else if (e.key === nextKey) {
        e.preventDefault();
        moveBy(1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        const firstKey = enabledIdx[0]?.t.key;
        if (firstKey) {
          select(firstKey);
          tabRefs.current.get(firstKey)?.focus();
        }
      } else if (e.key === 'End') {
        e.preventDefault();
        const lastKey = enabledIdx[enabledIdx.length - 1]?.t.key;
        if (lastKey) {
          select(lastKey);
          tabRefs.current.get(lastKey)?.focus();
        }
      }
    },
    [isVertical, resolvedTabs, select, selectedIndex],
  );

  // —— 样式计算 ——
  const sizeTokens = theme.components.tabsSize[size];
  const tabsTokens = theme.components.tabs;
  const { height, fontSize, paddingX, gap, iconSize } = sizeTokens;

  const focusColor = theme.colors.border.focus ?? theme.colors.focus;
  const textPrimary = theme.colors.text.primary;
  const textSecondary = theme.colors.text.secondary;
  const borderSubtle = theme.colors.border.subtle;
  const borderDefault = theme.colors.border.default;
  const surfaceBg = theme.colors.bg.surface;
  const mutedBg = theme.colors.bg.muted;
  const accent = theme.colors.action.primary.default;

  const indicatorDuration = tabsTokens.indicatorDuration;
  const colorDuration = tabsTokens.colorDuration;
  const easing = theme.motion.easing.spring ?? theme.motion.easing.easeInOut;

  const rootCss = css`
    display: ${isVertical ? 'flex' : 'block'};
    ${isVertical ? `flex-direction: row; align-items: stretch;` : ''}
    font-family: inherit;
    color: ${textPrimary};
    ${isDisabled ? 'opacity: 0.6; pointer-events: none;' : ''}
  `;

  // ——— 三种 variant 的 tablist 样式 ———
  const baseListCss = css`
    position: relative;
    display: ${isVertical ? 'flex' : 'flex'};
    flex-direction: ${isVertical ? 'column' : 'row'};
    align-items: ${isVertical ? 'stretch' : 'center'};
    gap: ${tabsTokens.listGap};
    box-sizing: border-box;
    ${isVertical ? '' : 'overflow-x: auto;'}
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  `;

  const underlineListCss = css`
    ${baseListCss}
    ${isVertical
      ? `border-right: ${tabsTokens.underlineTrackBorder} solid ${borderSubtle};`
      : `border-bottom: ${tabsTokens.underlineTrackBorder} solid ${borderSubtle};`}
  `;

  const pillsListCss = css`
    ${baseListCss}
    background-color: ${mutedBg};
    padding: ${tabsTokens.pillsTrackPadding};
    border-radius: ${tabsTokens.pillsTrackRadius};
    gap: ${tabsTokens.pillsTrackPadding};
    ${isVertical ? '' : 'overflow: visible;'}
  `;

  const borderedListCss = css`
    ${baseListCss}
    ${isVertical
      ? `border-right: 1px solid ${borderDefault};`
      : `border-bottom: 1px solid ${borderDefault};`}
  `;

  const listCss =
    variant === 'pills'
      ? pillsListCss
      : variant === 'bordered'
        ? borderedListCss
        : underlineListCss;

  // ——— 单个 tab 按钮样式 ———
  const tabButtonCss = (isSelected: boolean, tabDisabled: boolean) => {
    const base = css`
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: ${gap};
      box-sizing: border-box;
      height: ${height};
      padding: 0 ${paddingX};
      font-family: inherit;
      font-size: ${fontSize};
      font-weight: ${isSelected
        ? tabsTokens.itemFontWeightActive
        : tabsTokens.itemFontWeightDefault};
      color: ${tabDisabled ? textSecondary : isSelected ? textPrimary : textSecondary};
      background-color: transparent;
      border: 0;
      cursor: ${tabDisabled ? 'not-allowed' : 'pointer'};
      user-select: none;
      white-space: nowrap;
      transition: color ${colorDuration} linear;
      opacity: ${tabDisabled ? 0.4 : 1};
      &:hover {
        color: ${tabDisabled ? textSecondary : textPrimary};
      }
      &:focus-visible {
        outline: 2px solid ${focusColor};
        outline-offset: -2px;
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    if (variant === 'underline') return base;
    if (variant === 'pills') {
      return css`
        ${base}
        border-radius: ${tabsTokens.pillsRadius};
        color: ${tabDisabled ? textSecondary : isSelected ? textPrimary : textSecondary};
      `;
    }
    // bordered：激活的 tab 顶部 / 左侧带有色边框；底部 border 透明（与 panel 衔接）。
    return css`
      ${base}
      ${isVertical
        ? `border-right: 2px solid ${isSelected ? 'transparent' : 'transparent'};`
        : `border-bottom: 2px solid ${isSelected ? 'transparent' : 'transparent'};`}
      ${isSelected
        ? isVertical
          ? `box-shadow: inset 2px 0 0 ${accent};`
          : `box-shadow: inset 0 -2px 0 ${accent};`
        : ''}
    `;
  };

  // ——— indicator（underline / pills 各自一种） ———
  // underline：滑动条
  const underlineIndicatorCss = css`
    position: absolute;
    pointer-events: none;
    background-color: ${accent};
    border-radius: ${tabsTokens.underlineRadius};
    opacity: ${indicator.visible ? 1 : 0};
    transition:
      transform ${indicatorDuration} ${easing},
      width ${indicatorDuration} ${easing},
      height ${indicatorDuration} ${easing},
      opacity ${indicatorDuration} ${easing};
    ${isVertical
      ? `right: -${tabsTokens.underlineTrackBorder};
         top: 0;
         width: ${tabsTokens.underlineThickness};
         height: ${indicator.size}px;
         transform: translate3d(0, ${indicator.offset}px, 0);`
      : `left: 0;
         bottom: -${tabsTokens.underlineTrackBorder};
         height: ${tabsTokens.underlineThickness};
         width: ${indicator.size}px;
         transform: translate3d(${indicator.offset}px, 0, 0);`}
    @media (prefers-reduced-motion: reduce) {
      transition: opacity ${indicatorDuration} linear;
    }
  `;

  // pills：白色 surface + 阴影的 pill；绝对定位 + transform 滑动。
  const pillsIndicatorCss = css`
    position: absolute;
    pointer-events: none;
    background-color: ${surfaceBg};
    border-radius: ${tabsTokens.pillsRadius};
    box-shadow: ${theme.shadows.sm};
    opacity: ${indicator.visible ? 1 : 0};
    transition:
      transform ${indicatorDuration} ${easing},
      width ${indicatorDuration} ${easing},
      height ${indicatorDuration} ${easing},
      opacity ${indicatorDuration} ${easing};
    ${isVertical
      ? `left: ${tabsTokens.pillsTrackPadding};
         right: ${tabsTokens.pillsTrackPadding};
         top: 0;
         height: ${indicator.size}px;
         transform: translate3d(0, ${indicator.offset}px, 0);`
      : `top: ${tabsTokens.pillsTrackPadding};
         bottom: ${tabsTokens.pillsTrackPadding};
         left: 0;
         width: ${indicator.size}px;
         transform: translate3d(${indicator.offset}px, 0, 0);`}
    @media (prefers-reduced-motion: reduce) {
      transition: opacity ${indicatorDuration} linear;
    }
  `;

  // ——— 面板容器样式 ———
  const panelsCss = css`
    flex: 1;
    min-width: 0;
    padding: ${tabsTokens.panelPaddingY} 0;
    color: ${textPrimary};
    font-size: ${fontSize};
    ${variant === 'bordered'
      ? isVertical
        ? `border-right: 1px solid ${borderDefault}; border-top: 1px solid ${borderDefault}; border-bottom: 1px solid ${borderDefault}; border-radius: 0 ${tabsTokens.borderedRadius} ${tabsTokens.borderedRadius} 0; padding: ${tabsTokens.panelPaddingY};`
        : `border: 1px solid ${borderDefault}; border-top: 0; border-radius: 0 0 ${tabsTokens.borderedRadius} ${tabsTokens.borderedRadius}; padding: ${tabsTokens.panelPaddingY};`
      : ''}
  `;

  const iconCss = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${iconSize};
    height: ${iconSize};
    flex: none;
    & > svg {
      display: block;
    }
  `;

  return (
    <div
      ref={forwardedRef}
      id={id}
      className={className}
      style={style}
      css={rootCss}
      data-orientation={isVertical ? 'vertical' : 'horizontal'}
      data-variant={variant}
      data-size={size}
      data-disabled={isDisabled || undefined}
    >
      <div
        ref={listRef}
        role="tablist"
        aria-label={!ariaLabelledBy ? ariaLabel : undefined}
        aria-labelledby={ariaLabelledBy}
        aria-orientation={isVertical ? 'vertical' : 'horizontal'}
        data-tabs-list=""
        css={listCss}
        onKeyDown={handleKeyDown}
      >
        {variant === 'underline' ? (
          <span aria-hidden data-tabs-indicator="underline" css={underlineIndicatorCss} />
        ) : null}
        {variant === 'pills' ? (
          <span aria-hidden data-tabs-indicator="pills" css={pillsIndicatorCss} />
        ) : null}
        {resolvedTabs.map((t) => {
          const isSelected = t.key === selected;
          const tabDisabled = t.isDisabled || isDisabled;
          return (
            <button
              key={t.key}
              ref={(node) => {
                if (node) tabRefs.current.set(t.key, node);
                else tabRefs.current.delete(t.key);
              }}
              type="button"
              role="tab"
              id={tabId(t.key)}
              aria-selected={isSelected}
              aria-controls={panelId(t.key)}
              aria-disabled={tabDisabled || undefined}
              disabled={tabDisabled}
              tabIndex={isSelected ? 0 : -1}
              data-selected={isSelected || undefined}
              data-disabled={tabDisabled || undefined}
              data-tab-key={t.key}
              css={tabButtonCss(isSelected, tabDisabled)}
              onClick={() => select(t.key)}
            >
              {t.icon ? (
                <span aria-hidden css={iconCss}>
                  {t.icon}
                </span>
              ) : null}
              {t.label}
            </button>
          );
        })}
      </div>
      <div css={panelsCss} data-tabs-panels="">
        {resolvedTabs.map((t) => {
          const isSelected = t.key === selected;
          if (isLazy && !isSelected) return null;
          return (
            <div
              key={t.key}
              role="tabpanel"
              id={panelId(t.key)}
              aria-labelledby={tabId(t.key)}
              hidden={!isSelected}
              tabIndex={0}
              data-tabs-panel=""
              data-selected={isSelected || undefined}
              style={!isSelected ? { display: 'none' } : undefined}
            >
              {t.content}
            </div>
          );
        })}
      </div>
    </div>
  );
});

(Tabs as unknown as { displayName: string }).displayName = 'TimeUI.Tabs';

export { Tab, TabPanel };
