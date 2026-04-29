/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Table 组件：支持密度、斑马纹、排序、行选择、固定列、sticky header、加载/空态。
 *              数据驱动 (columns + data) 的受控/非受控双轨 API；行选择复用 Checkbox 组件。
 */

'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { css, useTheme } from '@emotion/react';
import { mergeRefs, useControllableState } from '../utils';
import { Checkbox } from '../Checkbox';
import type { CheckboxSize } from '../Checkbox/Checkbox.types';
import type {
  SortDescriptor,
  SortDirection,
  TableAlign,
  TableColumn,
  TableDensity,
  TableProps,
} from './Table.types';

// 表格选择列的 Checkbox 尺寸跟随 density 缩一档：
// 默认表格里 md 视觉偏大且与行高争空间，sm/xs 更贴合数据密集场景。
const selectionCheckboxSizeMap: Record<TableDensity, CheckboxSize> = {
  compact: 'xs',
  default: 'sm',
  comfortable: 'sm',
};

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function asLength(v: string | number | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

function getRowKey<T>(row: T, index: number, rowKey: TableProps<T>['rowKey']): string {
  if (typeof rowKey === 'function') return rowKey(row, index);
  if (typeof rowKey === 'string' || typeof rowKey === 'number') {
    const v = (row as Record<string, unknown>)[rowKey as string];
    if (v !== undefined && v !== null) return String(v);
  }
  // 兜底：无 rowKey 时尝试 row.id / row.key，再 fallback 到 index。
  const r = row as Record<string, unknown> | null;
  if (r && typeof r === 'object') {
    if (r.id !== undefined && r.id !== null) return String(r.id);
    if (r.key !== undefined && r.key !== null) return String(r.key);
  }
  return String(index);
}

function nextSortDirection(
  current: SortDescriptor | undefined,
  columnKey: string,
): SortDescriptor | undefined {
  if (!current || current.columnKey !== columnKey) {
    return { columnKey, direction: 'asc' };
  }
  if (current.direction === 'asc') return { columnKey, direction: 'desc' };
  return undefined;
}

function getCellContent<T>(column: TableColumn<T>, row: T, rowIndex: number): ReactNode {
  if (column.render) return column.render(row, rowIndex);
  const v = (row as Record<string, unknown>)[column.columnKey];
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return String(v);
  }
  // ReactNode 类型则原样返回；其他对象 fallback 到字符串以避免 React 报错。
  return v as ReactNode;
}

// ────────────────────────────────────────────────────────────
// 子组件：排序图标
// ────────────────────────────────────────────────────────────

const SortIcons = ({
  direction,
  inactiveColor,
  activeColor,
  size,
}: {
  direction: SortDirection | undefined;
  inactiveColor: string;
  activeColor: string;
  size: string;
}) => {
  const upColor = direction === 'asc' ? activeColor : inactiveColor;
  const downColor = direction === 'desc' ? activeColor : inactiveColor;
  return (
    <span
      aria-hidden
      data-sort-icons=""
      css={css`
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        line-height: 1;
        width: ${size};
        flex: none;
      `}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        focusable="false"
        css={css`
          margin-bottom: -2px;
        `}
      >
        <path
          d="M4 10L8 6L12 10"
          stroke={upColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        focusable="false"
        css={css`
          margin-top: -2px;
        `}
      >
        <path
          d="M4 6L8 10L12 6"
          stroke={downColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

// ────────────────────────────────────────────────────────────
// 子组件：Spinner（参考 SearchDialog）
// ────────────────────────────────────────────────────────────

const Spinner = ({ color }: { color: string }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    css={css`
      animation: timeui-table-spin 900ms linear infinite;
      @keyframes timeui-table-spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `}
  >
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ────────────────────────────────────────────────────────────
// 主组件
// ────────────────────────────────────────────────────────────

function TableInner<T>(props: TableProps<T>, forwardedRef: React.ForwardedRef<HTMLDivElement>) {
  const {
    columns,
    data,
    rowKey,
    density = 'default',
    variant = 'enclosed',
    isStickyHeader = false,
    isStriped = false,
    hasBorder = true,
    isLoading = false,
    loadingMessage = 'Loading…',
    emptyMessage = 'No data',
    sortDescriptor: sortProp,
    defaultSortDescriptor,
    onSortChange,
    selectionMode = 'none',
    selectedKeys: selectedKeysProp,
    defaultSelectedKeys,
    onSelectionChange,
    disabledKeys,
    onRowClick,
    maxHeight,
    className,
    style,
    id,
    'aria-label': ariaLabel,
  } = props;

  const theme = useTheme();
  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');
  const tableId = id ?? `timeui-table-${safeAutoId}`;

  // ── 受控/非受控：sortDescriptor ──
  const [sortDescriptor, setSortDescriptor] = useControllableState<SortDescriptor | undefined>({
    value: sortProp,
    defaultValue: (sortProp !== undefined ? undefined : defaultSortDescriptor) as
      | SortDescriptor
      | undefined,
    onChange: onSortChange,
    name: 'Table.sortDescriptor',
  });

  // ── 受控/非受控：selectedKeys ──
  const [selectedKeys, setSelectedKeys] = useControllableState<ReadonlyArray<string>>({
    value: selectedKeysProp,
    defaultValue: (selectedKeysProp !== undefined
      ? undefined
      : (defaultSelectedKeys ?? [])) as ReadonlyArray<string>,
    onChange: onSelectionChange,
    name: 'Table.selectedKeys',
  });

  const disabledSet = useMemo(() => new Set(disabledKeys ?? []), [disabledKeys]);
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  // ── 容器水平溢出检测（用于 fixed 列阴影） ──
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState({
    hasOverflow: false,
    scrolledLeft: false,
    scrolledRight: false,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const overflow = el.scrollWidth - el.clientWidth > 1;
      const scrolledLeft = el.scrollLeft > 0;
      const scrolledRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setScrollState({
        hasOverflow: overflow,
        scrolledLeft,
        scrolledRight,
      });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }
    return () => {
      el.removeEventListener('scroll', update);
      ro?.disconnect();
    };
    // 数据/列变化也应触发一次重算。
  }, [columns, data]);

  // ── 计算 fixed 列的 left/right offset（前缀和） ──
  const showSelectionColumn = selectionMode !== 'none';
  const selectionColumnWidth = theme.components.table.selectionColumnWidth;

  const leftFixedColumns = useMemo(() => columns.filter((c) => c.fixed === 'left'), [columns]);
  const rightFixedColumns = useMemo(() => columns.filter((c) => c.fixed === 'right'), [columns]);

  // 选中列在最左：若有任何 fixed=left 的列，selection 列自动 sticky 到 0。
  const selectionColumnIsFixed = showSelectionColumn && leftFixedColumns.length > 0;

  // 计算每一列的 sticky offset。这里用 px 字符串相加。
  const leftOffsets = useMemo(() => {
    const map = new Map<string, string>();
    let acc = selectionColumnIsFixed ? selectionColumnWidth : '0px';
    for (const col of leftFixedColumns) {
      map.set(col.columnKey, acc);
      const w = asLength(col.width) ?? '160px';
      acc = `calc(${acc} + ${w})`;
    }
    return map;
  }, [leftFixedColumns, selectionColumnIsFixed, selectionColumnWidth]);

  const rightOffsets = useMemo(() => {
    const map = new Map<string, string>();
    let acc = '0px';
    for (let i = rightFixedColumns.length - 1; i >= 0; i -= 1) {
      const col = rightFixedColumns[i]!;
      map.set(col.columnKey, acc);
      const w = asLength(col.width) ?? '160px';
      acc = `calc(${acc} + ${w})`;
    }
    return map;
  }, [rightFixedColumns]);

  // ── 行选择：全选状态 ──
  const selectableRowKeys = useMemo(() => {
    return data.map((row, idx) => getRowKey(row, idx, rowKey)).filter((k) => !disabledSet.has(k));
  }, [data, rowKey, disabledSet]);

  const selectedSelectableCount = useMemo(() => {
    let n = 0;
    for (const k of selectableRowKeys) if (selectedSet.has(k)) n += 1;
    return n;
  }, [selectableRowKeys, selectedSet]);

  const allSelected =
    selectableRowKeys.length > 0 && selectedSelectableCount === selectableRowKeys.length;
  const someSelected = selectedSelectableCount > 0 && !allSelected;

  const handleSelectAll = useCallback(
    (next: boolean) => {
      if (next) {
        // 保留已选中的 disabled 键（不能强制取消它们），合并所有可选行。
        const merged = new Set<string>(selectedKeys);
        for (const k of selectableRowKeys) merged.add(k);
        setSelectedKeys(Array.from(merged));
      } else {
        // 仅取消可选行；disabled 行的选中状态保留。
        const next: string[] = [];
        for (const k of selectedKeys) {
          if (disabledSet.has(k)) next.push(k);
        }
        setSelectedKeys(next);
      }
    },
    [selectedKeys, selectableRowKeys, disabledSet, setSelectedKeys],
  );

  const toggleRowSelection = useCallback(
    (key: string) => {
      if (disabledSet.has(key)) return;
      if (selectionMode === 'single') {
        // single 模式：每次只保留一个 key；再次点击同一行则取消。
        if (selectedSet.has(key) && selectedKeys.length === 1) {
          setSelectedKeys([]);
        } else {
          setSelectedKeys([key]);
        }
        return;
      }
      if (selectionMode === 'multiple') {
        if (selectedSet.has(key)) {
          setSelectedKeys(selectedKeys.filter((k) => k !== key));
        } else {
          setSelectedKeys([...selectedKeys, key]);
        }
      }
    },
    [selectionMode, selectedKeys, selectedSet, disabledSet, setSelectedKeys],
  );

  // ── 排序点击 ──
  const handleSortClick = useCallback(
    (column: TableColumn<T>) => {
      if (!column.isSortable) return;
      const next = nextSortDirection(sortDescriptor, column.columnKey);
      setSortDescriptor(next);
    },
    [sortDescriptor, setSortDescriptor],
  );

  // ── styles ──
  const densityTokens = theme.components.tableDensity[density];
  const tableTokens = theme.components.table;

  const hairline = theme.colors.border.subtle;
  const borderStrong = theme.colors.border.default;
  const surfaceBg = theme.colors.bg.surface;
  const headerBg = theme.colors.bg.muted;
  const sunkenBg = theme.colors.bg.sunken;
  const textPrimary = theme.colors.text.primary;
  const textSecondary = theme.colors.text.secondary;
  const textMuted = theme.colors.text.muted;
  const primaryActive = theme.colors.action.primary.default;
  const selectedBg = theme.colors.primary[100];
  const selectedHoverBg = theme.colors.primary[200];

  const hoverDuration = tableTokens.rowHoverDuration;

  // ────────────────────────────────────────────────────────────
  // Variant 视觉策略：每个 variant 在 hairline / bg / radius / spacing 上做差异，
  // 但全部消费现有 token，不引入新风格元素。
  //
  //  - enclosed: 默认，外圆角 + 容器 hairline + header muted bg
  //  - divided:  无外框，header 仅底部 hairline strong + letter-spacing 强化
  //  - grid:     enclosed + 单元格 column 间也有 hairline subtle
  //  - quiet:    无边无线无 bg，仅靠 row hover 揭示分隔
  // ────────────────────────────────────────────────────────────

  const variantStyle = {
    container: {
      bg: variant === 'quiet' ? 'transparent' : surfaceBg,
      radius: variant === 'enclosed' || variant === 'grid' ? tableTokens.containerRadius : '0',
      border:
        variant === 'enclosed'
          ? hasBorder
            ? `${tableTokens.containerBorder} solid ${hairline}`
            : 'none'
          : variant === 'grid'
            ? `${tableTokens.containerBorder} solid ${hairline}`
            : 'none',
    },
    header: {
      bg: variant === 'enclosed' || variant === 'grid' ? headerBg : 'transparent',
      // divided 用更重的 borderBottom 让 header 视觉上"独立成段"
      borderBottomColor:
        variant === 'divided' ? borderStrong : variant === 'quiet' ? 'transparent' : borderStrong,
      borderBottomWidth: variant === 'divided' ? '1.5px' : tableTokens.headerBorderBottom,
      // quiet 用 muted text 让 header 退到背景
      color: variant === 'quiet' ? textMuted : textSecondary,
      // divided / quiet 强化 letter-spacing 让 header 文字有"distant label"质感
      letterSpacing:
        variant === 'divided'
          ? '0.04em'
          : variant === 'quiet'
            ? '0.06em'
            : tableTokens.headerLetterSpacing,
      fontWeight: variant === 'quiet' ? 500 : tableTokens.headerFontWeight,
    },
    row: {
      // quiet 完全不画行间分隔线
      borderBottomColor: variant === 'quiet' ? 'transparent' : hairline,
    },
    // grid 在 td/th 之间画竖向 hairline（用 td + td / th + th 兄弟选择器）
    column: {
      divider: variant === 'grid' ? `${tableTokens.containerBorder} solid ${hairline}` : null,
    },
  } as const;

  const containerCss = css`
    position: relative;
    width: 100%;
    background: ${variantStyle.container.bg};
    color: ${textPrimary};
    border-radius: ${variantStyle.container.radius};
    border: ${variantStyle.container.border};
    overflow: ${maxHeight !== undefined ? 'auto' : 'auto'};
    ${maxHeight !== undefined ? `max-height: ${asLength(maxHeight)};` : ''}
    /* 让横向滚动可键盘聚焦 */
    &:focus-visible {
      outline: 2px solid ${theme.colors.focus};
      outline-offset: 2px;
    }
  `;

  const tableCss = css`
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: auto;
    font-family: inherit;
    font-size: ${densityTokens.fontSize};
    line-height: ${tableTokens.cellLineHeight};
    color: ${textPrimary};
    ${variantStyle.column.divider
      ? `
        & thead > tr > th + th { border-left: ${variantStyle.column.divider}; }
        & tbody > tr > td + td { border-left: ${variantStyle.column.divider}; }
      `
      : ''}
  `;

  const theadRowCss = css`
    background: ${variantStyle.header.bg};
  `;

  const thBaseCss = (
    align: TableAlign,
    isSticky: boolean,
    leftOffset?: string,
    rightOffset?: string,
    width?: string,
    extraShadow?: string,
  ) => css`
    box-sizing: border-box;
    text-align: ${align};
    height: ${tableTokens.headerHeight};
    padding: 0 ${densityTokens.cellPaddingX};
    font-size: ${tableTokens.headerFontSize};
    font-weight: ${variantStyle.header.fontWeight};
    letter-spacing: ${variantStyle.header.letterSpacing};
    color: ${variantStyle.header.color};
    background: ${variantStyle.header.bg};
    border-bottom: ${variantStyle.header.borderBottomWidth} solid
      ${variantStyle.header.borderBottomColor};
    user-select: none;
    white-space: nowrap;
    ${width ? `width: ${width}; min-width: ${width};` : ''}
    ${isStickyHeader
      ? `position: sticky; top: 0; z-index: ${theme.zIndex.docked + (isSticky ? 1 : 0)}; box-shadow: ${tableTokens.stickyHeaderShadow};`
      : isSticky
        ? `position: sticky; z-index: ${theme.zIndex.docked};`
        : ''}
    ${isSticky && leftOffset !== undefined ? `left: ${leftOffset};` : ''}
    ${isSticky && rightOffset !== undefined ? `right: ${rightOffset};` : ''}
    ${extraShadow ? `box-shadow: ${extraShadow};` : ''}
  `;

  const tdBaseCss = (
    align: TableAlign,
    isSticky: boolean,
    leftOffset?: string,
    rightOffset?: string,
    width?: string,
    extraShadow?: string,
    rowBg?: string,
  ) => css`
    box-sizing: border-box;
    text-align: ${align};
    padding: ${densityTokens.cellPaddingY} ${densityTokens.cellPaddingX};
    height: ${densityTokens.rowHeight};
    border-bottom: ${tableTokens.rowBorderBottom} solid ${variantStyle.row.borderBottomColor};
    color: ${textPrimary};
    vertical-align: middle;
    ${width ? `width: ${width}; min-width: ${width};` : ''}
    ${isSticky
      ? `position: sticky; z-index: ${theme.zIndex.docked - 1}; background: ${rowBg ?? surfaceBg};`
      : ''}
    ${isSticky && leftOffset !== undefined ? `left: ${leftOffset};` : ''}
    ${isSticky && rightOffset !== undefined ? `right: ${rightOffset};` : ''}
    ${extraShadow ? `box-shadow: ${extraShadow};` : ''}
  `;

  const rowBaseCss = (isSelected: boolean, striped: boolean) => css`
    background: ${isSelected ? selectedBg : striped ? sunkenBg : 'transparent'};
    transition: background-color ${hoverDuration} ease;
    cursor: ${onRowClick || selectionMode !== 'none' ? 'pointer' : 'default'};
    &:hover {
      background: ${isSelected ? selectedHoverBg : headerBg};
    }
    &:hover td[data-sticky-cell] {
      background: ${isSelected ? selectedHoverBg : headerBg};
    }
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;

  const sortBtnCss = css`
    display: inline-flex;
    align-items: center;
    gap: ${tableTokens.sortIconGap};
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    color: inherit;
    font: inherit;
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    text-align: inherit;
    &:focus-visible {
      outline: 2px solid ${theme.colors.focus};
      outline-offset: 2px;
      border-radius: 4px;
    }
  `;

  // 总列数（含选择列）
  const totalColCount = columns.length + (showSelectionColumn ? 1 : 0);

  // ── 渲染 ──
  const showLeftShadow =
    scrollState.hasOverflow && scrollState.scrolledLeft && leftFixedColumns.length > 0;
  const showRightShadow =
    scrollState.hasOverflow && scrollState.scrolledRight && rightFixedColumns.length > 0;

  // 最后一个 left fixed 列与第一个 right fixed 列 → 用于阴影投射。
  const lastLeftFixedKey = leftFixedColumns[leftFixedColumns.length - 1]?.columnKey;
  const firstRightFixedKey = rightFixedColumns[0]?.columnKey;

  const headerSelectionCellCss = thBaseCss(
    'center',
    selectionColumnIsFixed,
    selectionColumnIsFixed ? '0px' : undefined,
    undefined,
    selectionColumnWidth,
    selectionColumnIsFixed && showLeftShadow && leftFixedColumns.length === 0
      ? tableTokens.stickyColumnShadowLeft
      : undefined,
  );

  const renderHeaderRow = () => (
    <tr role="row" css={theadRowCss}>
      {showSelectionColumn ? (
        <th
          role="columnheader"
          scope="col"
          css={headerSelectionCellCss}
          data-selection-column=""
          data-sticky-cell={selectionColumnIsFixed || undefined}
        >
          {selectionMode === 'multiple' ? (
            <Checkbox
              aria-label={allSelected ? 'Deselect all rows' : 'Select all rows'}
              size={selectionCheckboxSizeMap[density]}
              isSelected={allSelected}
              isIndeterminate={someSelected}
              isDisabled={selectableRowKeys.length === 0}
              onChange={(checked) => handleSelectAll(checked)}
            />
          ) : null}
        </th>
      ) : null}
      {columns.map((col) => {
        const align: TableAlign = col.align ?? 'left';
        const isFixed = col.fixed !== undefined;
        const leftOffset = col.fixed === 'left' ? leftOffsets.get(col.columnKey) : undefined;
        const rightOffset = col.fixed === 'right' ? rightOffsets.get(col.columnKey) : undefined;
        const widthStr = asLength(col.width);
        const isActiveSort = sortDescriptor?.columnKey === col.columnKey;
        const ariaSort: 'ascending' | 'descending' | 'none' | undefined = col.isSortable
          ? isActiveSort
            ? sortDescriptor!.direction === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
          : undefined;

        let extraShadow: string | undefined;
        if (col.fixed === 'left' && col.columnKey === lastLeftFixedKey && showLeftShadow) {
          extraShadow = tableTokens.stickyColumnShadowLeft;
        } else if (
          col.fixed === 'right' &&
          col.columnKey === firstRightFixedKey &&
          showRightShadow
        ) {
          extraShadow = tableTokens.stickyColumnShadowRight;
        }

        return (
          <th
            key={col.columnKey}
            role="columnheader"
            scope="col"
            data-column-key={col.columnKey}
            data-fixed={col.fixed || undefined}
            data-sticky-cell={isFixed || undefined}
            aria-sort={ariaSort}
            css={thBaseCss(align, isFixed, leftOffset, rightOffset, widthStr, extraShadow)}
          >
            {col.isSortable ? (
              <button
                type="button"
                onClick={() => handleSortClick(col)}
                css={sortBtnCss}
                data-sortable=""
                data-sort-direction={isActiveSort ? sortDescriptor!.direction : 'none'}
              >
                <span>{col.title}</span>
                <SortIcons
                  direction={isActiveSort ? sortDescriptor!.direction : undefined}
                  inactiveColor={textMuted}
                  activeColor={primaryActive}
                  size={tableTokens.sortIconSize}
                />
              </button>
            ) : (
              col.title
            )}
          </th>
        );
      })}
    </tr>
  );

  const renderEmpty = () => (
    <tr role="row" data-empty-row="">
      <td
        role="cell"
        colSpan={Math.max(1, totalColCount)}
        css={css`
          padding: 0;
          text-align: center;
          color: ${textMuted};
          font-size: ${tableTokens.emptyFontSize};
          background: ${surfaceBg};
        `}
      >
        <div
          css={css`
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: ${tableTokens.emptyMinHeight};
            padding: 24px 16px;
          `}
        >
          {emptyMessage}
        </div>
      </td>
    </tr>
  );

  const renderBodyRows = () =>
    data.map((row, rowIndex) => {
      const key = getRowKey(row, rowIndex, rowKey);
      const isSelected = selectedSet.has(key);
      const isDisabled = disabledSet.has(key);
      const striped = isStriped && rowIndex % 2 === 1;
      const rowBg = isSelected ? selectedBg : striped ? sunkenBg : surfaceBg;

      const handleRowClick = (e: ReactMouseEvent) => {
        // isInteractive 列点击不触发行点击；通过 data 属性判断 target 链路。
        let node: HTMLElement | null = e.target as HTMLElement;
        while (node && node !== e.currentTarget) {
          if (node.dataset && node.dataset.interactive === 'true') {
            return;
          }
          node = node.parentElement;
        }
        onRowClick?.(row, rowIndex, e);
        if (selectionMode !== 'none') {
          toggleRowSelection(key);
        }
      };

      return (
        <tr
          key={key}
          role="row"
          aria-selected={selectionMode !== 'none' ? isSelected : undefined}
          aria-disabled={isDisabled || undefined}
          data-row-key={key}
          data-selected={isSelected || undefined}
          data-disabled={isDisabled || undefined}
          data-striped={striped || undefined}
          onClick={handleRowClick}
          css={rowBaseCss(isSelected, striped)}
        >
          {showSelectionColumn ? (
            <td
              role="cell"
              data-selection-cell=""
              data-interactive="true"
              data-sticky-cell={selectionColumnIsFixed || undefined}
              onClick={(e) => e.stopPropagation()}
              css={tdBaseCss(
                'center',
                selectionColumnIsFixed,
                selectionColumnIsFixed ? '0px' : undefined,
                undefined,
                selectionColumnWidth,
                undefined,
                rowBg,
              )}
            >
              <Checkbox
                aria-label={isSelected ? `Deselect row ${key}` : `Select row ${key}`}
                size={selectionCheckboxSizeMap[density]}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onChange={() => toggleRowSelection(key)}
              />
            </td>
          ) : null}
          {columns.map((col) => {
            const align: TableAlign = col.align ?? 'left';
            const isFixed = col.fixed !== undefined;
            const leftOffset = col.fixed === 'left' ? leftOffsets.get(col.columnKey) : undefined;
            const rightOffset = col.fixed === 'right' ? rightOffsets.get(col.columnKey) : undefined;
            const widthStr = asLength(col.width);

            let extraShadow: string | undefined;
            if (col.fixed === 'left' && col.columnKey === lastLeftFixedKey && showLeftShadow) {
              extraShadow = tableTokens.stickyColumnShadowLeft;
            } else if (
              col.fixed === 'right' &&
              col.columnKey === firstRightFixedKey &&
              showRightShadow
            ) {
              extraShadow = tableTokens.stickyColumnShadowRight;
            }

            return (
              <td
                key={col.columnKey}
                role="cell"
                data-column-key={col.columnKey}
                data-fixed={col.fixed || undefined}
                data-interactive={col.isInteractive ? 'true' : undefined}
                data-sticky-cell={isFixed || undefined}
                onClick={col.isInteractive ? (e) => e.stopPropagation() : undefined}
                css={tdBaseCss(
                  align,
                  isFixed,
                  leftOffset,
                  rightOffset,
                  widthStr,
                  extraShadow,
                  rowBg,
                )}
              >
                {getCellContent(col, row, rowIndex)}
              </td>
            );
          })}
        </tr>
      );
    });

  // ── overlay：loading ──
  const overlayCss = css`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.6);
    z-index: ${theme.zIndex.docked + 2};
    pointer-events: all;
  `;

  const containerStyle: CSSProperties = {
    ...style,
  };

  return (
    <div
      ref={mergeRefs(containerRef, forwardedRef)}
      id={tableId}
      className={className}
      style={containerStyle}
      role="region"
      aria-label={ariaLabel ?? 'Data table'}
      aria-busy={isLoading || undefined}
      tabIndex={0}
      data-density={density}
      data-variant={variant}
      data-sticky-header={isStickyHeader || undefined}
      data-striped={isStriped || undefined}
      data-loading={isLoading || undefined}
      data-has-border={hasBorder || undefined}
      css={containerCss}
    >
      <table role="table" css={tableCss}>
        <thead role="rowgroup">{renderHeaderRow()}</thead>
        <tbody role="rowgroup">{data.length === 0 ? renderEmpty() : renderBodyRows()}</tbody>
      </table>
      {isLoading ? (
        <div role="status" aria-live="polite" data-loading-overlay="" css={overlayCss}>
          <span
            css={css`
              display: inline-flex;
              align-items: center;
              gap: 10px;
              color: ${textSecondary};
              font-size: ${densityTokens.fontSize};
            `}
          >
            <Spinner color={primaryActive} />
            {loadingMessage}
          </span>
        </div>
      ) : null}
    </div>
  );
}

// 用 forwardRef + 泛型 hack：保留对外的泛型签名。
export const Table = forwardRef(TableInner) as <T = unknown>(
  props: TableProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => ReturnType<typeof TableInner>;

(Table as unknown as { displayName: string }).displayName = 'Table';
