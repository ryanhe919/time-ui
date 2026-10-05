/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 Steps 组件：多步流程指示器。支持 horizontal / vertical 方向，
 *              default / dot / navigation 三种 variant，自动状态推断 + 显式 status 覆盖，
 *              connector 填充动画 (scaleX 0→1) 与 reduced-motion 兜底。
 */

'use client';

import { forwardRef, useCallback, useId, useMemo, type KeyboardEvent, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';
import { useControllableState } from '../utils';
import type { StepItem, StepsProps, StepStatus } from './Steps.types';

/** 默认勾形 SVG icon（finish 状态），尺寸由父级 font-size 控制。 */
const CheckIcon = (): ReactNode => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="5 12 10 17 19 7" />
  </svg>
);

/** 默认错误 X SVG icon（error 状态）。 */
const CloseIcon = (): ReactNode => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

/** 计算每个 step 在当前 current 下的状态：显式 item.status 优先，其次按 index 推断。 */
function resolveStatus(
  item: StepItem,
  index: number,
  current: number,
  overallStatus: StepStatus,
): StepStatus {
  if (item.status) return item.status;
  if (index < current) return 'finish';
  if (index === current) return overallStatus;
  return 'wait';
}

/** 简短可读的状态文案（拼接进每个 step 的 aria-label）。 */
function statusLabel(s: StepStatus): string {
  switch (s) {
    case 'finish':
      return 'completed';
    case 'process':
      return 'in progress';
    case 'error':
      return 'error';
    case 'wait':
    default:
      return 'pending';
  }
}

export const Steps = forwardRef<HTMLOListElement, StepsProps>(function Steps(props, forwardedRef) {
  const {
    items,
    activeIndex: activeIndexProp,
    defaultActiveIndex,
    onActiveIndexChange,
    status: overallStatus = 'process',
    direction = 'horizontal',
    variant = 'default',
    size = 'md',
    isClickable,
    startContent,
    className,
    style,
    id,
    'aria-label': ariaLabel,
  } = props;

  const theme = useTheme();
  const isVertical = direction === 'vertical';
  const isDot = variant === 'dot';
  const isNav = variant === 'navigation';
  // navigation 默认可点击；其他 variant 由 isClickable 显式开启。
  const clickable = isClickable ?? isNav;

  // useControllableState 会在同时收到 value + defaultValue 时告警；受控时把 defaultValue 留空。
  const [activeIndex, setActiveIndex] = useControllableState<number>({
    value: activeIndexProp,
    defaultValue: (activeIndexProp !== undefined ? undefined : (defaultActiveIndex ?? 0)) as number,
    onChange: onActiveIndexChange,
    name: 'Steps',
  });

  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');
  const baseId = id ?? `timeui-steps-${safeAutoId}`;

  const sizeTokens = theme.components.stepsSize[size];
  const stepsTokens = theme.components.steps;

  const successColor = theme.colors.success[500];
  const primaryColor = theme.colors.primary[500];
  const dangerColor = theme.colors.danger[500];
  const borderDefault = theme.colors.border.default;
  const borderSubtle = theme.colors.border.subtle;
  const textPrimary = theme.colors.text.primary;
  const textSecondary = theme.colors.text.secondary;
  const textDisabled = theme.colors.text.disabled;
  const surfaceBg = theme.colors.bg.surface;
  const focusColor = theme.colors.border.focus ?? theme.colors.focus;

  // 防御性兜底：调用方传 undefined / null 时也能安全 .map / .length。
  const safeItems = useMemo<StepItem[]>(() => items ?? [], [items]);

  /**
   * 选中某个 step：跳过禁用项 / 不可点击模式 / 已是当前。
   * navigation variant 与 isClickable=true 共享同一逻辑。
   */
  const select = useCallback(
    (idx: number) => {
      if (!clickable) return;
      const target = safeItems[idx];
      if (!target || target.isDisabled) return;
      if (idx === activeIndex) return;
      setActiveIndex(idx);
    },
    [activeIndex, clickable, safeItems, setActiveIndex],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
      // navigation / clickable 模式下：Enter / Space 触发 select。
      if (!clickable) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select(idx);
      }
    },
    [clickable, select],
  );

  // ——— 颜色映射：每个状态对应 indicator 背景 / 边框 / 文本主色 ———
  const colorForStatus = (s: StepStatus): string => {
    switch (s) {
      case 'finish':
        return successColor;
      case 'process':
        return primaryColor;
      case 'error':
        return dangerColor;
      case 'wait':
      default:
        return borderDefault;
    }
  };

  // ——— 样式：根容器 ———
  const rootCss = css`
    display: flex;
    flex-direction: ${isVertical ? 'column' : 'row'};
    align-items: ${isVertical ? 'stretch' : 'flex-start'};
    gap: 0;
    list-style: none;
    margin: 0;
    padding: 0;
    font-family: inherit;
    color: ${textPrimary};
    width: 100%;
    box-sizing: border-box;
  `;

  // ——— 单个 step 的容器 ———
  // horizontal: 每个 step 平分整行，内部内容允许收缩，connector 填满剩余宽度。
  // vertical: 每个 step 是 row，icon 列固定宽，text 列 flex:1，connector 绝对定位在 icon 列下
  const itemCss = css`
    position: relative;
    display: flex;
    ${isVertical
      ? `
        flex-direction: row;
        align-items: flex-start;
        min-height: ${stepsTokens.verticalItemMinHeight};
        padding: 0;
      `
      : `
        flex-direction: row;
        align-items: flex-start;
        flex: 1 1 0;
        min-width: 0;
        padding: ${stepsTokens.itemPaddingY} 0;
      `}
    gap: ${sizeTokens.itemGap};
    box-sizing: border-box;
  `;

  // horizontal connector 位于两个 item 之间，flex:1 撑满。
  const horizontalConnectorWrapCss = css`
    position: relative;
    flex: 1 1 ${stepsTokens.connectorMinLength};
    min-width: 0;
    align-self: flex-start;
    margin-top: calc(
      ${sizeTokens.iconSize} / 2 - ${sizeTokens.connectorThickness} / 2 +
        ${stepsTokens.itemPaddingY}
    );
    height: ${sizeTokens.connectorThickness};
    border-radius: ${stepsTokens.connectorRadius};
    background-color: ${borderSubtle};
    overflow: hidden;
  `;

  // 填充层：scaleX 0→1，duration 320ms，origin 左。
  // 当前一个 step 的状态为 finish 时，填满成功色；否则保持空（wait 段）。
  const horizontalConnectorFillCss = (isFinished: boolean, prevStatus: StepStatus) => css`
    position: absolute;
    inset: 0;
    transform-origin: left center;
    transform: scaleX(${isFinished ? 1 : 0});
    transition: transform ${stepsTokens.connectorFillDuration} ease;
    background-color: ${prevStatus === 'error' ? dangerColor : successColor};
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;

  // vertical connector：竖直线，从当前 icon 底到下一 icon 顶。
  // 颜色：当前 step 已 finish → success；否则 border.subtle。
  const verticalConnectorCss = (isFinished: boolean, prevStatus: StepStatus) => css`
    position: absolute;
    left: calc(${sizeTokens.iconSize} / 2 - ${stepsTokens.verticalConnectorWidth} / 2);
    top: ${sizeTokens.iconSize};
    bottom: 0;
    width: ${stepsTokens.verticalConnectorWidth};
    background-color: ${borderSubtle};
    overflow: hidden;
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      transform-origin: top center;
      transform: scaleY(${isFinished ? 1 : 0});
      transition: transform ${stepsTokens.connectorFillDuration} ease;
      background-color: ${prevStatus === 'error' ? dangerColor : successColor};
    }
    @media (prefers-reduced-motion: reduce) {
      &::after {
        transition: none;
      }
    }
  `;

  // ——— indicator（圆形图标 / dot）———
  const indicatorCss = (s: StepStatus, isDisabled: boolean) => {
    if (isDot) {
      const dotSize = s === 'process' ? stepsTokens.dotActiveSize : stepsTokens.dotSize;
      return css`
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: ${sizeTokens.iconSize};
        height: ${sizeTokens.iconSize};
        position: relative;
        &::before {
          content: '';
          width: ${dotSize};
          height: ${dotSize};
          border-radius: 9999px;
          background-color: ${colorForStatus(s)};
          transition:
            background-color ${stepsTokens.iconTransitionDuration} ease,
            width ${stepsTokens.iconTransitionDuration} ease,
            height ${stepsTokens.iconTransitionDuration} ease;
        }
        @media (prefers-reduced-motion: reduce) {
          &::before {
            transition: none;
          }
        }
        ${isDisabled ? 'opacity: 0.5;' : ''}
      `;
    }

    // default / navigation: 圆 + 数字 / 勾 / X
    const isFilled = s === 'finish' || s === 'process' || s === 'error';
    const bg = isFilled ? colorForStatus(s) : 'transparent';
    const fg = isFilled
      ? theme.colors[s === 'finish' ? 'success' : s === 'process' ? 'primary' : 'danger'].foreground
      : textSecondary;
    const border = isFilled ? colorForStatus(s) : borderDefault;
    return css`
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: ${sizeTokens.iconSize};
      height: ${sizeTokens.iconSize};
      border-radius: ${stepsTokens.iconRadius};
      background-color: ${bg};
      color: ${fg};
      border: ${stepsTokens.iconBorderWidth} solid ${border};
      font-size: ${sizeTokens.fontSize};
      font-weight: ${stepsTokens.iconFontWeight};
      line-height: 1;
      transition:
        background-color ${stepsTokens.iconTransitionDuration} ease,
        border-color ${stepsTokens.iconTransitionDuration} ease,
        color ${stepsTokens.iconTransitionDuration} ease;
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
      ${isDisabled ? 'opacity: 0.5;' : ''}
    `;
  };

  // ——— 文本区（title / description）———
  const textWrapCss = css`
    display: flex;
    flex-direction: column;
    gap: ${stepsTokens.verticalDescGap};
    min-width: 0;
    flex: ${isVertical ? '1 1 auto' : '0 1 auto'};
    padding-bottom: ${isVertical ? stepsTokens.verticalIndent : '0'};
  `;

  const titleCss = (s: StepStatus, isDisabled: boolean) => css`
    font-size: ${sizeTokens.titleFontSize};
    font-weight: ${s === 'process' ? 600 : 500};
    color: ${isDisabled
      ? textDisabled
      : s === 'wait'
        ? textSecondary
        : s === 'error'
          ? dangerColor
          : textPrimary};
    line-height: 1.4;
    overflow-wrap: anywhere;
  `;

  const descCss = (isDisabled: boolean) => css`
    font-size: ${sizeTokens.descFontSize};
    font-weight: 400;
    color: ${isDisabled ? textDisabled : textSecondary};
    line-height: 1.4;
    overflow-wrap: anywhere;
  `;

  // navigation variant 的可点击按钮包裹。
  const navButtonCss = (isCurrent: boolean, isDisabled: boolean) => css`
    appearance: none;
    background: ${isCurrent ? theme.colors.bg.muted : surfaceBg};
    border: 0;
    padding: 8px 12px;
    border-radius: 8px;
    text-align: left;
    font: inherit;
    color: inherit;
    width: 100%;
    min-width: 0;
    flex: 1 1 auto;
    cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: ${sizeTokens.itemGap};
    transition: background-color ${stepsTokens.iconTransitionDuration} ease;
    &:hover {
      background-color: ${isDisabled ? undefined : theme.colors.bg.muted};
    }
    &:focus-visible {
      outline: 2px solid ${focusColor};
      outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `;

  // 静态可点击容器（isClickable=true 但非 navigation）：渲染 button 但保持原视觉。
  const plainButtonCss = (isDisabled: boolean) => css`
    appearance: none;
    background: transparent;
    border: 0;
    padding: 0;
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: ${sizeTokens.itemGap};
    width: ${isVertical ? '100%' : 'auto'};
    min-width: 0;
    flex: 0 1 auto;
    &:focus-visible {
      outline: 2px solid ${focusColor};
      outline-offset: 2px;
      border-radius: 4px;
    }
  `;

  /** 渲染单个 step 的内部内容（indicator + 文本）。 */
  const renderStepContent = (
    item: StepItem,
    idx: number,
    s: StepStatus,
    isDisabled: boolean,
  ): ReactNode => {
    let iconNode: ReactNode;
    if (item.icon !== undefined) {
      iconNode = item.icon;
    } else if (isDot) {
      iconNode = null;
    } else if (s === 'finish') {
      iconNode = <CheckIcon />;
    } else if (s === 'error') {
      iconNode = <CloseIcon />;
    } else {
      iconNode = idx + 1;
    }

    return (
      <>
        <span
          aria-hidden="true"
          data-steps-indicator=""
          data-status={s}
          css={indicatorCss(s, isDisabled)}
        >
          {iconNode}
        </span>
        <span css={textWrapCss}>
          <span data-steps-title="" css={titleCss(s, isDisabled)}>
            {item.title}
          </span>
          {item.description !== undefined && item.description !== null ? (
            <span data-steps-description="" css={descCss(isDisabled)}>
              {item.description}
            </span>
          ) : null}
        </span>
      </>
    );
  };

  return (
    <ol
      ref={forwardedRef}
      id={id}
      className={className}
      style={style}
      role="list"
      aria-label={ariaLabel}
      data-orientation={isVertical ? 'vertical' : 'horizontal'}
      data-variant={variant}
      data-size={size}
      css={rootCss}
    >
      {startContent ? (
        <li
          role="presentation"
          data-steps-start-content=""
          css={css`
            flex: none;
          `}
        >
          {startContent}
        </li>
      ) : null}
      {safeItems.map((item, idx) => {
        const itemKey = item.itemKey ?? `${idx}`;
        const itemId = `${baseId}-item-${itemKey}`;
        const s = resolveStatus(item, idx, activeIndex, overallStatus);
        const isCurrent = idx === activeIndex;
        const isDisabled = !!item.isDisabled;
        const isLast = idx === safeItems.length - 1;

        // step 的可读状态描述（用于补充 aria-label）。
        const titleText =
          typeof item.title === 'string' || typeof item.title === 'number'
            ? String(item.title)
            : `Step ${idx + 1}`;
        const fullAriaLabel = `${titleText}, step ${idx + 1} of ${safeItems.length}, ${statusLabel(
          s,
        )}`;

        // connector 是否填实色：取决于当前 step 的状态。
        // 对于 horizontal：current step 与 next step 之间的 connector，由 current step 的状态决定。
        // 对于 vertical：同理。当 current step 状态为 finish/error → connector 着色。
        const isConnectorFinished = s === 'finish';

        const stepInner = renderStepContent(item, idx, s, isDisabled);

        // navigation：整 step 渲染为 button；isClickable 也渲染 button 但视觉简化。
        const useButton = isNav || clickable;
        const wrapped = useButton ? (
          <button
            type="button"
            id={itemId}
            disabled={isDisabled}
            aria-disabled={isDisabled || undefined}
            aria-current={isCurrent ? 'step' : undefined}
            aria-label={fullAriaLabel}
            data-steps-button=""
            data-status={s}
            data-current={isCurrent || undefined}
            onClick={() => select(idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            css={isNav ? navButtonCss(isCurrent, isDisabled) : plainButtonCss(isDisabled)}
          >
            {stepInner}
          </button>
        ) : (
          <div
            id={itemId}
            data-status={s}
            data-current={isCurrent || undefined}
            aria-label={fullAriaLabel}
            css={css`
              display: flex;
              flex-direction: row;
              align-items: flex-start;
              gap: ${sizeTokens.itemGap};
              width: ${isVertical ? '100%' : 'auto'};
              min-width: 0;
              flex: 0 1 auto;
            `}
          >
            {stepInner}
          </div>
        );

        return (
          <li
            key={itemKey}
            role="listitem"
            aria-current={isCurrent ? 'step' : undefined}
            data-steps-item=""
            data-status={s}
            data-current={isCurrent || undefined}
            data-disabled={isDisabled || undefined}
            css={[
              itemCss,
              isVertical
                ? css`
                    flex: none;
                    width: 100%;
                  `
                : css`
                    flex: 1 1 0;
                  `,
            ]}
          >
            {wrapped}
            {/* connector 渲染：最后一个 step 不需要 */}
            {!isLast && !isVertical ? (
              <span aria-hidden="true" data-steps-connector="" css={horizontalConnectorWrapCss}>
                <span css={horizontalConnectorFillCss(isConnectorFinished, s)} />
              </span>
            ) : null}
            {!isLast && isVertical ? (
              <span
                aria-hidden="true"
                data-steps-connector=""
                css={verticalConnectorCss(isConnectorFinished, s)}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
});

(Steps as unknown as { displayName: string }).displayName = 'TimeUI.Steps';
