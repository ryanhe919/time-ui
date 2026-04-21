/** @jsxImportSource @emotion/react */

'use client';

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Pagination 组件的核心渲染与交互逻辑。
 */

import {
  forwardRef,
  useCallback,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { useTheme, css, type Theme } from '@emotion/react';
import { useI18n } from '@timeui/core';
import { useControllableState } from '../utils';
import { Select } from '../Select';
import { SelectOption } from '../Select/SelectOption';
import type { PaginationItem, PaginationProps, PaginationSize } from './Pagination.types';

const formatTemplate = (template: string, params: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ''));

/**
 * 生成页码列表（含 ellipsis 占位）。
 *
 * 算法：
 *   左边界 = max(2, page - siblingCount)
 *   右边界 = min(totalPages - 1, page + siblingCount)
 *   首页与末页恒在；左右与首页/末页之间若间隔 > 1 用 ellipsis 占位，
 *   若仅相邻则不插省略号（避免 "1 ... 2 3" 形式）。
 *
 * 边界情况：
 *   - totalPages <= 1：返回 [{ page: 1 }]
 *   - 总页数较少（<= 1 + siblingCount*2 + 4）：直接返回完整序列，不折叠
 */
export function buildPaginationItems(
  totalPages: number,
  page: number,
  siblingCount: number,
): PaginationItem[] {
  const safeTotal = Math.max(1, Math.floor(totalPages));
  const safeSibling = Math.max(0, Math.floor(siblingCount));

  if (safeTotal <= 1) {
    return [{ type: 'page', page: 1 }];
  }

  // 阈值：首+末+当前+左右 sibling+两个 ellipsis 占位 → 5 + 2*sibling
  // 当总页数 <= 阈值，整段直出，没必要折叠。
  const threshold = 5 + safeSibling * 2;
  if (safeTotal <= threshold) {
    return Array.from({ length: safeTotal }, (_, i) => ({
      type: 'page' as const,
      page: i + 1,
    }));
  }

  const safePage = Math.min(Math.max(1, page), safeTotal);
  const left = Math.max(2, safePage - safeSibling);
  const right = Math.min(safeTotal - 1, safePage + safeSibling);

  const items: PaginationItem[] = [];
  items.push({ type: 'page', page: 1 });

  // 头部：left 与 2 之间是否需要省略
  if (left > 2) {
    items.push({ type: 'ellipsis', key: 'ellipsis-start' });
  }

  for (let p = left; p <= right; p += 1) {
    items.push({ type: 'page', page: p });
  }

  // 尾部：right 与 totalPages-1 之间是否需要省略
  if (right < safeTotal - 1) {
    items.push({ type: 'ellipsis', key: 'ellipsis-end' });
  }

  items.push({ type: 'page', page: safeTotal });
  return items;
}

const ChevronLeftIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden focusable={false}>
    <path
      d="M10 3L5 8L10 13"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRightIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden focusable={false}>
    <path
      d="M6 3L11 8L6 13"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface ItemButtonProps {
  size: PaginationSize;
  isActive?: boolean;
  isDisabled?: boolean;
  ariaLabel?: string;
  ariaCurrent?: 'page';
  onClick?: () => void;
  children: ReactNode;
  type?: 'page' | 'control';
  theme: Theme;
}

const itemButtonCss = (theme: Theme, size: PaginationSize, isActive: boolean) => {
  const sz = theme.components.paginationSize[size];
  const tk = theme.components.pagination;
  const focus = theme.colors.border.focus ?? theme.colors.focus;
  const primaryBg = theme.colors.action.primary.default;
  const primaryFg = theme.colors.primary.foreground;
  const border = isActive ? primaryBg : (theme.colors.border.default ?? theme.colors.border.subtle);
  const fg = isActive ? primaryFg : theme.colors.text.primary;
  const bg = isActive ? primaryBg : 'transparent';

  return css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-width: ${sz.itemSize};
    height: ${sz.itemSize};
    padding: 0 6px;
    margin: 0;
    font-family: inherit;
    font-size: ${sz.fontSize};
    line-height: 1;
    font-weight: ${isActive ? 600 : 500};
    color: ${fg};
    background: ${bg};
    border: ${tk.itemBorder} solid ${border};
    border-radius: ${sz.radius};
    cursor: pointer;
    user-select: none;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    transition:
      background-color ${tk.hoverDuration} ease,
      color ${tk.hoverDuration} ease,
      border-color ${tk.hoverDuration} ease;

    &:hover:not(:disabled):not([aria-disabled='true']) {
      ${isActive ? '' : `background-color: ${theme.colors.bg.muted};`}
    }

    &:focus-visible {
      outline: 2px solid ${focus};
      outline-offset: 2px;
      z-index: 1;
    }

    &:disabled,
    &[aria-disabled='true'] {
      opacity: 0.4;
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;
};

function ItemButton({
  size,
  isActive = false,
  isDisabled = false,
  ariaLabel,
  ariaCurrent,
  onClick,
  children,
  theme,
}: ItemButtonProps) {
  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      aria-disabled={isDisabled || undefined}
      onClick={isDisabled ? undefined : onClick}
      css={itemButtonCss(theme, size, isActive)}
    >
      {children}
    </button>
  );
}

const ellipsisCss = (theme: Theme, size: PaginationSize) => {
  const sz = theme.components.paginationSize[size];
  return css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    min-width: ${sz.itemSize};
    height: ${sz.itemSize};
    color: ${theme.colors.text.muted};
    font-size: ${sz.fontSize};
    user-select: none;
  `;
};

const SIZE_TO_ICON: Record<PaginationSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
};

export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    total,
    pageSize: pageSizeProp,
    defaultPageSize,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    page: pageProp,
    defaultPage,
    onChange,
    variant = 'default',
    size: sizeProp = 'md',
    siblingCount = 1,
    showQuickJumper = false,
    showSizeChanger = false,
    isDisabled = false,
    hideControls = false,
    labels,
    className,
    style,
    id: idProp,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const theme = useTheme();
  const i18n = useI18n();

  // mini 强制 sm
  const size: PaginationSize = variant === 'mini' ? 'sm' : sizeProp;

  const autoId = useId();
  const id = idProp ?? `timeui-pagination-${autoId.replace(/:/g, '')}`;

  const [pageSize, setPageSize] = useControllableState<number>({
    value: pageSizeProp,
    // 受控时 useControllableState 会忽略 defaultValue（且若同时传入两者会告警）；
    // 这里在受控分支显式传 undefined 以避免噪声告警。
    defaultValue: (pageSizeProp !== undefined ? undefined : (defaultPageSize ?? 10)) as number,
    onChange: onPageSizeChange,
    name: 'Pagination(pageSize)',
  });

  const safePageSize = pageSize > 0 ? pageSize : 10;
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / safePageSize));

  const [page, setPage] = useControllableState<number>({
    value: pageProp,
    defaultValue: (pageProp !== undefined ? undefined : (defaultPage ?? 1)) as number,
    onChange,
    name: 'Pagination(page)',
  });

  const clampedPage = Math.min(Math.max(1, page), totalPages);

  const items = useMemo(
    () => buildPaginationItems(totalPages, clampedPage, siblingCount),
    [totalPages, clampedPage, siblingCount],
  );

  const goTo = useCallback(
    (next: number) => {
      if (isDisabled) return;
      const target = Math.min(Math.max(1, next), totalPages);
      if (target === clampedPage) return;
      setPage(target);
    },
    [isDisabled, totalPages, clampedPage, setPage],
  );

  const handlePageSizeChange = useCallback(
    (val: string) => {
      const parsed = parseInt(val, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) return;
      setPageSize(parsed);
      // 切换 pageSize 时把 page 重置为 1（简化策略）。
      setPage(1);
    },
    [setPageSize, setPage],
  );

  const isPrevDisabled = isDisabled || clampedPage <= 1;
  const isNextDisabled = isDisabled || clampedPage >= totalPages;

  const prevLabel = labels?.prev ?? i18n.pagination.prev;
  const nextLabel = labels?.next ?? i18n.pagination.next;
  const jumperLabel = labels?.jumperLabel ?? i18n.pagination.jumperLabel;
  const sizeChangerLabel = labels?.sizeChangerLabel ?? i18n.pagination.sizeChangerLabel;
  const summary = labels?.summary ?? ((p: number, t: number): ReactNode => `${p} / ${t}`);

  const iconSize = SIZE_TO_ICON[size];
  const sizeTokens = theme.components.paginationSize[size];
  const tokens = theme.components.pagination;

  // jumper 输入受控；本地状态储存输入值
  const [jumperValue, setJumperValue] = useState('');

  const handleJumperKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const v = e.currentTarget.value.trim();
    if (v.length === 0) return;
    const parsed = parseInt(v, 10);
    if (!Number.isFinite(parsed)) return;
    const target = Math.min(Math.max(1, parsed), totalPages);
    setJumperValue('');
    if (target !== clampedPage) {
      setPage(target);
    }
  };

  const containerCss = css`
    display: inline-flex;
    align-items: center;
    gap: ${sizeTokens.gap};
    font-family: inherit;
    color: ${theme.colors.text.primary};
  `;

  const listCss = css`
    list-style: none;
    margin: 0;
    padding: 0;
    display: inline-flex;
    align-items: center;
    gap: ${sizeTokens.gap};
  `;

  const jumperWrapCss = css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: ${sizeTokens.fontSize};
    color: ${theme.colors.text.secondary};
  `;

  const jumperInputCss = css`
    box-sizing: border-box;
    width: ${tokens.jumperWidth};
    height: ${tokens.jumperHeight};
    padding: 0 8px;
    border: ${tokens.itemBorder} solid ${theme.colors.border.default};
    border-radius: ${tokens.jumperRadius};
    background: ${theme.colors.bg.surface ?? theme.colors.bg.canvas};
    color: ${theme.colors.text.primary};
    font: inherit;
    font-size: ${sizeTokens.fontSize};
    line-height: 1;
    text-align: center;
    appearance: textfield;
    outline: none;
    transition: border-color ${tokens.hoverDuration} ease;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &:focus-visible {
      outline: 2px solid ${theme.colors.border.focus ?? theme.colors.focus};
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;

  const sizeSelectorCss: CSSProperties = {
    minWidth: tokens.sizeSelectorMinWidth,
  };

  const summaryCss = css`
    display: inline-flex;
    align-items: center;
    padding: 0 6px;
    min-height: ${sizeTokens.itemSize};
    font-size: ${sizeTokens.fontSize};
    color: ${theme.colors.text.secondary};
    user-select: none;
    font-variant-numeric: tabular-nums;
  `;

  const renderPrev = () => {
    if (hideControls) return null;
    const btn = (
      <ItemButton
        theme={theme}
        size={size}
        isDisabled={isPrevDisabled}
        ariaLabel={prevLabel}
        onClick={() => goTo(clampedPage - 1)}
      >
        <ChevronLeftIcon size={iconSize} />
      </ItemButton>
    );
    return <div role="listitem">{btn}</div>;
  };

  const renderNext = () => {
    if (hideControls) return null;
    const btn = (
      <ItemButton
        theme={theme}
        size={size}
        isDisabled={isNextDisabled}
        ariaLabel={nextLabel}
        onClick={() => goTo(clampedPage + 1)}
      >
        <ChevronRightIcon size={iconSize} />
      </ItemButton>
    );
    return <div role="listitem">{btn}</div>;
  };

  const renderPagesList = () => (
    <div role="list" css={listCss} data-timeui-pagination-list="">
      {renderPrev()}
      {items.map((it) => {
        if (it.type === 'ellipsis') {
          return (
            <div role="listitem" key={it.key}>
              <span aria-hidden css={ellipsisCss(theme, size)} data-slot="ellipsis">
                …
              </span>
            </div>
          );
        }
        const isActive = it.page === clampedPage;
        return (
          <div role="listitem" key={`page-${it.page}`}>
            <ItemButton
              theme={theme}
              size={size}
              isActive={isActive}
              isDisabled={isDisabled}
              ariaCurrent={isActive ? 'page' : undefined}
              ariaLabel={formatTemplate(i18n.pagination.pageLabel, { page: it.page })}
              onClick={() => goTo(it.page)}
            >
              {it.page}
            </ItemButton>
          </div>
        );
      })}
      {renderNext()}
    </div>
  );

  const renderSimpleList = () => (
    <div role="list" css={listCss} data-timeui-pagination-list="">
      {renderPrev()}
      <div role="listitem">
        <span css={summaryCss} data-slot="summary">
          {summary(clampedPage, totalPages)}
        </span>
      </div>
      {renderNext()}
    </div>
  );

  const renderJumper = () => {
    if (!showQuickJumper) return null;
    return (
      <span css={jumperWrapCss} data-slot="jumper">
        <label htmlFor={`${id}-jumper`}>{jumperLabel}</label>
        <input
          id={`${id}-jumper`}
          type="number"
          inputMode="numeric"
          min={1}
          max={totalPages}
          value={jumperValue}
          onChange={(e) => setJumperValue(e.target.value)}
          onKeyDown={handleJumperKeyDown}
          disabled={isDisabled}
          aria-label={jumperLabel}
          css={jumperInputCss}
        />
      </span>
    );
  };

  const renderSizeChanger = () => {
    if (!showSizeChanger) return null;
    return (
      <span data-slot="size-changer" style={{ display: 'inline-flex' }}>
        <Select
          aria-label={sizeChangerLabel}
          size={size === 'lg' ? 'lg' : size === 'md' ? 'md' : 'sm'}
          value={String(safePageSize)}
          onChange={handlePageSizeChange}
          isDisabled={isDisabled}
          style={sizeSelectorCss}
        >
          {pageSizeOptions.map((opt) => (
            <SelectOption key={opt} value={String(opt)}>
              {formatTemplate(i18n.pagination.pageSizeOption, { pageSize: opt })}
            </SelectOption>
          ))}
        </Select>
      </span>
    );
  };

  return (
    <nav
      ref={ref}
      id={id}
      role="navigation"
      aria-label={ariaLabel ?? i18n.pagination.navLabel}
      data-variant={variant}
      data-size={size}
      data-disabled={isDisabled || undefined}
      className={className}
      style={style}
      css={containerCss}
    >
      {variant === 'simple' || variant === 'mini' ? renderSimpleList() : renderPagesList()}
      {renderJumper()}
      {renderSizeChanger()}
    </nav>
  );
});

(Pagination as unknown as { displayName: string }).displayName = 'TimeUI.Pagination';
