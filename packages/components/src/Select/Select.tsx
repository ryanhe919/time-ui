/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Select 组件的核心渲染与交互逻辑。
 */

import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme, css } from '@emotion/react';
import {
  getFieldVariantStyles,
  isDev,
  mergeRefs,
  useControllableState,
  useIsomorphicLayoutEffect,
} from '../utils';
import { FormField } from '../FormField';
import { SELECT_OPTION_TAG } from './SelectOption';
import type {
  SelectProps,
  SelectSize,
  SelectRadius,
  SelectItem,
  SelectOptionProps,
} from './Select.types';

const sizeRadiusMap: Record<SelectSize, SelectRadius> = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'lg',
};

const ChevronIcon = ({ sizePx, open }: { sizePx: number; open: boolean }) => (
  <svg
    aria-hidden
    focusable="false"
    width={sizePx}
    height={sizePx}
    viewBox="0 0 12 12"
    fill="none"
    style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 180ms' }}
  >
    <path
      d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function childrenToItems(children: ReactNode): SelectItem[] {
  const out: SelectItem[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type as unknown as {
      __timeuiTag?: symbol;
      displayName?: string;
      name?: string;
    };
    const isKnownTag =
      type?.__timeuiTag === SELECT_OPTION_TAG ||
      type?.displayName === 'SelectOption' ||
      type?.name === 'SelectOption';
    const props = child.props as SelectOptionProps;
    const hasValue = props && typeof props.value !== 'undefined';
    // 兼容 RSC / 打包后组件标识变化：若能识别到 value，也按 SelectOption 处理。
    if (!isKnownTag && !hasValue) {
      if (isDev) {
        console.warn(
          '[TimeUI] Select: only `<SelectOption>` children are supported. Skipping unknown child.',
        );
      }
      return;
    }
    out.push({
      value: String(props.value),
      label: props.children as ReactNode,
      isDisabled: props.isDisabled,
      description: props.description,
    });
  });
  return out;
}

function labelToString(label: ReactNode): string {
  if (label == null || label === false) return '';
  if (typeof label === 'string' || typeof label === 'number') return String(label);
  const acc: string[] = [];
  Children.forEach(label as ReactNode, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      acc.push(String(child));
    } else if (isValidElement(child)) {
      acc.push(labelToString((child as ReactElement<{ children?: ReactNode }>).props?.children));
    }
  });
  return acc.join(' ');
}

function cssLength(v: number | string | undefined, fallback: string): string {
  if (v === undefined) return fallback;
  return typeof v === 'number' ? `${v}px` : v;
}

const SelectControl = forwardRef<HTMLButtonElement, SelectProps>(function SelectControl(
  {
    variant = 'flat',
    color = 'default',
    size = 'md',
    radius: radiusProp,
    isFullWidth = false,
    value,
    defaultValue,
    onChange,
    placeholder,
    items,
    children,
    startContent,
    endContent,
    isInvalid = false,
    isDisabled = false,
    isRequired = false,
    isSearchable = false,
    searchPlaceholder,
    emptyMessage,
    maxListHeight = 280,
    className,
    style,
    id: idProp,
    name,
    'aria-invalid': ariaInvalidProp,
    'aria-describedby': ariaDescribedByProp,
    'aria-required': ariaRequiredProp,
    'aria-labelledby': ariaLabelledByProp,
    ...rest
  },
  ref,
) {
  const theme = useTheme();

  if (isDev && items && children) {
    console.warn(
      '[TimeUI] Select: received both `items` and `children`. `items` wins; children are ignored.',
    );
  }

  const sourceItems = useMemo<SelectItem[]>(
    // items 显式传入优先；否则从子节点推导，保证两种用法行为一致。
    () => items ?? childrenToItems(children),
    [items, children],
  );

  const [rawValue, setValue] = useControllableState<string>({
    value,
    defaultValue: defaultValue as string,
    onChange,
    name: 'Select',
  });
  const current = rawValue ?? '';

  const currentItem = useMemo(
    () => sourceItems.find((it) => it.value === current),
    [sourceItems, current],
  );

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlight, setHighlight] = useState(-1);
  const [popoverRect, setPopoverRect] = useState<{
    /** bottom: 菜单挂在 trigger 下方；top: 挂在上方（贴 trigger 顶） */
    placement: 'bottom' | 'top';
    /**
     * 锚定坐标：
     * - bottom 时是 trigger.bottom（距 viewport 顶部），style.top = offset + gap
     * - top 时是 vh - trigger.top（距 viewport 底部），style.bottom = offset + gap
     */
    offset: number;
    left: number;
    width: number;
    /** 此 placement 下菜单可用的最大高度（避免被视口底/顶截断） */
    maxHeight: number;
  } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const autoId = useId();
  const triggerId = idProp ?? `timeui-select-${autoId}`;
  const listboxId = `${triggerId}-listbox`;

  const filteredItems = useMemo(() => {
    if (!isSearchable || !search) return sourceItems;
    const q = search.toLowerCase();
    return sourceItems.filter((it) => labelToString(it.label).toLowerCase().includes(q));
  }, [sourceItems, search, isSearchable]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const wrapper = wrapperRef.current;
      const popover = popoverRef.current;
      if (wrapper && wrapper.contains(target)) return;
      if (popover && popover.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }
    // 打开时把高亮锚定到当前选中项；找不到则回退到第一个可用项。
    // 搜索框的初始聚焦由 input 自身的 autoFocus 处理。
    const idx = filteredItems.findIndex((it) => it.value === current && !it.isDisabled);
    setHighlight(idx >= 0 ? idx : filteredItems.findIndex((it) => !it.isDisabled));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (highlight >= filteredItems.length) {
      const next = filteredItems.findIndex((it) => !it.isDisabled);
      setHighlight(next);
    }
  }, [filteredItems, highlight, open]);

  useEffect(() => {
    if (!open || highlight < 0) return;
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLLIElement>(`[data-index="${highlight}"]`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlight, open]);

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setPopoverRect(null);
      return;
    }
    const updateRect = () => {
      const trigger = wrapperRef.current;
      if (!trigger) return;
      const r = trigger.getBoundingClientRect();
      const vh = window.innerHeight;
      const gap = 6; // 与 trigger 之间的间距
      const safeMargin = 8; // 距视口边缘的安全留白
      const userMaxPx = typeof maxListHeight === 'number' ? maxListHeight : 280;

      const availableBelow = Math.max(0, vh - r.bottom - gap - safeMargin);
      const availableAbove = Math.max(0, r.top - gap - safeMargin);

      // 优先 bottom；下方放不下用户期望高度且上方更宽，则 flip 到 top。
      const placement: 'bottom' | 'top' =
        availableBelow >= userMaxPx || availableBelow >= availableAbove ? 'bottom' : 'top';

      const maxHeight = Math.max(120, placement === 'bottom' ? availableBelow : availableAbove);

      setPopoverRect({
        placement,
        offset: placement === 'bottom' ? r.bottom : vh - r.top,
        left: r.left,
        width: r.width,
        maxHeight,
      });
    };
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open, maxListHeight]);

  const closeAndRefocus = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const focusSearchInput = useCallback(() => {
    // 仅在 popover 已挂载（即 open && isSearchable）时调用，input 此刻已就绪。
    searchInputRef.current?.focus();
  }, []);

  const commit = useCallback(
    (nextValue: string) => {
      setSearch('');
      setValue(nextValue);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [setValue],
  );

  const moveHighlight = useCallback(
    (dir: 1 | -1) => {
      if (filteredItems.length === 0) return;
      let i = highlight;
      for (let step = 0; step < filteredItems.length; step += 1) {
        i = (i + dir + filteredItems.length) % filteredItems.length;
        if (!filteredItems[i]!.isDisabled) {
          setHighlight(i);
          return;
        }
      }
    },
    [filteredItems, highlight],
  );

  const handleNavKey = useCallback(
    (key: string): boolean => {
      if (!open) {
        if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
          setOpen(true);
          return true;
        }
        return false;
      }
      if (key === 'ArrowDown') {
        moveHighlight(1);
        return true;
      }
      if (key === 'ArrowUp') {
        moveHighlight(-1);
        return true;
      }
      if (key === 'Home') {
        const i = filteredItems.findIndex((it) => !it.isDisabled);
        if (i >= 0) setHighlight(i);
        return true;
      }
      if (key === 'End') {
        for (let i = filteredItems.length - 1; i >= 0; i -= 1) {
          if (!filteredItems[i]!.isDisabled) {
            setHighlight(i);
            break;
          }
        }
        return true;
      }
      if (key === 'Enter') {
        const it = filteredItems[highlight];
        if (it && !it.isDisabled) commit(it.value);
        return true;
      }
      if (key === 'Escape') {
        closeAndRefocus();
        return true;
      }
      if (key === 'Tab') {
        setOpen(false);
        return false;
      }
      return false;
    },
    [open, moveHighlight, filteredItems, highlight, commit, closeAndRefocus],
  );

  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    if (e.key === ' ' && open) {
      e.preventDefault();
      const it = filteredItems[highlight];
      if (it && !it.isDisabled) commit(it.value);
      return;
    }
    if (handleNavKey(e.key)) {
      e.preventDefault();
    }
  };

  const onSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    // handleNavKey 只对方向/Home/End/Enter/Esc/Tab 返回 true，其它字符按键直通给 input。
    if (handleNavKey(e.key)) {
      e.preventDefault();
    }
  };

  const onOptionClick = (e: ReactMouseEvent<HTMLLIElement>, it: SelectItem) => {
    e.preventDefault();
    if (it.isDisabled) return;
    commit(it.value);
  };

  const resolvedColor = isInvalid ? 'danger' : color;
  const sizeTokens = theme.components.input[size];
  const radiusKey: SelectRadius = radiusProp ?? sizeRadiusMap[size];
  const borderRadius =
    radiusKey === 'full'
      ? theme.radius.full
      : theme.componentRadius[radiusKey as 'sm' | 'md' | 'lg'];

  const variantStyles = getFieldVariantStyles({
    theme,
    variant,
    color: resolvedColor,
    isInvalid,
    isDisabled,
  });

  const iconSizePx = parseInt(sizeTokens.iconSize, 10) || 16;

  // wrapper 仅承担尺寸/边框等"字段框架"职责；button 自身吸收所有点击区域，
  // 因此 startContent/chevron 都放在 button 内部（见下方 JSX），不再需要把
  // wrapper 上的 mousedown 转发到 trigger。
  const wrapperCss = css`
    position: relative;
    display: inline-flex;
    box-sizing: border-box;
    width: ${isFullWidth ? '100%' : 'auto'};
    height: ${sizeTokens.height};
    border-radius: ${borderRadius};
    color: ${theme.colors.text.primary};
    font-size: ${sizeTokens.fontSize};
    line-height: ${sizeTokens.lineHeight};
    ${isDisabled ? 'cursor: not-allowed;' : 'cursor: pointer;'}
  `;

  const triggerCss = css`
    appearance: none;
    background: transparent;
    border: 0;
    outline: none;
    box-shadow: none;
    flex: 1;
    min-width: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0 ${sizeTokens.paddingX};
    gap: ${sizeTokens.gap};
    font: inherit;
    color: inherit;
    line-height: inherit;
    text-align: start;
    display: inline-flex;
    align-items: center;
    ${isDisabled ? 'cursor: not-allowed;' : 'cursor: pointer;'}
  `;

  const adornmentCss = css`
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: ${theme.colors.text.muted};
    pointer-events: none;
    font-size: ${sizeTokens.iconSize};
    line-height: 1;
  `;

  const selectedBg =
    resolvedColor === 'default'
      ? (theme.colors.bg.muted ?? theme.colors.bg.sunken)
      : theme.colors[resolvedColor][100];
  const selectedText =
    resolvedColor === 'default' ? theme.colors.text.primary : theme.colors[resolvedColor][600];

  const popoverCss = css`
    position: fixed;
    z-index: 9999;
    font-family:
      ui-sans-serif,
      -apple-system,
      BlinkMacSystemFont,
      'SF Pro Text',
      'Inter',
      'Helvetica Neue',
      sans-serif;
    font-size: 13px;
    line-height: 1.4;
    font-weight: 400;
    letter-spacing: -0.003em;
    text-align: start;
    background: ${theme.colors.bg.surface ?? theme.colors.bg.canvas};
    color: ${theme.colors.text.primary};
    border: 1px solid ${theme.colors.border.default};
    border-radius: 10px;
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.02),
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 10px 24px -6px rgba(0, 0, 0, 0.12),
      0 20px 40px -12px rgba(0, 0, 0, 0.18);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transform-origin: top center;
    animation: timeui-select-pop 140ms cubic-bezier(0.16, 1, 0.3, 1);
    /* 当菜单贴在 trigger 上方展开时，把 origin 与位移方向反过来，
       维持"从 trigger 边缘弹出"的视觉一致性。 */
    &[data-placement='top'] {
      transform-origin: bottom center;
      animation-name: timeui-select-pop-up;
    }
    @keyframes timeui-select-pop {
      from {
        opacity: 0;
        transform: translateY(-4px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes timeui-select-pop-up {
      from {
        opacity: 0;
        transform: translateY(4px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `;

  const searchCss = css`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-bottom: 1px solid ${theme.colors.border.subtle ?? theme.colors.border.default};
    color: ${theme.colors.text.muted};
    svg {
      flex-shrink: 0;
    }
    input {
      appearance: none;
      width: 100%;
      border: 0;
      outline: none;
      background: transparent;
      font: inherit;
      color: ${theme.colors.text.primary};
      padding: 4px 2px;
      margin: 0;
      &::placeholder {
        color: ${theme.colors.text.muted};
      }
    }
  `;

  const listCss = css`
    list-style: none;
    margin: 0;
    padding: 4px;
    /* flex 子项必须解除默认 min-height: auto，否则 flex 容器的 maxHeight 收紧时
       ul 仍按内容撑开导致整体溢出被 popover 的 overflow:hidden 裁掉。 */
    flex: 1 1 auto;
    min-height: 0;
    max-height: ${cssLength(maxListHeight, '280px')};
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: ${theme.colors.border.default} transparent;
    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: ${theme.colors.border.default};
      border: 2px solid transparent;
      background-clip: padding-box;
      border-radius: 8px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: ${theme.colors.border.strong};
      border: 2px solid transparent;
      background-clip: padding-box;
    }
  `;

  const emptyCss = css`
    padding: 14px 12px;
    text-align: center;
    color: ${theme.colors.text.muted};
    font-size: 13px;
    margin: 0;
  `;

  const renderOption = (it: SelectItem, idx: number) => {
    const isSelected = it.value === current;
    const isHighlighted = idx === highlight;
    // 高亮态：在已选项上叠加更深一档（color/200 或 sunken）；普通项用 muted。
    const highlightedBg = isSelected
      ? resolvedColor === 'default'
        ? theme.colors.bg.sunken
        : theme.colors[resolvedColor][200]
      : (theme.colors.bg.muted ?? theme.colors.bg.sunken);
    return (
      <li
        key={it.value}
        data-index={idx}
        id={`${listboxId}-opt-${idx}`}
        role="option"
        aria-selected={isSelected}
        aria-disabled={it.isDisabled || undefined}
        onMouseEnter={() => !it.isDisabled && setHighlight(idx)}
        onMouseDown={(e) => onOptionClick(e, it)}
        css={css`
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 7px 10px;
          margin: 0;
          border-radius: 6px;
          cursor: ${it.isDisabled ? 'not-allowed' : 'pointer'};
          font-size: 13px;
          line-height: 1.35;
          color: ${it.isDisabled
            ? theme.colors.text.disabled
            : isSelected
              ? selectedText
              : theme.colors.text.primary};
          background: ${it.isDisabled
            ? 'transparent'
            : isHighlighted
              ? highlightedBg
              : isSelected
                ? selectedBg
                : 'transparent'};
          font-weight: ${isSelected ? 500 : 400};
          transition:
            background-color 100ms ease,
            color 100ms ease;
          @media (prefers-reduced-motion: reduce) {
            transition: none;
          }
        `}
      >
        <span
          css={css`
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 0;
            flex: 1;
          `}
        >
          <span
            css={css`
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            `}
          >
            {it.label}
          </span>
          {it.description ? (
            <span
              css={css`
                font-size: 12px;
                line-height: 1.35;
                color: ${isSelected && resolvedColor !== 'default'
                  ? theme.colors[resolvedColor][600]
                  : theme.colors.text.muted};
                opacity: 0.85;
                font-weight: 400;
              `}
            >
              {it.description}
            </span>
          ) : null}
        </span>
        {isSelected ? (
          <svg
            aria-hidden
            focusable="false"
            width={13}
            height={13}
            viewBox="0 0 16 16"
            fill="none"
            css={css`
              color: ${resolvedColor === 'default'
                ? theme.colors.focus
                : theme.colors[resolvedColor][500]};
              flex-shrink: 0;
            `}
          >
            <path
              d="M3 8.5L6.5 12L13 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </li>
    );
  };

  const showEmpty = filteredItems.length === 0;
  const defaultSearchPlaceholder = searchPlaceholder ?? 'Search…';
  const defaultEmptyMessage = emptyMessage ?? 'No results';

  const isEmptyValue = !current;
  const triggerLabel: ReactNode = currentItem?.label ?? placeholder ?? '';

  const activeDescendantId =
    open && highlight >= 0 && highlight < filteredItems.length
      ? `${listboxId}-opt-${highlight}`
      : undefined;

  const onTriggerClick = useCallback(() => {
    if (isDisabled) return;
    // 已展开 + 可搜索时：点击 trigger 不应折叠面板，而是把焦点送回搜索框。
    if (open) {
      if (isSearchable) {
        focusSearchInput();
        return;
      }
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [focusSearchInput, isDisabled, isSearchable, open]);

  const onSearchAreaMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      // 点击搜索图标 / padding 等"非 input"区域时也聚焦到输入框，
      // 同时阻止默认 mousedown 把焦点转移到外层 div。
      const target = e.target as Node;
      if (searchInputRef.current?.contains(target)) return;
      e.preventDefault();
      focusSearchInput();
    },
    [focusSearchInput],
  );

  return (
    <div
      ref={wrapperRef}
      data-variant={variant}
      data-color={resolvedColor}
      data-size={size}
      data-disabled={isDisabled || undefined}
      data-invalid={isInvalid || undefined}
      data-open={open || undefined}
      className={className}
      style={style}
      css={[wrapperCss, variantStyles]}
    >
      <button
        {...rest}
        ref={mergeRefs(ref, triggerRef)}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={activeDescendantId}
        aria-invalid={ariaInvalidProp ?? (isInvalid || undefined)}
        aria-required={ariaRequiredProp ?? (isRequired || undefined)}
        aria-describedby={ariaDescribedByProp}
        aria-labelledby={ariaLabelledByProp}
        aria-disabled={isDisabled || undefined}
        disabled={isDisabled}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
        css={triggerCss}
      >
        {startContent ? (
          <span aria-hidden css={adornmentCss}>
            {startContent}
          </span>
        ) : null}
        <span
          data-empty={isEmptyValue || undefined}
          css={css`
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: ${isEmptyValue ? theme.colors.text.muted : 'inherit'};
          `}
        >
          {triggerLabel}
        </span>
        <span aria-hidden css={adornmentCss}>
          {endContent ?? <ChevronIcon sizePx={iconSizePx} open={open} />}
        </span>
      </button>

      {name ? <input type="hidden" name={name} value={current} /> : null}

      {open && popoverRect && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={popoverRef}
              css={popoverCss}
              style={{
                ...(popoverRect.placement === 'bottom'
                  ? { top: popoverRect.offset + 6 }
                  : { bottom: popoverRect.offset + 6 }),
                left: popoverRect.left,
                minWidth: popoverRect.width,
                maxHeight: popoverRect.maxHeight,
              }}
              data-timeui-select-popover=""
              data-placement={popoverRect.placement}
              data-variant={variant}
              data-color={resolvedColor}
            >
              {isSearchable ? (
                <div css={searchCss} onMouseDown={onSearchAreaMouseDown}>
                  <svg
                    aria-hidden
                    focusable="false"
                    width={13}
                    height={13}
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
                    <path
                      d="m11 11 3 3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    role="searchbox"
                    value={search}
                    placeholder={defaultSearchPlaceholder}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                    aria-controls={listboxId}
                    aria-autocomplete="list"
                    // 每次 popover 打开都会重新挂载 input，autoFocus 因此在每次
                    // 打开时同步聚焦——比 useEffect+RAF 更可靠，且测试可用。
                    autoFocus
                  />
                </div>
              ) : null}

              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                aria-labelledby={ariaLabelledByProp}
                tabIndex={-1}
                css={listCss}
              >
                {showEmpty ? (
                  <li role="presentation" css={emptyCss}>
                    {defaultEmptyMessage}
                  </li>
                ) : (
                  filteredItems.map(renderOption)
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
});

(SelectControl as unknown as { displayName: string }).displayName = 'SelectControl';

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(props, ref) {
  const {
    label,
    description,
    errorMessage,
    isRequired,
    isInvalid,
    isDisabled,
    id,
    className,
    style,
    ...controlProps
  } = props;

  const hasFormFieldChrome =
    label !== undefined || description !== undefined || errorMessage !== undefined;

  if (!hasFormFieldChrome) {
    return (
      <SelectControl
        ref={ref}
        id={id}
        className={className}
        style={style}
        isRequired={isRequired}
        isInvalid={isInvalid}
        isDisabled={isDisabled}
        {...controlProps}
      />
    );
  }

  return (
    <FormField
      label={label}
      description={description}
      errorMessage={errorMessage}
      isRequired={isRequired}
      isInvalid={isInvalid}
      isDisabled={isDisabled}
      id={id}
      className={className}
      style={style}
    >
      {(<SelectControl ref={ref} {...controlProps} />) as ReactElement}
    </FormField>
  );
});

(Select as unknown as { displayName: string }).displayName = 'Select';
