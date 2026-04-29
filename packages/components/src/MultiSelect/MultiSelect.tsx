/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-29
 * @description 实现 MultiSelect 多选下拉：trigger 用 Tag 做 chip 回显，
 *              dropdown 用 listbox + 自绘 checkbox 指示器，骨架镜像 Select。
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
  type CSSProperties,
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
import { Tag } from '../Tag';
import type { TagColor, TagSize } from '../Tag/Tag.types';
import { MULTI_SELECT_OPTION_TAG } from './MultiSelectOption';
import { MULTI_SELECT_OPT_GROUP_TAG } from './MultiSelectOptGroup';
import type {
  MultiSelectItem,
  MultiSelectOptGroupProps,
  MultiSelectOptionProps,
  MultiSelectProps,
  MultiSelectRadius,
  MultiSelectSize,
} from './MultiSelect.types';

/* -------------------------------------------------------------------------- */
/*  Constants & helpers                                                        */
/* -------------------------------------------------------------------------- */

const sizeRadiusMap: Record<MultiSelectSize, MultiSelectRadius> = {
  xs: 'sm',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'lg',
};

/** trigger size → Tag chip size 的映射；保证 chip 不顶满 trigger 高度。 */
const chipSizeMap: Record<MultiSelectSize, TagSize> = {
  xs: 'xs',
  sm: 'sm',
  md: 'sm',
  lg: 'md',
  xl: 'lg',
};

/** option 指示器走 Checkbox token：xs→xs，xl→xl，lg→md，其余→sm。 */
const indicatorSizeMap: Record<MultiSelectSize, 'xs' | 'sm' | 'md' | 'xl'> = {
  xs: 'xs',
  sm: 'sm',
  md: 'sm',
  lg: 'md',
  xl: 'xl',
};

const ChevronIcon = ({ sizePx }: { sizePx: number }) => (
  <svg aria-hidden focusable="false" width={sizePx} height={sizePx} viewBox="0 0 12 12" fill="none">
    <path
      d="M3 4.5L6 7.5L9 4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClearIcon = ({ sizePx }: { sizePx: number }) => (
  <svg aria-hidden focusable="false" width={sizePx} height={sizePx} viewBox="0 0 12 12" fill="none">
    <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SearchIcon = () => (
  <svg aria-hidden focusable="false" width={13} height={13} viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CheckIcon = ({ sizePx }: { sizePx: number }) => (
  <svg aria-hidden focusable="false" width={sizePx} height={sizePx} viewBox="0 0 16 16" fill="none">
    <path
      d="M3 8.5L6.5 12L13 5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * 把任意 ReactNode label 退化为 string，用于 aria-label / type-ahead 匹配。
 * 对纯文本/数字直接返回；对 ReactElement 递归提取 children；对其它返回空串。
 */
function labelToString(label: ReactNode): string {
  if (label == null || typeof label === 'boolean') return '';
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

/** Tag.color 的枚举与 FieldColor 不一致：'default' → 'neutral'。 */
function toTagColor(
  color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger',
): TagColor {
  return color === 'default' ? 'neutral' : color;
}

/** trigger 内容区上下 padding：复用 multiSelectTokens.triggerPaddingY。 */
function getTriggerPaddingY(theme: ReturnType<typeof useTheme>, size: MultiSelectSize): string {
  return theme.components.multiSelect.triggerPaddingY[size];
}

interface ParsedChildren {
  /** 扁平有序的 items，用于 listbox 渲染。 */
  items: MultiSelectItem[];
  /** group key → label；保留 declaration order 给 heading 渲染。 */
  groupLabels: Map<string, ReactNode>;
}

/**
 * 把 children 推导成 items + group label 表。
 * 支持两种形态：
 *   - 直接放 `<MultiSelectOption>`（无分组）
 *   - 用 `<MultiSelectOptGroup label>` 包一组 `<MultiSelectOption>`
 * 未识别的子节点在 dev 抛 warning（与 Select 同款）。
 */
function childrenToItems(children: ReactNode): ParsedChildren {
  const items: MultiSelectItem[] = [];
  const groupLabels = new Map<string, ReactNode>();

  const visitOption = (child: ReactElement<MultiSelectOptionProps>, group: string | undefined) => {
    const props = child.props;
    if (!props || typeof props.value === 'undefined') {
      if (isDev) {
        console.warn('[TimeUI] MultiSelect: skipping <MultiSelectOption> without `value` prop.');
      }
      return;
    }
    items.push({
      value: String(props.value),
      label: props.children as ReactNode,
      isDisabled: props.isDisabled,
      description: props.description,
      group,
    });
  };

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const type = child.type as unknown as {
      __timeuiTag?: symbol;
      displayName?: string;
      name?: string;
    };

    const isOption =
      type?.__timeuiTag === MULTI_SELECT_OPTION_TAG ||
      type?.displayName === 'MultiSelectOption' ||
      type?.name === 'MultiSelectOption';

    const isOptGroup =
      type?.__timeuiTag === MULTI_SELECT_OPT_GROUP_TAG ||
      type?.displayName === 'MultiSelectOptGroup' ||
      type?.name === 'MultiSelectOptGroup';

    if (isOption) {
      visitOption(child as ReactElement<MultiSelectOptionProps>, undefined);
      return;
    }

    if (isOptGroup) {
      const groupProps = (child as ReactElement<MultiSelectOptGroupProps>).props;
      const groupKey = labelToString(groupProps.label) || `group-${groupLabels.size}`;
      if (!groupLabels.has(groupKey)) {
        groupLabels.set(groupKey, groupProps.label);
      }
      Children.forEach(groupProps.children, (sub) => {
        if (!isValidElement(sub)) return;
        const subType = sub.type as unknown as { __timeuiTag?: symbol; displayName?: string };
        const subIsOption =
          subType?.__timeuiTag === MULTI_SELECT_OPTION_TAG ||
          subType?.displayName === 'MultiSelectOption';
        if (!subIsOption) {
          if (isDev) {
            console.warn(
              '[TimeUI] MultiSelect: <MultiSelectOptGroup> only accepts <MultiSelectOption> children.',
            );
          }
          return;
        }
        visitOption(sub as ReactElement<MultiSelectOptionProps>, groupKey);
      });
      return;
    }

    // 兜底：有 value 也认（兼容 RSC / 打包后 displayName 丢失）
    const props = (child as ReactElement<MultiSelectOptionProps>).props;
    if (props && typeof props.value !== 'undefined') {
      visitOption(child as ReactElement<MultiSelectOptionProps>, undefined);
      return;
    }

    if (isDev) {
      console.warn(
        '[TimeUI] MultiSelect: only `<MultiSelectOption>` / `<MultiSelectOptGroup>` children are supported. Skipping unknown child.',
      );
    }
  });

  return { items, groupLabels };
}

/** items 数组形式的分组化：按 `group` 字段聚合，保留首次出现顺序；无 group 项进默认桶（key=''）。 */
function partitionByGroup(items: MultiSelectItem[]): {
  ordered: Array<{ group: string; label?: ReactNode; items: MultiSelectItem[] }>;
} {
  const buckets = new Map<string, { group: string; label?: ReactNode; items: MultiSelectItem[] }>();
  items.forEach((it) => {
    const key = it.group ?? '';
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { group: key, label: key ? key : undefined, items: [] };
      buckets.set(key, bucket);
    }
    bucket.items.push(it);
  });
  return { ordered: Array.from(buckets.values()) };
}

function cssLength(v: number | string | undefined, fallback: string): string {
  if (v === undefined) return fallback;
  return typeof v === 'number' ? `${v}px` : v;
}

/* -------------------------------------------------------------------------- */
/*  Control implementation                                                     */
/* -------------------------------------------------------------------------- */

const MultiSelectControl = forwardRef<HTMLDivElement, MultiSelectProps>(
  function MultiSelectControl(props, ref) {
    const {
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
      isReadOnly = false,
      isRequired = false,
      isLoading = false,
      isSearchable = false,
      searchPlaceholder,
      filterOption,
      emptyMessage,
      loadingMessage,
      isClearable = false,
      clearButtonTabIndex = -1,
      clearOnEsc = false,
      onClear,
      closeOnSelect = false,
      maxSelectedCount = Infinity,
      maxTagCount = 'responsive',
      showSelectAllInToolbar = false,
      hideSelectedInList = false,
      tagRender,
      optionRender,
      maxListHeight = 280,
      placement = 'auto',
      className,
      style,
      id: idProp,
      name,
      'aria-invalid': ariaInvalidProp,
      'aria-describedby': ariaDescribedByProp,
      'aria-required': ariaRequiredProp,
      'aria-labelledby': ariaLabelledByProp,
      'aria-label': ariaLabelProp,
      ...rest
    } = props;

    const theme = useTheme();
    const ms = theme.components.multiSelect;

    if (isDev && items && children) {
      console.warn(
        '[TimeUI] MultiSelect: received both `items` and `children`. `items` wins; children are ignored.',
      );
    }

    const parsed = useMemo<ParsedChildren>(() => {
      if (items) {
        // items 形态下 group label 回退为 group key 本身
        const labels = new Map<string, ReactNode>();
        items.forEach((it) => {
          if (it.group && !labels.has(it.group)) labels.set(it.group, it.group);
        });
        return { items, groupLabels: labels };
      }
      return childrenToItems(children);
    }, [items, children]);

    const sourceItems = parsed.items;

    const [rawValue, setRawValue] = useControllableState<string[]>({
      value,
      defaultValue: (defaultValue as string[]) ?? [],
      onChange,
      name: 'MultiSelect',
    });
    const currentValue = rawValue ?? [];

    /** value -> item 反查表，便于按外部传入的 value 顺序渲染 chip。 */
    const itemByValue = useMemo(() => {
      const m = new Map<string, MultiSelectItem>();
      sourceItems.forEach((it) => m.set(it.value, it));
      return m;
    }, [sourceItems]);

    const selectedItems = useMemo(
      () => currentValue.map<MultiSelectItem>((v) => itemByValue.get(v) ?? { value: v, label: v }),
      [currentValue, itemByValue],
    );

    /* ---------------- open / search / highlight ---------------- */

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlight, setHighlight] = useState(-1);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const autoId = useId();
    const triggerId = idProp ?? `timeui-multiselect-${autoId}`;
    const listboxId = `${triggerId}-listbox`;

    /* ---------------- filtering & visibility ---------------- */

    const filterFn = useCallback(
      (input: string, item: MultiSelectItem): boolean => {
        if (filterOption) return filterOption(input, item);
        return labelToString(item.label).toLowerCase().includes(input.toLowerCase());
      },
      [filterOption],
    );

    /** 在 list 中实际可见的 items：`hideSelectedInList` + 搜索过滤共同决定。 */
    const visibleItems = useMemo(() => {
      let arr = sourceItems;
      if (hideSelectedInList) {
        arr = arr.filter((it) => !currentValue.includes(it.value));
      }
      if (isSearchable && search) arr = arr.filter((it) => filterFn(search, it));
      return arr;
    }, [sourceItems, hideSelectedInList, isSearchable, search, filterFn, currentValue]);

    /** 渲染顺序的扁平结构：包含 group heading 占位，便于 keyboard / aria-activedescendant 对位。 */
    interface FlatRow {
      kind: 'heading' | 'option';
      key: string;
      /** option 行有 item / index（index 为该 item 在 visibleItems 中的位置）。 */
      item?: MultiSelectItem;
      index?: number;
      label?: ReactNode;
    }

    const flatRows = useMemo<FlatRow[]>(() => {
      const rows: FlatRow[] = [];
      const partition = partitionByGroup(visibleItems);
      let optIndex = 0;
      partition.ordered.forEach((bucket) => {
        if (bucket.group) {
          const headingLabel = parsed.groupLabels.get(bucket.group) ?? bucket.label ?? bucket.group;
          rows.push({
            kind: 'heading',
            key: `__heading__${bucket.group}`,
            label: headingLabel,
          });
        }
        bucket.items.forEach((it) => {
          rows.push({ kind: 'option', key: it.value, item: it, index: optIndex });
          optIndex += 1;
        });
      });
      return rows;
    }, [visibleItems, parsed.groupLabels]);

    /** 仅 option 的扁平数组——index 与 flatRows 中 option 行的 index 字段对齐。 */
    const visibleOptionItems = useMemo(
      () => flatRows.filter((r) => r.kind === 'option').map((r) => r.item!),
      [flatRows],
    );

    /** 当前可见且未 disabled 的可选项数量（用于 toolbar 计数 + select-all）。 */
    const visibleSelectableItems = useMemo(
      () => visibleOptionItems.filter((it) => !it.isDisabled),
      [visibleOptionItems],
    );

    /* ---------------- popover open/close, refocus, lifecycle ---------------- */

    useEffect(() => {
      if (!open) return;
      const onDocMouseDown = (e: MouseEvent) => {
        const target = e.target as Node;
        if (wrapperRef.current?.contains(target)) return;
        if (popoverRef.current?.contains(target)) return;
        setOpen(false);
      };
      document.addEventListener('mousedown', onDocMouseDown);
      return () => document.removeEventListener('mousedown', onDocMouseDown);
    }, [open]);

    useEffect(() => {
      if (!open) {
        setSearch('');
        return;
      }
      // 打开时高亮第一个未 disabled 项
      const idx = visibleOptionItems.findIndex((it) => !it.isDisabled);
      setHighlight(idx >= 0 ? idx : -1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
      if (!open) return;
      if (highlight >= visibleOptionItems.length) {
        setHighlight(visibleOptionItems.findIndex((it) => !it.isDisabled));
      }
    }, [visibleOptionItems, highlight, open]);

    useEffect(() => {
      if (!open || highlight < 0) return;
      const list = listRef.current;
      if (!list) return;
      const el = list.querySelector<HTMLLIElement>(`[data-opt-index="${highlight}"]`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest' });
      }
    }, [highlight, open]);

    /* ---------------- popover positioning ---------------- */

    const [popoverRect, setPopoverRect] = useState<{
      placement: 'bottom' | 'top';
      offset: number;
      left: number;
      width: number;
      maxHeight: number;
    } | null>(null);

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
        const gap = 6;
        const safeMargin = 8;
        const userMaxPx = typeof maxListHeight === 'number' ? maxListHeight : 280;

        const availableBelow = Math.max(0, vh - r.bottom - gap - safeMargin);
        const availableAbove = Math.max(0, r.top - gap - safeMargin);

        let chosen: 'bottom' | 'top';
        if (placement === 'top') chosen = 'top';
        else if (placement === 'bottom') chosen = 'bottom';
        else
          chosen =
            availableBelow >= userMaxPx || availableBelow >= availableAbove ? 'bottom' : 'top';

        const maxHeight = Math.max(120, chosen === 'bottom' ? availableBelow : availableAbove);

        setPopoverRect({
          placement: chosen,
          offset: chosen === 'bottom' ? r.bottom : vh - r.top,
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
    }, [open, maxListHeight, placement]);

    /* ---------------- value mutation helpers ---------------- */

    const commitValue = useCallback(
      (next: string[]) => {
        // 去重：保留首次出现顺序
        const dedup: string[] = [];
        const seen = new Set<string>();
        next.forEach((v) => {
          if (!seen.has(v)) {
            seen.add(v);
            dedup.push(v);
          }
        });
        setRawValue(dedup);
      },
      [setRawValue],
    );

    const toggleValue = useCallback(
      (val: string) => {
        if (isDisabled || isReadOnly) return;
        const target = sourceItems.find((it) => it.value === val);
        if (target?.isDisabled) return;
        const isSelected = currentValue.includes(val);
        if (isSelected) {
          commitValue(currentValue.filter((v) => v !== val));
        } else {
          if (currentValue.length >= maxSelectedCount) return;
          commitValue([...currentValue, val]);
        }
      },
      [currentValue, commitValue, isDisabled, isReadOnly, sourceItems, maxSelectedCount],
    );

    const removeValue = useCallback(
      (val: string) => {
        if (isDisabled || isReadOnly) return;
        commitValue(currentValue.filter((v) => v !== val));
      },
      [currentValue, commitValue, isDisabled, isReadOnly],
    );

    const clearAll = useCallback(() => {
      if (isDisabled || isReadOnly) return;
      commitValue([]);
      onClear?.();
    }, [commitValue, isDisabled, isReadOnly, onClear]);

    /* ---------------- toolbar select-all behavior ---------------- */

    /** 当前可见可选项是否已全部 selected。 */
    const allVisibleSelected = useMemo(() => {
      if (visibleSelectableItems.length === 0) return false;
      return visibleSelectableItems.every((it) => currentValue.includes(it.value));
    }, [visibleSelectableItems, currentValue]);

    const onSelectAllToggle = useCallback(() => {
      if (isDisabled || isReadOnly) return;
      if (allVisibleSelected) {
        // 撤销：仅移除"当前可见"的；不可见的 selected 保留
        const visibleSet = new Set(visibleSelectableItems.map((it) => it.value));
        commitValue(currentValue.filter((v) => !visibleSet.has(v)));
      } else {
        // 合并：当前 + 可见可选项；遵守 maxSelectedCount
        const merged = [...currentValue];
        for (const it of visibleSelectableItems) {
          if (merged.length >= maxSelectedCount) break;
          if (!merged.includes(it.value)) merged.push(it.value);
        }
        commitValue(merged);
      }
    }, [
      allVisibleSelected,
      visibleSelectableItems,
      currentValue,
      commitValue,
      isDisabled,
      isReadOnly,
      maxSelectedCount,
    ]);

    /* ---------------- type-ahead buffer ---------------- */

    const typeAheadBufferRef = useRef('');
    const typeAheadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTypeAhead = useCallback(
      (char: string) => {
        if (typeAheadTimerRef.current) clearTimeout(typeAheadTimerRef.current);
        typeAheadBufferRef.current += char.toLowerCase();
        const prefix = typeAheadBufferRef.current;
        const idx = visibleOptionItems.findIndex(
          (it) => !it.isDisabled && labelToString(it.label).toLowerCase().startsWith(prefix),
        );
        if (idx >= 0) setHighlight(idx);
        typeAheadTimerRef.current = setTimeout(() => {
          typeAheadBufferRef.current = '';
        }, ms.typeAheadTimeoutMs);
      },
      [visibleOptionItems, ms.typeAheadTimeoutMs],
    );

    useEffect(
      () => () => {
        if (typeAheadTimerRef.current) clearTimeout(typeAheadTimerRef.current);
      },
      [],
    );

    /* ---------------- keyboard handling ---------------- */

    const moveHighlight = useCallback(
      (dir: 1 | -1) => {
        if (visibleOptionItems.length === 0) return;
        let i = highlight < 0 ? (dir === 1 ? -1 : visibleOptionItems.length) : highlight;
        for (let step = 0; step < visibleOptionItems.length; step += 1) {
          i = (i + dir + visibleOptionItems.length) % visibleOptionItems.length;
          if (!visibleOptionItems[i]!.isDisabled) {
            setHighlight(i);
            return;
          }
        }
      },
      [visibleOptionItems, highlight],
    );

    const closeAndRefocus = useCallback(() => {
      setOpen(false);
      triggerRef.current?.focus();
    }, []);

    const focusSearchInput = useCallback(() => {
      searchInputRef.current?.focus();
    }, []);

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
          const i = visibleOptionItems.findIndex((it) => !it.isDisabled);
          if (i >= 0) setHighlight(i);
          return true;
        }
        if (key === 'End') {
          for (let i = visibleOptionItems.length - 1; i >= 0; i -= 1) {
            if (!visibleOptionItems[i]!.isDisabled) {
              setHighlight(i);
              break;
            }
          }
          return true;
        }
        if (key === 'Escape') {
          closeAndRefocus();
          return true;
        }
        if (key === 'Tab') {
          setOpen(false);
          return false; // 让浏览器接管 Tab
        }
        return false;
      },
      [open, moveHighlight, visibleOptionItems, closeAndRefocus],
    );

    const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (isDisabled) return;

      // closed + Backspace：删最后一项
      if (!open && e.key === 'Backspace') {
        if (currentValue.length > 0 && !isReadOnly) {
          e.preventDefault();
          commitValue(currentValue.slice(0, -1));
        }
        return;
      }

      // closed + clearOnEsc：Esc 清空
      if (!open && e.key === 'Escape' && clearOnEsc && currentValue.length > 0) {
        e.preventDefault();
        clearAll();
        return;
      }

      // open 状态下 Enter / Space：toggle 当前高亮项
      if (open && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        const it = visibleOptionItems[highlight];
        if (it && !it.isDisabled) {
          toggleValue(it.value);
          if (closeOnSelect) closeAndRefocus();
        }
        return;
      }

      // closed + 可打字字符 + isSearchable → 打开 popover 并把字符送给 search
      if (!open && isSearchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setOpen(true);
        // 把字符当作 search 初值；DOM 在打开后下一个 tick 才挂载，故用 microtask
        const ch = e.key;
        Promise.resolve().then(() => {
          setSearch(ch);
          searchInputRef.current?.focus();
          searchInputRef.current?.setSelectionRange(1, 1);
        });
        e.preventDefault();
        return;
      }

      // closed + 普通字符 + 不可搜索 → type-ahead
      if (!open && !isSearchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleTypeAhead(e.key);
        return;
      }

      // open + 不可搜索 + 普通字符 → type-ahead
      if (open && !isSearchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        handleTypeAhead(e.key);
        return;
      }

      if (handleNavKey(e.key)) {
        e.preventDefault();
      }
    };

    const onSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
      // input 为空时 Backspace → 删最后一个 selected
      if (e.key === 'Backspace' && search === '' && currentValue.length > 0 && !isReadOnly) {
        e.preventDefault();
        commitValue(currentValue.slice(0, -1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const it = visibleOptionItems[highlight];
        if (it && !it.isDisabled) {
          toggleValue(it.value);
          if (closeOnSelect) closeAndRefocus();
        }
        return;
      }
      if (handleNavKey(e.key)) {
        e.preventDefault();
      }
    };

    /* ---------------- styles ---------------- */

    const resolvedColor = isInvalid ? 'danger' : color;
    const sizeTokens = theme.components.input[size];
    const radiusKey: MultiSelectRadius = radiusProp ?? sizeRadiusMap[size];
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
    const triggerPaddingY = getTriggerPaddingY(theme, size);

    const indicatorSizeKey = indicatorSizeMap[size];
    const indicatorSize = theme.components.checkbox[indicatorSizeKey].indicator;
    const indicatorIconSizePx = Math.max(8, Math.round(parseInt(indicatorSize, 10) * 0.7));

    /* ---------------- chip 显示数量（maxTagCount=number 路径） ---------------- */

    /**
     * 简化策略（spec 允许）：
     *   - maxTagCount: number → 直接 slice，超出渲染 +N
     *   - maxTagCount: 'responsive' → 在客户端按 trigger 宽度估算 chip 数；
     *     SSR / 第一帧默认显示全部，client mount 后用 ResizeObserver 收敛
     */
    const [responsiveLimit, setResponsiveLimit] = useState<number | null>(null);

    const measureLayerRef = useRef<HTMLDivElement>(null);

    useIsomorphicLayoutEffect(() => {
      if (maxTagCount !== 'responsive') {
        setResponsiveLimit(null);
        return;
      }
      const measureEl = measureLayerRef.current;
      const wrapperEl = wrapperRef.current;
      if (!measureEl || !wrapperEl) return;

      const recompute = () => {
        if (currentValue.length === 0) {
          setResponsiveLimit(null);
          return;
        }
        const wrapperWidth = wrapperEl.clientWidth;
        if (!wrapperWidth) {
          setResponsiveLimit(null);
          return;
        }
        const padX = parseInt(sizeTokens.paddingX, 10) * 2;
        // chevron + (clear if any) + safety
        const adornmentWidth =
          iconSizePx + 4 + (isClearable && currentValue.length > 0 ? iconSizePx + 4 : 0) + 12;
        const overflowWidth = iconSizePx + 24; // +N chip 估算宽度
        const budget = Math.max(0, wrapperWidth - padX - adornmentWidth - overflowWidth);

        const chipNodes = Array.from(
          measureEl.querySelectorAll<HTMLElement>('[data-measure-chip]'),
        );
        const gapPx = parseInt(ms.chipGap, 10) || 4;

        let used = 0;
        let count = 0;
        for (let i = 0; i < chipNodes.length; i += 1) {
          const w = chipNodes[i]!.offsetWidth + (count > 0 ? gapPx : 0);
          if (used + w > budget) break;
          used += w;
          count += 1;
        }

        if (count >= currentValue.length) {
          // 全部能塞下：检测一下不预留 +N 的情况是否能塞下全部
          const fullBudget = Math.max(0, wrapperWidth - padX - adornmentWidth);
          let used2 = 0;
          let cnt2 = 0;
          for (let i = 0; i < chipNodes.length; i += 1) {
            const w = chipNodes[i]!.offsetWidth + (cnt2 > 0 ? gapPx : 0);
            if (used2 + w > fullBudget) break;
            used2 += w;
            cnt2 += 1;
          }
          if (cnt2 >= currentValue.length) {
            setResponsiveLimit(null);
            return;
          }
        }

        setResponsiveLimit(Math.max(1, count));
      };

      recompute();

      let ro: ResizeObserver | undefined;
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => recompute());
        ro.observe(wrapperEl);
        ro.observe(measureEl);
      } else {
        window.addEventListener('resize', recompute);
      }
      return () => {
        if (ro) ro.disconnect();
        else window.removeEventListener('resize', recompute);
      };
    }, [maxTagCount, currentValue, isClearable, ms.chipGap, sizeTokens.paddingX, iconSizePx]);

    const effectiveTagLimit: number =
      maxTagCount === 'responsive'
        ? (responsiveLimit ?? currentValue.length)
        : Math.max(0, maxTagCount);

    const visibleChipItems =
      effectiveTagLimit >= currentValue.length
        ? selectedItems
        : selectedItems.slice(0, effectiveTagLimit);
    const overflowChipItems =
      effectiveTagLimit >= currentValue.length ? [] : selectedItems.slice(effectiveTagLimit);

    /* ---------------- css blocks ---------------- */

    const wrapperCss = css`
      position: relative;
      display: inline-flex;
      box-sizing: border-box;
      width: ${isFullWidth ? '100%' : 'auto'};
      min-height: ${sizeTokens.height};
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
      margin: 0;
      padding: ${triggerPaddingY} ${sizeTokens.paddingX};
      gap: ${sizeTokens.gap};
      font: inherit;
      color: inherit;
      line-height: inherit;
      text-align: start;
      display: inline-flex;
      align-items: center;
      ${isDisabled ? 'cursor: not-allowed;' : 'cursor: pointer;'}
    `;

    const chipsAreaCss = css`
      flex: 1;
      min-width: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: ${ms.chipGap};
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

    const adornmentButtonCss = css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 0;
      width: ${iconSizePx + 4}px;
      height: ${iconSizePx + 4}px;
      border: 0;
      border-radius: ${theme.componentRadius.sm};
      background: transparent;
      color: ${theme.colors.text.muted};
      cursor: pointer;
      flex-shrink: 0;
      transition:
        color ${theme.motion.duration.normal},
        background-color ${theme.motion.duration.normal};

      &:hover:not(:disabled) {
        color: ${theme.colors.text.primary};
      }
      &:focus-visible {
        outline: none;
        box-shadow: inset 0 0 0 ${theme.borders.width.thick} ${theme.colors.focus};
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

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
      animation: timeui-multiselect-pop ${theme.motion.duration.fast}
        ${theme.motion.easing.easeInOut};
      &[data-placement='top'] {
        transform-origin: bottom center;
        animation-name: timeui-multiselect-pop-up;
      }
      @keyframes timeui-multiselect-pop {
        from {
          opacity: 0;
          transform: translateY(-4px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @keyframes timeui-multiselect-pop-up {
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

    const toolbarCss = css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      height: ${ms.toolbarHeight};
      padding: ${ms.toolbarPaddingY} ${ms.toolbarPaddingX};
      border-bottom: 1px solid ${theme.colors.border.subtle ?? theme.colors.border.default};
      font-size: ${ms.toolbarFontSize};
      color: ${theme.colors.text.muted};
    `;

    const toolbarButtonCss = css`
      appearance: none;
      background: transparent;
      border: 0;
      padding: 0 4px;
      font: inherit;
      color: ${theme.colors.text.link ??
      theme.colors[resolvedColor === 'default' ? 'primary' : resolvedColor][500]};
      font-weight: 500;
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
      &:focus-visible {
        outline: 2px solid ${theme.colors.focus};
        outline-offset: 2px;
        border-radius: ${theme.componentRadius.sm};
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        text-decoration: none;
      }
    `;

    const listCss = css`
      list-style: none;
      margin: 0;
      padding: 4px;
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

    const groupHeadingCss = css`
      padding: ${ms.optGroupHeadingPaddingTop} ${ms.optGroupHeadingPaddingX}
        ${ms.optGroupHeadingPaddingBottom};
      font-size: ${ms.optGroupHeadingFontSize};
      font-weight: ${ms.optGroupHeadingFontWeight};
      letter-spacing: ${ms.optGroupHeadingLetterSpacing};
      color: ${theme.colors.text.muted};
      text-transform: uppercase;
      line-height: 1;
      margin: 0;

      &:not(:first-of-type) {
        margin-top: 4px;
      }
    `;

    /* ---------------- render helpers ---------------- */

    const placeholderColor = theme.colors.text.muted;
    const isEmptyValue = currentValue.length === 0;

    const showClearButton = isClearable && currentValue.length > 0 && !isDisabled && !isReadOnly;

    const tagColor: TagColor = toTagColor(color);

    const renderChip = (item: MultiSelectItem) => {
      const onRemove = () => removeValue(item.value);
      if (tagRender) {
        return tagRender(item, { onRemove, isDisabled: isDisabled || isReadOnly });
      }
      const labelText = labelToString(item.label) || item.value;
      return (
        <span
          // 阻止 mousedown 冒泡到 trigger 触发 toggle —— chip 本身不应改变 popover 状态
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          css={css`
            max-width: ${ms.chipMaxWidth};
            display: inline-flex;
            min-width: 0;

            > [data-color] {
              max-width: 100%;
              & > span:not([aria-hidden]) {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 100%;
              }
            }
          `}
        >
          <Tag
            size={chipSizeMap[size]}
            variant="soft"
            color={tagColor}
            shape="rounded"
            isClosable
            isDisabled={isDisabled || isReadOnly}
            onClose={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            closeButtonTabIndex={-1}
            closeButtonAriaLabel={`Remove ${labelText}`}
          >
            {item.label ?? item.value}
          </Tag>
        </span>
      );
    };

    const renderOverflowChip = () => {
      if (overflowChipItems.length === 0) return null;
      const hiddenLabels = overflowChipItems
        .map((it) => labelToString(it.label) || it.value)
        .join(', ');
      return (
        <span
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          title={hiddenLabels}
          aria-label={`+${overflowChipItems.length} more: ${hiddenLabels}`}
        >
          <Tag size={chipSizeMap[size]} variant="outline" color="neutral" shape="rounded">
            +{overflowChipItems.length}
          </Tag>
        </span>
      );
    };

    const renderOption = (it: MultiSelectItem, idx: number) => {
      const isSelected = currentValue.includes(it.value);
      const isHighlighted = idx === highlight;
      const reachedLimit = !isSelected && currentValue.length >= maxSelectedCount;
      const optDisabled = it.isDisabled || reachedLimit;
      const indicatorBorderColor = isInvalid
        ? theme.colors.status.danger
        : isSelected
          ? theme.colors[resolvedColor][500]
          : theme.colors.border.strong;
      const indicatorBg = isSelected ? theme.colors[resolvedColor][500] : 'transparent';
      const indicatorFg = theme.colors[resolvedColor].foreground;

      const customRendered =
        optionRender?.(it, {
          isSelected,
          isHighlighted,
          isDisabled: !!optDisabled,
        }) ?? null;

      return (
        <li
          key={it.value}
          data-opt-index={idx}
          id={`${listboxId}-opt-${idx}`}
          role="option"
          aria-selected={isSelected}
          aria-disabled={optDisabled || undefined}
          onMouseEnter={() => !optDisabled && setHighlight(idx)}
          onMouseDown={(e) => {
            e.preventDefault();
            if (optDisabled) return;
            toggleValue(it.value);
            if (closeOnSelect) closeAndRefocus();
          }}
          css={css`
            display: flex;
            align-items: center;
            gap: ${ms.optionIndicatorGap};
            padding: ${ms.optionPaddingY} ${ms.optionPaddingX};
            margin: 0;
            border-radius: ${ms.optionRadius};
            cursor: ${optDisabled ? 'not-allowed' : 'pointer'};
            font-size: 13px;
            line-height: 1.35;
            color: ${optDisabled ? theme.colors.text.disabled : theme.colors.text.primary};
            background: ${isHighlighted && !optDisabled
              ? (theme.colors.bg.muted ?? theme.colors.bg.sunken)
              : 'transparent'};
            opacity: ${optDisabled ? 0.6 : 1};
            transition:
              background-color ${theme.motion.duration.fast} ${theme.motion.easing.easeInOut},
              color ${theme.motion.duration.fast} ${theme.motion.easing.easeInOut};
            outline: ${isHighlighted && !optDisabled ? `2px solid ${theme.colors.focus}` : 'none'};
            outline-offset: -2px;
            @media (prefers-reduced-motion: reduce) {
              transition: none;
            }
          `}
        >
          {/* 自绘 checkbox 指示器：不实例化 <Checkbox> 以避免冗余 <input> */}
          <span
            aria-hidden="true"
            data-indicator=""
            css={css`
              flex-shrink: 0;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
              width: ${indicatorSize};
              height: ${indicatorSize};
              border: 1px solid ${indicatorBorderColor};
              background: ${indicatorBg};
              color: ${indicatorFg};
              border-radius: ${theme.componentRadius.sm};
              transition:
                background-color ${theme.motion.duration.normal},
                border-color ${theme.motion.duration.normal};
              @media (prefers-reduced-motion: reduce) {
                transition: none;
              }
            `}
          >
            {isSelected ? <CheckIcon sizePx={indicatorIconSizePx} /> : null}
          </span>
          {customRendered ?? (
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
                    color: ${theme.colors.text.muted};
                    opacity: 0.85;
                    font-weight: 400;
                  `}
                >
                  {it.description}
                </span>
              ) : null}
            </span>
          )}
        </li>
      );
    };

    /* ---------------- click handlers ---------------- */

    const onTriggerClick = useCallback(() => {
      if (isDisabled) return;
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
        const target = e.target as Node;
        if (searchInputRef.current?.contains(target)) return;
        e.preventDefault();
        focusSearchInput();
      },
      [focusSearchInput],
    );

    const activeDescendantId =
      open && highlight >= 0 && highlight < visibleOptionItems.length
        ? `${listboxId}-opt-${highlight}`
        : undefined;

    /* ---------------- render ---------------- */

    const defaultSearchPlaceholder = searchPlaceholder ?? 'Search…';
    const defaultEmptyMessage = emptyMessage ?? 'No results';
    const defaultLoadingMessage = loadingMessage ?? 'Loading…';

    const popoverPositionStyle: CSSProperties | null = popoverRect
      ? {
          ...(popoverRect.placement === 'bottom'
            ? { top: popoverRect.offset + 6 }
            : { bottom: popoverRect.offset + 6 }),
          left: popoverRect.left,
          minWidth: popoverRect.width,
          maxHeight: popoverRect.maxHeight,
        }
      : null;

    return (
      <div
        ref={wrapperRef}
        data-variant={variant}
        data-color={resolvedColor}
        data-size={size}
        data-disabled={isDisabled || undefined}
        data-readonly={isReadOnly || undefined}
        data-invalid={isInvalid || undefined}
        data-open={open || undefined}
        className={className}
        style={style}
        css={[wrapperCss, variantStyles]}
      >
        <div
          {...rest}
          ref={mergeRefs(ref, triggerRef)}
          id={triggerId}
          role="combobox"
          tabIndex={isDisabled ? -1 : 0}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={activeDescendantId}
          aria-invalid={ariaInvalidProp ?? (isInvalid || undefined)}
          aria-required={ariaRequiredProp ?? (isRequired || undefined)}
          aria-describedby={ariaDescribedByProp}
          aria-labelledby={ariaLabelledByProp}
          aria-label={ariaLabelProp}
          aria-disabled={isDisabled || undefined}
          aria-readonly={isReadOnly || undefined}
          onClick={isDisabled ? undefined : onTriggerClick}
          onKeyDown={isDisabled ? undefined : onTriggerKeyDown}
          css={triggerCss}
        >
          {startContent ? (
            <span aria-hidden css={adornmentCss}>
              {startContent}
            </span>
          ) : null}

          <span css={chipsAreaCss}>
            {isEmptyValue ? (
              <span
                css={css`
                  color: ${placeholderColor};
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                `}
              >
                {placeholder ?? ''}
              </span>
            ) : (
              <>
                {visibleChipItems.map((it) => (
                  <span key={it.value}>{renderChip(it)}</span>
                ))}
                {renderOverflowChip()}
              </>
            )}
          </span>

          {showClearButton ? (
            <button
              type="button"
              tabIndex={clearButtonTabIndex}
              aria-label="Clear selection"
              onMouseDown={(e) => {
                // 不让 mousedown 冒到 trigger 引发 toggle
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
                triggerRef.current?.focus();
              }}
              disabled={isDisabled || isReadOnly}
              data-slot="clear"
              css={[
                adornmentButtonCss,
                css`
                  margin-right: 2px;
                `,
              ]}
            >
              <ClearIcon sizePx={iconSizePx} />
            </button>
          ) : null}

          {endContent ? (
            <span aria-hidden css={adornmentCss}>
              {endContent}
            </span>
          ) : null}

          <span aria-hidden css={adornmentCss}>
            <span
              css={css`
                display: inline-flex;
                transform: ${open ? 'rotate(180deg)' : 'rotate(0)'};
                transition: transform ${theme.motion.duration.normal}
                  ${theme.motion.easing.easeInOut};
                @media (prefers-reduced-motion: reduce) {
                  transition: none;
                }
              `}
            >
              <ChevronIcon sizePx={iconSizePx} />
            </span>
          </span>
        </div>

        {/* responsive 测量层：渲染所有候选 chip 但不可见，用于估宽 */}
        {maxTagCount === 'responsive' && currentValue.length > 0 ? (
          <div
            ref={measureLayerRef}
            aria-hidden
            css={css`
              position: absolute;
              left: -9999px;
              top: 0;
              visibility: hidden;
              pointer-events: none;
              display: inline-flex;
              flex-wrap: nowrap;
              gap: ${ms.chipGap};
            `}
          >
            {selectedItems.map((it) => (
              <span key={`m-${it.value}`} data-measure-chip>
                <Tag
                  size={chipSizeMap[size]}
                  variant="soft"
                  color={tagColor}
                  shape="rounded"
                  isClosable
                  closeButtonTabIndex={-1}
                  closeButtonAriaLabel="Remove"
                >
                  {it.label ?? it.value}
                </Tag>
              </span>
            ))}
          </div>
        ) : null}

        {/* native form 提交：每个 value 一个 hidden input */}
        {name
          ? currentValue.map((v) => <input key={v} type="hidden" name={name} value={v} />)
          : null}

        {open && popoverRect && typeof document !== 'undefined'
          ? createPortal(
              <div
                ref={popoverRef}
                css={popoverCss}
                style={popoverPositionStyle ?? undefined}
                data-timeui-multiselect-popover=""
                data-placement={popoverRect.placement}
                data-variant={variant}
                data-color={resolvedColor}
              >
                {isSearchable ? (
                  <div css={searchCss} onMouseDown={onSearchAreaMouseDown}>
                    <SearchIcon />
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
                      autoFocus
                    />
                  </div>
                ) : null}

                {showSelectAllInToolbar ? (
                  <div css={toolbarCss}>
                    <span>
                      Selected {currentValue.length} / {visibleSelectableItems.length}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectAllToggle();
                      }}
                      disabled={isDisabled || isReadOnly}
                      css={toolbarButtonCss}
                    >
                      {allVisibleSelected ? 'Clear' : 'Select all'}
                    </button>
                  </div>
                ) : null}

                {isLoading ? (
                  <div
                    role="status"
                    aria-live="polite"
                    css={css`
                      padding: 14px 12px;
                      text-align: center;
                      color: ${theme.colors.text.muted};
                      font-size: 13px;
                    `}
                  >
                    {defaultLoadingMessage}
                  </div>
                ) : (
                  <ul
                    ref={listRef}
                    id={listboxId}
                    role="listbox"
                    aria-multiselectable="true"
                    aria-labelledby={ariaLabelledByProp}
                    tabIndex={-1}
                    css={listCss}
                  >
                    {flatRows.length === 0 ? (
                      <li role="presentation" css={emptyCss}>
                        {defaultEmptyMessage}
                      </li>
                    ) : (
                      flatRows.map((row) => {
                        if (row.kind === 'heading') {
                          return (
                            <li key={row.key} role="presentation" css={groupHeadingCss}>
                              {row.label}
                            </li>
                          );
                        }
                        return renderOption(row.item!, row.index!);
                      })
                    )}
                  </ul>
                )}
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  },
);

(MultiSelectControl as unknown as { displayName: string }).displayName = 'MultiSelectControl';

/* -------------------------------------------------------------------------- */
/*  Public component (wraps with FormField when label/description/error)       */
/* -------------------------------------------------------------------------- */

export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  function MultiSelect(props, ref) {
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
        <MultiSelectControl
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

    // div-based combobox 不能像 native button 那样从内容自动推断 accessible name；
    // 当 FormField 用 string label 走 htmlFor 路径时不会注入 aria-labelledby，
    // 这里兜底把 string label 透成 aria-label，保证 axe 不报 aria-input-field-name。
    const controlAriaLabel =
      controlProps['aria-label'] ?? (typeof label === 'string' ? label : undefined);

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
        {
          (
            <MultiSelectControl ref={ref} {...controlProps} aria-label={controlAriaLabel} />
          ) as ReactElement
        }
      </FormField>
    );
  },
);

(MultiSelect as unknown as { displayName: string }).displayName = 'MultiSelect';
