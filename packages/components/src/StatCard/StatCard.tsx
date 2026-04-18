/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-18
 * @description 实现 StatCard 组件：KPI 场景专用。标签 uppercase、数值 tabular-nums、delta pill + arrow tick 动画、
 *   可选 icon 容器、trend 插槽（bleed 或 non-bleed）、inline skeleton 骨架态。透传 Card 的治理能力。
 */

'use client';

import { forwardRef, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { css, useTheme } from '@emotion/react';
import { useI18n } from '@timeui/core';
import { Card, CURVES, DURATIONS } from '../Card/Card';
import type { CardSize } from '../Card/Card.types';
import type {
  StatCardDeltaDirection,
  StatCardDeltaPolarity,
  StatCardEmphasis,
  StatCardProps,
} from './StatCard.types';
import { ArrowUpIcon, ArrowDownIcon, FlatIcon } from './icons';

// ────────────────────────────────────────────────────────────
// Interpolation helper（与 Upload 同构，仅本文件使用）
// ────────────────────────────────────────────────────────────

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    Object.prototype.hasOwnProperty.call(params, k) ? String(params[k]) : `{${k}}`,
  );
}

// ────────────────────────────────────────────────────────────
// 尺寸维度表
// ────────────────────────────────────────────────────────────

const LABEL_SIZE: Record<CardSize, number> = { sm: 11, md: 12, lg: 13 };
const LABEL_SIZE_CJK: Record<CardSize, number> = { sm: 12, md: 13, lg: 14 };
const VALUE_FONT_SIZE: Record<StatCardEmphasis, number> = {
  subtle: 20,
  default: 28,
  strong: 36,
};
const VALUE_FONT_WEIGHT: Record<StatCardEmphasis, number> = {
  subtle: 500,
  default: 600,
  strong: 700,
};
const VALUE_TRACKING: Record<StatCardEmphasis, string> = {
  subtle: '-0.005em',
  default: '-0.015em',
  strong: '-0.025em',
};
const VALUE_LINE_HEIGHT: Record<StatCardEmphasis, number> = {
  subtle: 1.3,
  default: 1.2,
  strong: 1.1,
};
const DELTA_HEIGHT: Record<CardSize, number> = { sm: 16, md: 18, lg: 20 };
const DELTA_FONT_SIZE: Record<CardSize, number> = { sm: 10, md: 11, lg: 12 };
const DELTA_TRANSLATE_Y: Record<CardSize, number> = { sm: -2, md: -3, lg: -4 };
const ICON_SIZE: Record<CardSize, number> = { sm: 28, md: 32, lg: 40 };
const SKELETON_VALUE_HEIGHT: Record<StatCardEmphasis, number> = {
  subtle: 20,
  default: 28,
  strong: 36,
};
const CONTAINER_PADDING: Record<CardSize, number> = { sm: 12, md: 16, lg: 24 };

// ────────────────────────────────────────────────────────────
// 辅助
// ────────────────────────────────────────────────────────────

function isCJK(x: unknown): boolean {
  return typeof x === 'string' && /[\u4e00-\u9fff]/.test(x);
}

function resolvePolarity(
  direction: StatCardDeltaDirection | undefined,
  polarity: StatCardDeltaPolarity | undefined,
): 'positive' | 'negative' | 'neutral' {
  const p = polarity ?? 'auto';
  if (p !== 'auto') return p;
  if (direction === 'up') return 'positive';
  if (direction === 'down') return 'negative';
  return 'neutral';
}

// ────────────────────────────────────────────────────────────
// 组件
// ────────────────────────────────────────────────────────────

export const StatCard = forwardRef<HTMLElement, StatCardProps>(function StatCard(props, ref) {
  const {
    // pass-through to Card
    variant,
    color = 'default',
    size = 'md',
    radius,
    fullWidth,
    isPressable,
    isHoverable,
    isDisabled,
    accentBar,
    as,
    href,
    target,
    rel,
    onPress,
    onClick,
    className,
    style,
    'aria-label': ariaLabel,

    // StatCard-own
    label,
    value,
    description,
    icon,
    iconPlacement = 'start',
    delta,
    trend,
    trendBleed = false,
    isLoading = false,
    emphasis = 'default',
    valueAlign = 'start',
    sr,
    classNames,
  } = props;

  const theme = useTheme();
  const isDark = theme.mode === 'dark';
  const i18n = useI18n();

  // Arrow tick key —— 每次 direction / value 改变 +1，触发 @keyframes 重播
  const [tickKey, setTickKey] = useState(0);
  useEffect(() => {
    setTickKey((k) => k + 1);
  }, [delta?.direction, delta?.value]);

  const polarity = resolvePolarity(delta?.direction, delta?.polarity);
  const direction: StatCardDeltaDirection = delta?.direction ?? 'flat';

  // delta colors
  let deltaBg = theme.colors.bg.muted;
  let deltaFg = theme.colors.text.secondary;
  if (polarity === 'positive') {
    deltaBg = theme.colors.status.successBg ?? theme.colors.success[100] ?? theme.colors.bg.muted;
    deltaFg = theme.colors.status.success ?? theme.colors.success[600] ?? theme.colors.text.primary;
  } else if (polarity === 'negative') {
    deltaBg = theme.colors.status.dangerBg ?? theme.colors.danger[100] ?? theme.colors.bg.muted;
    deltaFg = theme.colors.status.danger ?? theme.colors.danger[600] ?? theme.colors.text.primary;
  }

  // Icon container palette
  const iconPalette =
    color === 'default'
      ? { bg: theme.colors.bg.muted, fg: theme.colors.text.secondary }
      : {
          bg: theme.colors[color]?.[100] ?? theme.colors.bg.muted,
          fg: theme.colors[color]?.[600] ?? theme.colors.text.primary,
        };

  // ── delta aria-label ───────────────────────────────────
  const valueStr = typeof delta?.value === 'string' ? delta.value : undefined;
  const directionWord =
    direction === 'up'
      ? i18n.statCard.directionUp
      : direction === 'down'
        ? i18n.statCard.directionDown
        : i18n.statCard.directionFlat;
  let deltaAriaLabel: string | undefined;
  if (delta) {
    if (sr?.deltaLabel) {
      deltaAriaLabel = sr.deltaLabel;
    } else if (valueStr !== undefined) {
      const tmpl =
        direction === 'up'
          ? i18n.statCard.deltaUp
          : direction === 'down'
            ? i18n.statCard.deltaDown
            : i18n.statCard.deltaFlat;
      deltaAriaLabel = interpolate(tmpl, { value: valueStr });
    } else {
      deltaAriaLabel = directionWord;
    }
  }

  // ── CJK label 判定 ────────────────────────────────────
  const labelCJK = isCJK(label);
  const labelFontSize = labelCJK ? LABEL_SIZE_CJK[size] : LABEL_SIZE[size];

  // ── container padding（trend bleed 需要） ───────────────
  const pad = CONTAINER_PADDING[size];

  // ── Skeleton 状态 ─────────────────────────────────────
  if (isLoading) {
    return (
      <Card
        ref={ref as never}
        variant={variant}
        color={color}
        size={size}
        radius={radius}
        fullWidth={fullWidth}
        isPressable={isPressable}
        isHoverable={isHoverable}
        isDisabled={isDisabled}
        accentBar={accentBar}
        as={as}
        href={href}
        target={target}
        rel={rel}
        onPress={onPress}
        onClick={onClick}
        className={className}
        style={style}
        classNames={classNames}
        data-loading="true"
        aria-label={ariaLabel ?? i18n.statCard.loading}
      >
        <div
          role="status"
          aria-label={i18n.statCard.loading}
          aria-busy="true"
          data-slot="statcard-skeleton"
          css={css`
            display: flex;
            align-items: flex-start;
            gap: 12px;

            @keyframes timeui-statcard-breathe {
              0%,
              100% {
                opacity: 0.5;
              }
              50% {
                opacity: 0.9;
              }
            }

            [data-slot='sk-el'] {
              background: ${theme.colors.bg.muted};
              border-radius: 4px;
              animation: timeui-statcard-breathe ${DURATIONS.skeleton} ease-in-out infinite;
            }

            @media (prefers-reduced-motion: reduce) {
              [data-slot='sk-el'] {
                animation: none;
                opacity: 0.65;
              }
            }
          `}
        >
          {icon !== undefined ? (
            <span
              data-slot="sk-el"
              css={css`
                width: ${ICON_SIZE[size]}px;
                height: ${ICON_SIZE[size]}px;
                border-radius: ${theme.componentRadius.sm};
                flex: none;
              `}
            />
          ) : null}
          <span
            css={css`
              display: flex;
              flex-direction: column;
              gap: 8px;
              flex: 1 1 auto;
              min-width: 0;
            `}
          >
            <span
              data-slot="sk-el"
              css={css`
                width: 60px;
                height: 12px;
              `}
            />
            <span
              css={css`
                display: flex;
                align-items: center;
                gap: 8px;
              `}
            >
              <span
                data-slot="sk-el"
                css={css`
                  width: 120px;
                  height: ${SKELETON_VALUE_HEIGHT[emphasis]}px;
                `}
              />
              {delta !== undefined ? (
                <span
                  data-slot="sk-el"
                  css={css`
                    width: 56px;
                    height: 18px;
                    border-radius: 999px;
                  `}
                />
              ) : null}
            </span>
          </span>
        </div>
      </Card>
    );
  }

  // ── 常规渲染 ──────────────────────────────────────────
  const iconBox =
    icon !== undefined ? (
      <span
        data-slot="icon"
        className={classNames?.icon}
        aria-hidden={true}
        css={css`
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: none;
          width: ${ICON_SIZE[size]}px;
          height: ${ICON_SIZE[size]}px;
          border-radius: ${theme.componentRadius.sm};
          background: ${iconPalette.bg};
          color: ${iconPalette.fg};
          box-shadow:
            inset 0 1px 0 ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.5)'},
            inset 0 0 0 1px rgba(17, 24, 39, 0.02);
          transition: transform ${DURATIONS.hoverIn} ${CURVES.weighty};

          [data-pressable='true']:hover > & {
            transform: scale(1.04);
          }

          @media (prefers-reduced-motion: reduce) {
            transition: none;
            [data-pressable='true']:hover > & {
              transform: none;
            }
          }
        `}
      >
        {icon}
      </span>
    ) : null;

  const deltaNode: ReactNode = delta ? (
    <span
      data-slot="delta"
      data-direction={direction}
      data-polarity={polarity}
      className={classNames?.delta}
      aria-label={deltaAriaLabel}
      role="status"
      css={css`
        display: inline-flex;
        align-items: center;
        gap: 4px;
        height: ${DELTA_HEIGHT[size]}px;
        padding: 0 6px;
        border-radius: 999px;
        background: ${deltaBg};
        color: ${deltaFg};
        font-size: ${DELTA_FONT_SIZE[size]}px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        line-height: 1;
        box-shadow: inset 0 -1px 0
          ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(17, 24, 39, 0.04)'};
        transform: translateY(${DELTA_TRANSLATE_Y[size]}px);
        transition:
          background-color ${DURATIONS.hoverIn} ${CURVES.linear},
          color ${DURATIONS.hoverIn} ${CURVES.linear};

        @keyframes timeui-delta-tick-up {
          0% {
            transform: translateY(-3px) scale(0.8);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes timeui-delta-tick-down {
          0% {
            transform: translateY(3px) scale(0.8);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes timeui-delta-tick-flat {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        [data-slot='delta-arrow'] {
          display: inline-flex;
          animation-duration: ${DURATIONS.deltaTick};
          animation-timing-function: ${CURVES.tick};
          animation-fill-mode: forwards;
        }
        [data-slot='delta-arrow'][data-direction='up'] {
          animation-name: timeui-delta-tick-up;
        }
        [data-slot='delta-arrow'][data-direction='down'] {
          animation-name: timeui-delta-tick-down;
        }
        [data-slot='delta-arrow'][data-direction='flat'] {
          animation-name: timeui-delta-tick-flat;
        }

        @media (prefers-reduced-motion: reduce) {
          [data-slot='delta-arrow'] {
            animation: none;
          }
          transition: none;
        }
      `}
    >
      <span key={tickKey} data-slot="delta-arrow" data-direction={direction} aria-hidden={true}>
        {direction === 'up' ? (
          <ArrowUpIcon />
        ) : direction === 'down' ? (
          <ArrowDownIcon />
        ) : (
          <FlatIcon />
        )}
      </span>
      <span>{delta.value}</span>
    </span>
  ) : null;

  const labelNode = (
    <span
      data-slot="label"
      className={classNames?.label}
      css={css`
        font-size: ${labelFontSize}px;
        font-weight: 600;
        line-height: 1.4;
        color: ${theme.colors.text.secondary};
        ${labelCJK
          ? css`
              text-transform: none;
              letter-spacing: 0.02em;
            `
          : css`
              text-transform: uppercase;
              letter-spacing: 0.08em;
            `}
      `}
    >
      {label}
    </span>
  );

  const valueNode = (
    <span
      data-slot="value"
      className={classNames?.value}
      aria-label={sr?.valueLabel}
      css={css`
        font-size: ${VALUE_FONT_SIZE[emphasis]}px;
        font-weight: ${VALUE_FONT_WEIGHT[emphasis]};
        letter-spacing: ${VALUE_TRACKING[emphasis]};
        line-height: ${VALUE_LINE_HEIGHT[emphasis]};
        color: ${theme.colors.text.primary};
        font-variant-numeric: tabular-nums slashed-zero;
        font-feature-settings:
          'tnum' 1,
          'lnum' 1;
        display: inline-block;
        min-width: 0;
      `}
    >
      {value}
    </span>
  );

  const descriptionNode =
    description !== undefined ? (
      <span
        data-slot="description"
        className={classNames?.description}
        css={css`
          font-size: 13px;
          line-height: 1.5;
          color: ${theme.colors.text.secondary};
        `}
      >
        {description}
      </span>
    ) : null;

  const trendNode =
    trend !== undefined ? (
      <div
        data-slot="trend"
        data-bleed={trendBleed || undefined}
        className={classNames?.trend}
        css={
          trendBleed
            ? css`
                margin: 12px -${pad}px -${pad}px;
                padding: 12px ${pad}px;
                border-top: 0;
                box-shadow: inset 0 1px 0 ${theme.colors.border.subtle};
                border-end-start-radius: inherit;
                border-end-end-radius: inherit;
              `
            : css`
                margin-top: 12px;
                padding-top: 8px;
                border-top: 1px solid ${theme.colors.border.subtle};
              `
        }
      >
        {trend}
      </div>
    ) : null;

  return (
    <Card
      ref={ref as never}
      variant={variant}
      color={color}
      size={size}
      radius={radius}
      fullWidth={fullWidth}
      isPressable={isPressable}
      isHoverable={isHoverable}
      isDisabled={isDisabled}
      accentBar={accentBar}
      as={as}
      href={href}
      target={target}
      rel={rel}
      onPress={onPress}
      onClick={onClick}
      className={className}
      style={style}
      classNames={classNames}
      aria-label={ariaLabel}
      data-statcard="true"
    >
      <div
        data-slot="statcard-row"
        css={css`
          display: flex;
          align-items: flex-start;
          gap: 12px;
          ${valueAlign === 'center'
            ? css`
                justify-content: center;
                text-align: center;
              `
            : css``}
        `}
      >
        {icon !== undefined && iconPlacement === 'start' ? iconBox : null}
        <div
          data-slot="statcard-content"
          css={css`
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1 1 auto;
            min-width: 0;
            ${valueAlign === 'center'
              ? css`
                  align-items: center;
                  text-align: center;
                `
              : css``}
          `}
        >
          {labelNode}
          <span
            data-slot="value-row"
            css={css`
              display: flex;
              align-items: baseline;
              gap: 8px;
              flex-wrap: wrap;
              ${valueAlign === 'center'
                ? css`
                    justify-content: center;
                  `
                : css``}
            `}
          >
            {valueNode}
            {deltaNode}
          </span>
          {descriptionNode}
        </div>
        {icon !== undefined && iconPlacement === 'end' ? iconBox : null}
      </div>
      {trendNode}
    </Card>
  );
}) as <T extends HTMLElement = HTMLElement>(
  props: StatCardProps & { ref?: React.Ref<T> },
) => ReactElement;

(StatCard as unknown as { displayName: string }).displayName = 'TimeUI.StatCard';
