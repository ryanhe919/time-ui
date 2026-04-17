/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 SearchDialog 组件：命令面板风格的搜索对话框，与 Search 触发按钮搭配使用。
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
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { css, useTheme } from '@emotion/react';
import { mergeRefs, useControllableState } from '../utils';
import type { SearchDialogItem, SearchDialogProps, SearchDialogSection } from './Search.types';

// ────────────────────────────────────────────────────────────
// 内部工具
// ────────────────────────────────────────────────────────────

function asLength(v: string | number | undefined): string | undefined {
  if (v === undefined) return undefined;
  return typeof v === 'number' ? `${v}px` : v;
}

function nodeToString(node: ReactNode): string {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeToString).join(' ');
  // ReactNode 中的 element：尝试读 children
  if (typeof node === 'object' && 'props' in (node as object)) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return props ? nodeToString(props.children) : '';
  }
  return '';
}

function defaultFilter(item: SearchDialogItem, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    nodeToString(item.label).toLowerCase().includes(q) ||
    nodeToString(item.hint).toLowerCase().includes(q)
  );
}

// 把 sections / items 归一化到 (sectionTitle?, items[]) 数组。
function normalize(
  items: ReadonlyArray<SearchDialogItem> | undefined,
  sections: ReadonlyArray<SearchDialogSection> | undefined,
): SearchDialogSection[] {
  if (sections && sections.length > 0) return [...sections];
  if (items && items.length > 0) return [{ id: '__flat__', items }];
  return [];
}

// 把所有可见条目展平到一维（用于键盘高亮 / Enter 选中）。
function flatten(sections: SearchDialogSection[]): {
  flat: Array<{ item: SearchDialogItem; sectionId: string }>;
} {
  const flat: Array<{ item: SearchDialogItem; sectionId: string }> = [];
  for (const s of sections) {
    for (const item of s.items) {
      flat.push({ item, sectionId: s.id });
    }
  }
  return { flat };
}

// 解析 shortcut 字符串：如 'mod+k' / 'ctrl+/' / 'alt+space' / 'escape'。
function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const tokens = shortcut
    .toLowerCase()
    .split('+')
    .map((t) => t.trim());
  const key = tokens[tokens.length - 1] ?? '';
  const mods = tokens.slice(0, -1);

  const isMac =
    typeof navigator !== 'undefined' &&
    // navigator.platform 已被部分浏览器废弃，但仍是最可靠的 Mac 检测；userAgent 兜底。
    /mac|ipad|iphone|ipod/i.test(
      (navigator as Navigator & { platform?: string }).platform || navigator.userAgent || '',
    );

  const wantMod = mods.includes('mod');
  const wantCtrl = mods.includes('ctrl') || (wantMod && !isMac);
  const wantMeta = mods.includes('meta') || mods.includes('cmd') || (wantMod && isMac);
  const wantShift = mods.includes('shift');
  const wantAlt = mods.includes('alt') || mods.includes('option');

  if (wantCtrl !== e.ctrlKey) return false;
  if (wantMeta !== e.metaKey) return false;
  if (wantShift !== e.shiftKey) return false;
  if (wantAlt !== e.altKey) return false;
  return e.key.toLowerCase() === key;
}

// ────────────────────────────────────────────────────────────
// 组件本体
// ────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const Spinner = ({ color }: { color: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    css={css`
      animation: timeui-search-spin 900ms linear infinite;
      @keyframes timeui-search-spin {
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

export const SearchDialog = forwardRef<HTMLDivElement, SearchDialogProps>(
  function SearchDialog(props, forwardedRef) {
    const {
      isOpen,
      defaultIsOpen = false,
      onOpenChange,

      items,
      sections,

      query,
      defaultQuery = '',
      onQueryChange,
      filter = defaultFilter,

      onSelect,
      closeOnSelect = true,
      shortcut,

      placeholder = 'Search…',
      emptyMessage = 'No results',
      isLoading = false,
      loadingMessage = 'Searching…',
      showEscapeKey = true,
      escapeKeyLabel = 'ESC',
      footer,

      renderItem,

      width,
      maxListHeight,
      topOffset,

      className,
      style,
      id,
      'aria-label': ariaLabel = 'Search',
    } = props;

    const theme = useTheme();
    const autoId = useId();
    const safeAutoId = autoId.replace(/:/g, '');
    const baseId = id ?? `timeui-search-dialog-${safeAutoId}`;
    const listboxId = `${baseId}-listbox`;
    const inputId = `${baseId}-input`;

    // 受控 / 非受控 open
    const [open, setOpen] = useControllableState<boolean>({
      value: isOpen,
      defaultValue: (isOpen !== undefined ? undefined : defaultIsOpen) as boolean,
      onChange: onOpenChange,
      name: 'SearchDialog',
    });

    // 受控 / 非受控 query
    const [q, setQ] = useControllableState<string>({
      value: query,
      defaultValue: (query !== undefined ? undefined : defaultQuery) as string,
      onChange: onQueryChange,
      name: 'SearchDialog.query',
    });

    // ── 数据归一化 + 过滤 ──
    const normalized = useMemo(() => normalize(items, sections), [items, sections]);
    const filteredSections = useMemo<SearchDialogSection[]>(() => {
      const trimmed = q.trim();
      if (!trimmed) return normalized;
      return normalized
        .map((s) => ({ ...s, items: s.items.filter((it) => filter(it, trimmed)) }))
        .filter((s) => s.items.length > 0);
    }, [normalized, q, filter]);
    const { flat } = useMemo(() => flatten(filteredSections), [filteredSections]);

    // ── 高亮项 ──
    const [highlight, setHighlight] = useState(0);
    // 查询变化 / 数据变化时把高亮回退到第一个可用项。
    useEffect(() => {
      if (flat.length === 0) {
        setHighlight(0);
        return;
      }
      setHighlight((prev) => {
        if (prev < 0 || prev >= flat.length) return findFirstEnabled(flat);
        if (flat[prev]?.item.isDisabled) return findFirstEnabled(flat);
        return prev;
      });
      // listRef 滚回顶部
      if (listRef.current) listRef.current.scrollTop = 0;
    }, [flat]);

    // ── refs ──
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    // ── 打开时聚焦 input；关闭时归还焦点 ──
    useEffect(() => {
      if (!open) return;
      previouslyFocusedRef.current =
        typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => {
        clearTimeout(t);
        previouslyFocusedRef.current?.focus?.();
      };
    }, [open]);

    // ── ESC 关闭 ──
    useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setOpen(false);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [open, setOpen]);

    // ── 全局快捷键（mod+k 等）切换 open ──
    useEffect(() => {
      if (!shortcut) return;
      const onKey = (e: KeyboardEvent) => {
        if (matchesShortcut(e, shortcut)) {
          e.preventDefault();
          setOpen(!open);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [shortcut, open, setOpen]);

    // ── 高亮项滚入视图 ──
    useEffect(() => {
      if (!open) return;
      const list = listRef.current;
      if (!list) return;
      const el = list.querySelector<HTMLElement>(`[data-flat-index="${highlight}"]`);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'nearest' });
      }
    }, [highlight, open]);

    const moveHighlight = useCallback(
      (dir: 1 | -1) => {
        if (flat.length === 0) return;
        let i = highlight;
        for (let step = 0; step < flat.length; step += 1) {
          i = (i + dir + flat.length) % flat.length;
          if (!flat[i]!.item.isDisabled) {
            setHighlight(i);
            return;
          }
        }
      },
      [flat, highlight],
    );

    const handleSelect = useCallback(
      (item: SearchDialogItem) => {
        if (item.isDisabled) return;
        onSelect?.(item);
        if (closeOnSelect) setOpen(false);
      },
      [onSelect, closeOnSelect, setOpen],
    );

    const onKeyDown = useCallback(
      (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          moveHighlight(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          moveHighlight(-1);
        } else if (e.key === 'Home') {
          e.preventDefault();
          if (flat.length > 0) setHighlight(findFirstEnabled(flat));
        } else if (e.key === 'End') {
          e.preventDefault();
          if (flat.length > 0) setHighlight(findLastEnabled(flat));
        } else if (e.key === 'Enter') {
          const target = flat[highlight];
          if (!target) return;
          e.preventDefault();
          handleSelect(target.item);
        }
      },
      [flat, highlight, handleSelect, moveHighlight],
    );

    const onBackdropMouseDown = useCallback(
      (e: ReactMouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) setOpen(false);
      },
      [setOpen],
    );

    // ── styles ──
    const focusColor = theme.colors.border.focus ?? theme.colors.focus;
    const surfaceBg = theme.colors.bg.surface ?? theme.colors.bg.canvas;
    const sunkenBg = theme.colors.bg.sunken ?? theme.colors.bg.muted;
    const hairline = theme.colors.border.subtle;
    const textPrimary = theme.colors.text.primary;
    const textSecondary = theme.colors.text.secondary;
    const textMuted = theme.colors.text.muted;
    const easing =
      (theme.motion.easing as { emphasized?: string }).emphasized ?? theme.motion.easing.easeInOut;

    const overlayCss = css`
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(15, 15, 17, 0.42);
      backdrop-filter: saturate(180%) blur(8px);
      -webkit-backdrop-filter: saturate(180%) blur(8px);
      display: flex;
      justify-content: center;
      align-items: ${topOffset === undefined ? 'center' : 'flex-start'};
      padding: ${topOffset === undefined
        ? '24px'
        : `${asLength(topOffset) ?? 'clamp(56px, 12vh, 140px)'} 24px 24px`};
      animation: timeui-search-fade 180ms ease-out;
      @keyframes timeui-search-fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `;

    const dialogCss = css`
      width: ${asLength(width) ?? 'min(620px, 92vw)'};
      max-height: calc(100vh - 48px);
      background: ${surfaceBg};
      border-radius: 16px;
      box-shadow:
        0 24px 64px rgba(0, 0, 0, 0.22),
        0 0 0 1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      font-family: inherit;
      color: ${textPrimary};
      animation: timeui-search-pop 220ms ${easing};
      @keyframes timeui-search-pop {
        from {
          opacity: 0;
          transform: translateY(-6px) scale(0.985);
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

    const headerCss = css`
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-bottom: 1px solid ${hairline};
      flex: none;
      color: ${textMuted};
    `;

    const inputCss = css`
      flex: 1;
      border: none;
      outline: none;
      font: inherit;
      font-size: 15px;
      background: transparent;
      color: ${textPrimary};
      &::placeholder {
        color: ${textMuted};
      }
    `;

    const escKbdCss = css`
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      padding: 2px 8px;
      border: 1px solid ${hairline};
      border-radius: 5px;
      color: ${textMuted};
      background: ${sunkenBg};
      flex: none;
    `;

    const listCss = css`
      list-style: none;
      margin: 0;
      padding: 8px;
      flex: 1 1 auto;
      min-height: 0;
      max-height: ${asLength(maxListHeight) ?? 'min(420px, 52vh)'};
      overflow-y: auto;
      overscroll-behavior: contain;

      /* 美化滚动条：透明 → hover 出现 */
      scrollbar-width: thin;
      scrollbar-color: transparent transparent;
      scrollbar-gutter: stable;
      &:hover,
      &:focus-within {
        scrollbar-color: rgba(120, 120, 128, 0.45) transparent;
      }
      &::-webkit-scrollbar {
        width: 10px;
        height: 10px;
        background: transparent;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: transparent;
        border: 2px solid transparent;
        border-radius: 9999px;
        background-clip: padding-box;
        transition: background-color 200ms ease;
      }
      &:hover::-webkit-scrollbar-thumb,
      &:focus-within::-webkit-scrollbar-thumb {
        background-color: rgba(120, 120, 128, 0.45);
      }
      &::-webkit-scrollbar-thumb:hover {
        background-color: rgba(80, 80, 90, 0.65);
      }
      &::-webkit-scrollbar-corner {
        background: transparent;
      }
    `;

    const sectionTitleCss = css`
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: ${textMuted};
      padding: 8px 12px 4px;
    `;

    const itemButtonCss = (isHighlighted: boolean, isDisabled: boolean) => css`
      width: 100%;
      text-align: left;
      background: ${isHighlighted ? sunkenBg : 'transparent'};
      border: none;
      padding: 10px 12px;
      border-radius: 10px;
      font-family: inherit;
      font-size: 14px;
      color: ${isDisabled ? textMuted : textPrimary};
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
      opacity: ${isDisabled ? 0.5 : 1};
      transition: background-color 120ms ease;
      &:focus-visible {
        outline: 2px solid ${focusColor};
        outline-offset: -2px;
        background: ${sunkenBg};
      }
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const itemIconCss = css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: ${textMuted};
      flex: none;
      width: 18px;
      height: 18px;
    `;

    const itemHintCss = css`
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      color: ${textMuted};
      white-space: nowrap;
      flex: none;
    `;

    const itemLabelCss = css`
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    `;

    const footerCss = css`
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 8px 14px;
      border-top: 1px solid ${hairline};
      background: ${sunkenBg};
      font-size: 11px;
      color: ${textMuted};
      flex: none;
    `;

    const footerKbdCss = css`
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 4px;
      border: 1px solid ${hairline};
      background: ${surfaceBg};
      color: ${textSecondary};
      margin-right: 4px;
    `;

    const emptyCss = css`
      padding: 32px 16px;
      text-align: center;
      color: ${textMuted};
      font-size: 13px;
    `;

    const renderListContent = () => {
      if (isLoading) {
        return (
          <li css={emptyCss} role="presentation">
            <span
              css={css`
                display: inline-flex;
                align-items: center;
                gap: 8px;
                justify-content: center;
              `}
            >
              <Spinner color={textMuted} />
              {loadingMessage}
            </span>
          </li>
        );
      }
      if (flat.length === 0) {
        return (
          <li css={emptyCss} role="presentation">
            {emptyMessage}
          </li>
        );
      }
      let runningIndex = 0;
      return filteredSections.map((section) => {
        const sectionItems = section.items.map((item) => {
          const flatIndex = runningIndex;
          runningIndex += 1;
          const isHighlighted = flatIndex === highlight;
          const isItemDisabled = !!item.isDisabled;
          const optionId = `${baseId}-opt-${flatIndex}`;
          return (
            <li key={item.id} role="presentation">
              <button
                type="button"
                role="option"
                id={optionId}
                data-flat-index={flatIndex}
                data-highlighted={isHighlighted || undefined}
                data-disabled={isItemDisabled || undefined}
                aria-selected={isHighlighted}
                aria-disabled={isItemDisabled || undefined}
                tabIndex={-1}
                disabled={isItemDisabled}
                onMouseEnter={() => !isItemDisabled && setHighlight(flatIndex)}
                onClick={() => handleSelect(item)}
                css={itemButtonCss(isHighlighted, isItemDisabled)}
              >
                {renderItem ? (
                  renderItem(item, { isHighlighted, isDisabled: isItemDisabled })
                ) : (
                  <>
                    {item.icon ? (
                      <span aria-hidden css={itemIconCss}>
                        {item.icon}
                      </span>
                    ) : null}
                    <span css={itemLabelCss}>{item.label}</span>
                    {item.hint ? <span css={itemHintCss}>{item.hint}</span> : null}
                  </>
                )}
              </button>
            </li>
          );
        });
        return (
          <li key={section.id} role="presentation">
            {section.title ? (
              <div role="presentation" css={sectionTitleCss}>
                {section.title}
              </div>
            ) : null}
            <ul
              role="presentation"
              css={css`
                list-style: none;
                margin: 0;
                padding: 0;
              `}
            >
              {sectionItems}
            </ul>
          </li>
        );
      });
    };

    if (!open || typeof document === 'undefined') return null;

    const activeDescendantId =
      flat.length > 0 && highlight >= 0 && highlight < flat.length
        ? `${baseId}-opt-${highlight}`
        : undefined;

    return createPortal(
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onMouseDown={onBackdropMouseDown}
        onKeyDown={onKeyDown}
        css={overlayCss}
      >
        <div
          ref={mergeRefs(dialogRef, forwardedRef)}
          id={baseId}
          className={className}
          style={style}
          css={dialogCss}
          data-loading={isLoading || undefined}
        >
          <div css={headerCss}>
            <span
              aria-hidden
              css={css`
                display: inline-flex;
                flex: none;
              `}
            >
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              aria-label={ariaLabel}
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={activeDescendantId}
              css={inputCss}
            />
            {showEscapeKey ? (
              <kbd aria-hidden css={escKbdCss}>
                {escapeKeyLabel}
              </kbd>
            ) : null}
          </div>

          <ul ref={listRef} id={listboxId} role="listbox" aria-label={ariaLabel} css={listCss}>
            {renderListContent()}
          </ul>

          {footer === false ? null : footer ? (
            <div css={footerCss}>{footer}</div>
          ) : flat.length > 0 ? (
            <div css={footerCss}>
              <span>
                <kbd css={footerKbdCss}>↑</kbd>
                <kbd css={footerKbdCss}>↓</kbd>
                Navigate
              </span>
              <span>
                <kbd css={footerKbdCss}>↵</kbd>
                Select
              </span>
              <span>
                <kbd css={footerKbdCss}>esc</kbd>
                Close
              </span>
              <span
                css={css`
                  margin-left: auto;
                `}
              >
                {flat.length} {flat.length === 1 ? 'result' : 'results'}
              </span>
            </div>
          ) : null}
        </div>
      </div>,
      document.body,
    );
  },
);

(SearchDialog as unknown as { displayName: string }).displayName = 'SearchDialog';

// ────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────

function findFirstEnabled(flat: Array<{ item: SearchDialogItem; sectionId: string }>): number {
  for (let i = 0; i < flat.length; i += 1) {
    if (!flat[i]!.item.isDisabled) return i;
  }
  return 0;
}

function findLastEnabled(flat: Array<{ item: SearchDialogItem; sectionId: string }>): number {
  for (let i = flat.length - 1; i >= 0; i -= 1) {
    if (!flat[i]!.item.isDisabled) return i;
  }
  return Math.max(0, flat.length - 1);
}
