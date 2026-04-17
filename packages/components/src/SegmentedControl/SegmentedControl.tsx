/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 SegmentedControl 组件：iOS 风格分段选择器，原生 radio + 滑动 indicator。
 */

'use client';

import { forwardRef, useCallback, useId, useMemo, type ChangeEvent } from 'react';
import { css, useTheme } from '@emotion/react';
import { useControllableState } from '../utils';
import type {
  SegmentedControlColor,
  SegmentedControlOption,
  SegmentedControlProps,
} from './SegmentedControl.types';

function findFirstEnabled<V extends string>(
  options: ReadonlyArray<SegmentedControlOption<V>>,
): V | undefined {
  for (const opt of options) {
    if (!opt.isDisabled) return opt.value;
  }
  return undefined;
}

const SegmentedControlInner = forwardRef<HTMLDivElement, SegmentedControlProps<string>>(
  function SegmentedControl(props, forwardedRef) {
    const {
      options,
      value,
      defaultValue,
      onChange,
      color = 'primary',
      size = 'md',
      orientation = 'horizontal',
      isDisabled = false,
      isReadOnly = false,
      isInvalid = false,
      isRequired = false,
      isFullWidth = false,
      label,
      name,
      className,
      style,
      id,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
    } = props;

    const theme = useTheme();
    const isVertical = orientation === 'vertical';

    const fallback = defaultValue ?? findFirstEnabled(options);
    const [selected, setSelected] = useControllableState<string | undefined>({
      value,
      defaultValue: (value !== undefined ? undefined : fallback) as string | undefined,
      onChange: onChange as ((v: string | undefined) => void) | undefined,
      name: 'SegmentedControl',
    });

    const autoId = useId();
    const safeAutoId = autoId.replace(/:/g, '');
    const baseId = id ?? `timeui-segmented-${safeAutoId}`;
    const labelId = label ? `${baseId}-label` : undefined;
    const sharedName = name ?? `timeui-segmented-name-${safeAutoId}`;

    const selectedIndex = useMemo(
      () => options.findIndex((o) => o.value === selected),
      [options, selected],
    );
    const hasIndicator = selectedIndex >= 0 && options.length > 0;

    // 纯图标模式：所有选项的 label 都不是文本（字符串 / 数字），即用户只渲染了图标节点。
    // 既覆盖 `{ label: <Icon /> }` 的直觉写法，也覆盖 `{ label: null, icon: <Icon /> }`。
    // 此时 segment 切换成正方形 + 正圆 indicator。
    const isIconOnly = useMemo(
      () =>
        options.length > 0 &&
        options.every((o) => {
          const isTextual =
            (typeof o.label === 'string' && o.label.length > 0) || typeof o.label === 'number';
          return !isTextual;
        }),
      [options],
    );

    const resolvedColor: SegmentedControlColor = isInvalid ? 'danger' : color;
    const palette = theme.colors[resolvedColor];
    const focusColor = theme.colors.border.focus ?? theme.colors.focus;

    const sizeTokens = theme.components.segmentedControl[size];
    const { height, fontSize, paddingX, iconSize, gap, innerPadding, verticalWidth } = sizeTokens;
    // 正方 segment 的边长（去掉 track 内 padding 后的高度），用于 icon-only 模式。
    const segmentDim = `calc(${height} - 2 * ${innerPadding})`;

    const trackBg = theme.colors.default[100];
    const indicatorBg = theme.colors.bg.raised;
    const textPrimary = theme.colors.text.primary;
    const textSecondary = theme.colors.text.secondary;
    const textDisabled = theme.colors.text.disabled;

    const duration = theme.motion.duration.normal;
    const motionEasing = theme.motion.easing as {
      emphasized?: string;
      standard?: string;
      easeInOut: string;
    };
    const easing = motionEasing.emphasized ?? motionEasing.standard ?? motionEasing.easeInOut;

    const n = options.length;
    const segmentSizePct = n > 0 ? 100 / n : 100;
    const indicatorTransform = isVertical
      ? `translateY(${selectedIndex * 100}%)`
      : `translateX(${selectedIndex * 100}%)`;

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const next = e.currentTarget.value;
        if (isReadOnly) {
          // 只读：浏览器会乐观切换 checked，立即回滚到当前受控值。
          e.currentTarget.checked = selected === next;
          return;
        }
        if (selected === next) return;
        setSelected(next);
      },
      [isReadOnly, selected, setSelected],
    );

    // input 透明覆盖整个 segment：focus-visible 时 outline 渲染在 segment 边缘。
    // 用 :focus-visible 而非 :focus-within，避免鼠标点击后残留蓝色边框。
    const overlayInput = css`
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      border: 0;
      appearance: none;
      background: transparent;
      opacity: 0;
      border-radius: 9999px;
      cursor: inherit;
      &:focus-visible {
        outline: 2px solid ${focusColor};
        outline-offset: 2px;
      }
    `;

    const trackCss = css`
      position: relative;
      display: ${isFullWidth && !isVertical && !isIconOnly ? 'grid' : 'inline-grid'};
      ${isVertical
        ? `grid-auto-flow: row; grid-auto-rows: 1fr;`
        : `grid-auto-flow: column; grid-auto-columns: 1fr;`}
      ${isVertical
        ? `width: ${isIconOnly ? 'auto' : verticalWidth};${
            isIconOnly ? '' : ` height: calc(${n} * ${height} + 2 * ${innerPadding});`
          }`
        : `height: ${height};`}
      align-items: stretch;
      justify-items: stretch;
      padding: ${innerPadding};
      background-color: ${trackBg};
      /* 纵向：track 圆角 = 单行 indicator 的 pill 半径 + padding，
         使顶/底行选中时 indicator 的圆弧与 track 外边恰好同心；
         横向：单行高度 → 9999 即整体 pill。 */
      border-radius: ${isVertical ? `calc(${height} / 2 + ${innerPadding})` : '9999px'};
      box-sizing: border-box;
      isolation: isolate;
      ${isInvalid ? `box-shadow: 0 0 0 1px ${palette.DEFAULT};` : ''}
      ${isDisabled ? `opacity: 0.5; pointer-events: none;` : ''}
    `;

    // 横向：indicator 上下 inset = innerPadding，自然撑出 segmentDim 高度；
    //       icon-only 时宽 = segmentDim → 正圆；否则宽 = 等分宽度 → 椭圆。
    // 纵向：indicator 左右 inset = innerPadding，自然撑出 segmentDim 宽度；同理切换 height。
    const indicatorCss = css`
      position: absolute;
      z-index: 0;
      background-color: ${indicatorBg};
      border-radius: 9999px;
      box-shadow: ${theme.shadows.sm};
      pointer-events: none;
      opacity: ${hasIndicator ? 1 : 0};
      transition:
        transform ${duration} ${easing},
        opacity ${duration} ${easing};
      transform: ${indicatorTransform};
      ${isVertical
        ? `top: ${innerPadding}; left: ${innerPadding}; right: ${innerPadding}; ${
            isIconOnly
              ? `width: ${segmentDim}; height: ${segmentDim};`
              : `height: calc((100% - 2 * ${innerPadding}) / ${n});`
          }`
        : `top: ${innerPadding}; bottom: ${innerPadding}; left: ${innerPadding}; ${
            isIconOnly
              ? `width: ${segmentDim}; height: ${segmentDim};`
              : `width: calc((100% - 2 * ${innerPadding}) / ${n});`
          }`}
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const segmentCss = (isOptionDisabled: boolean, isSelected: boolean) => css`
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${gap};
      padding: ${isIconOnly ? '0' : `0 ${paddingX}`};
      min-width: 0;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      border-radius: 9999px;
      font-size: ${fontSize};
      font-weight: ${isSelected ? 600 : 500};
      color: ${isOptionDisabled
        ? textDisabled
        : isSelected
          ? resolvedColor === 'default'
            ? textPrimary
            : palette.DEFAULT
          : textSecondary};
      background-color: transparent;
      cursor: ${isDisabled || isOptionDisabled
        ? 'not-allowed'
        : isReadOnly
          ? 'default'
          : 'pointer'};
      user-select: none;
      white-space: nowrap;
      transition:
        color ${duration} ${easing},
        font-weight ${duration} ${easing};
      @media (prefers-reduced-motion: reduce) {
        transition: none;
      }
    `;

    const iconCss = css`
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${iconSize};
      height: ${iconSize};
      flex: none;
      font-size: ${iconSize};
      & > svg {
        display: block;
        flex: none;
      }
    `;

    const wrapperCss = css`
      display: ${isFullWidth && !isVertical ? 'block' : 'inline-block'};
      font-family: inherit;
    `;

    return (
      <div
        ref={forwardedRef}
        id={id}
        className={className}
        style={style}
        css={wrapperCss}
        data-orientation={isVertical ? 'vertical' : 'horizontal'}
        data-disabled={isDisabled || undefined}
        data-readonly={isReadOnly || undefined}
        data-invalid={isInvalid || undefined}
        data-icon-only={isIconOnly || undefined}
      >
        {label ? (
          <span
            id={labelId}
            css={css`
              display: block;
              font-size: 13px;
              line-height: 1.4;
              font-weight: 500;
              color: ${textPrimary};
              margin-bottom: 6px;
            `}
          >
            {label}
            {isRequired ? (
              <span
                aria-hidden="true"
                css={css`
                  color: ${theme.colors.status.danger};
                  margin-inline-start: 2px;
                `}
              >
                *
              </span>
            ) : null}
          </span>
        ) : null}
        <div
          role="radiogroup"
          aria-label={!label && !ariaLabelledBy ? ariaLabel : undefined}
          aria-labelledby={ariaLabelledBy ?? labelId}
          aria-describedby={ariaDescribedBy}
          aria-orientation={isVertical ? 'vertical' : 'horizontal'}
          aria-disabled={isDisabled || undefined}
          aria-readonly={isReadOnly || undefined}
          aria-invalid={isInvalid || undefined}
          aria-required={isRequired || undefined}
          data-segmented-track=""
          css={trackCss}
          style={
            {
              gridTemplateColumns: !isVertical
                ? isIconOnly
                  ? `repeat(${n}, ${segmentDim})`
                  : `repeat(${n}, ${segmentSizePct}%)`
                : undefined,
              gridTemplateRows: isVertical
                ? isIconOnly
                  ? `repeat(${n}, ${segmentDim})`
                  : `repeat(${n}, ${height})`
                : undefined,
            } as React.CSSProperties
          }
        >
          <span aria-hidden css={indicatorCss} />
          {options.map((opt, idx) => {
            const optionDisabled = !!opt.isDisabled || isDisabled;
            const isSelected = idx === selectedIndex;
            const inputId = `${baseId}-option-${idx}`;
            const accessibleName =
              opt['aria-label'] ?? (typeof opt.label === 'string' ? opt.label : undefined);
            // icon-only 模式下 label 节点本身就是图标，回退到 opt.icon 兼容显式 icon 写法。
            const iconNode = isIconOnly ? (opt.icon ?? opt.label) : opt.icon;
            const showLabel =
              !isIconOnly && opt.label !== undefined && opt.label !== null && opt.label !== false;
            return (
              <label
                key={`${opt.value}-${idx}`}
                htmlFor={inputId}
                data-selected={isSelected || undefined}
                data-disabled={optionDisabled || undefined}
                css={segmentCss(optionDisabled, isSelected)}
              >
                <input
                  id={inputId}
                  type="radio"
                  role="radio"
                  name={sharedName}
                  value={opt.value}
                  checked={isSelected}
                  disabled={optionDisabled}
                  readOnly={isReadOnly}
                  required={isRequired && idx === 0}
                  aria-label={accessibleName}
                  aria-checked={isSelected}
                  aria-invalid={isInvalid || undefined}
                  onChange={handleChange}
                  css={overlayInput}
                />
                {iconNode ? (
                  <span aria-hidden css={iconCss}>
                    {iconNode}
                  </span>
                ) : null}
                {showLabel ? <span data-segmented-label="">{opt.label}</span> : null}
              </label>
            );
          })}
        </div>
      </div>
    );
  },
);

(SegmentedControlInner as unknown as { displayName: string }).displayName = 'SegmentedControl';

export const SegmentedControl = SegmentedControlInner as unknown as <V extends string = string>(
  props: SegmentedControlProps<V> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement;
