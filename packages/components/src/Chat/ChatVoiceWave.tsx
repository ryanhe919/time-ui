/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 实现 ChatVoiceWave 组件：录音 / 语音输入激活时的动态声波指示器。
 */

'use client';

import { forwardRef, useId, useMemo } from 'react';
import { css, useTheme } from '@emotion/react';
import type { ChatCommonStyleProps } from './Chat.types';

export type ChatVoiceWaveSize = 'sm' | 'md' | 'lg';
export type ChatVoiceWaveColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger';

export interface ChatVoiceWaveProps extends ChatCommonStyleProps {
  /** 是否激活动画。inactive 时 bars 静止在最小高度。默认 true。 */
  isActive?: boolean;
  /** Bar 数量，奇数视觉对称更好。默认 4。 */
  bars?: number;
  /** 配色。默认 primary。 */
  color?: ChatVoiceWaveColor;
  /** 尺寸：sm / md / lg。默认 md。 */
  size?: ChatVoiceWaveSize;
  /** 屏幕阅读器朗读文本，默认 "Recording"。 */
  'aria-label'?: string;
}

const SIZE_TOKENS: Record<
  ChatVoiceWaveSize,
  { container: string; barWidth: string; barMaxHeight: string; gap: string }
> = {
  sm: { container: '14px', barWidth: '2px', barMaxHeight: '12px', gap: '2px' },
  md: { container: '16px', barWidth: '2.5px', barMaxHeight: '14px', gap: '2.5px' },
  lg: { container: '20px', barWidth: '3px', barMaxHeight: '18px', gap: '3px' },
};

export const ChatVoiceWave = forwardRef<HTMLDivElement, ChatVoiceWaveProps>(function ChatVoiceWave(
  {
    isActive = true,
    bars = 4,
    color = 'primary',
    size = 'md',
    className,
    style,
    id,
    'aria-label': ariaLabel = 'Recording',
  },
  ref,
) {
  const theme = useTheme();
  const palette = theme.colors[color];
  const tokens = SIZE_TOKENS[size];
  const easing = theme.motion.easing.easeInOut;
  const autoId = useId();
  const safeAutoId = autoId.replace(/:/g, '');
  const animName = `timeui-chat-wave-${safeAutoId}`;

  // 每根 bar 的动画时长 + 延迟交错，组成"波浪"。控制在 0.7s ~ 1s 区间最自然。
  const barConfigs = useMemo(() => {
    const configs: Array<{ duration: string; delay: string; minScale: number }> = [];
    for (let i = 0; i < bars; i++) {
      // duration 在 0.7 ~ 1.05s 之间，diff 让相邻 bar 不同步。
      const duration = (0.7 + ((i * 0.13) % 0.35)).toFixed(2);
      // delay 让左右相位错开。
      const delay = ((i * 0.12) % 0.6).toFixed(2);
      // 静止时高度比，奇偶切换让初始形状不那么平。
      const minScale = i % 2 === 0 ? 0.35 : 0.55;
      configs.push({ duration: `${duration}s`, delay: `${delay}s`, minScale });
    }
    return configs;
  }, [bars]);

  const containerCss = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${tokens.gap};
    width: ${tokens.container};
    height: ${tokens.container};
    color: ${palette.DEFAULT};
    flex: none;
    @keyframes ${animName} {
      0%,
      100% {
        transform: scaleY(0.4);
      }
      50% {
        transform: scaleY(1);
      }
    }
  `;

  const barCss = (idx: number) => {
    const cfg = barConfigs[idx]!;
    return css`
      width: ${tokens.barWidth};
      height: ${tokens.barMaxHeight};
      border-radius: 9999px;
      background-color: currentColor;
      transform-origin: center;
      transform: scaleY(${isActive ? 1 : cfg.minScale});
      ${isActive
        ? `animation: ${animName} ${cfg.duration} ${easing} ${cfg.delay} infinite alternate;`
        : ''}
      @media (prefers-reduced-motion: reduce) {
        animation: none;
        transform: scaleY(${cfg.minScale});
      }
    `;
  };

  return (
    <div
      ref={ref}
      id={id}
      className={className}
      style={style}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      data-active={isActive || undefined}
      css={containerCss}
    >
      {barConfigs.map((_, idx) => (
        <span key={idx} aria-hidden css={barCss(idx)} />
      ))}
    </div>
  );
});

(ChatVoiceWave as unknown as { displayName: string }).displayName = 'ChatVoiceWave';
