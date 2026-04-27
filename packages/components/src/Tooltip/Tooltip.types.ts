/**
 * @author Ryan He
 * @date 2026-04-17
 * @description 定义 Tooltip 组件的共享 TypeScript 类型。
 *              Tooltip 复用 Popover 的 placement 体系，但触发与配色策略不同：
 *              只支持 hover + focus，配色硬编码反色（与 surface 形成强对比）。
 */

import type { CSSProperties, ReactElement, ReactNode } from 'react';
import type { PopoverPlacement } from '../Popover/Popover.types';

/** Tooltip 的方位字面量 —— 直接复用 Popover 的 12 个枚举值，无需重复定义。 */
export type TooltipPlacement = PopoverPlacement;

export interface TooltipProps {
  /** 显示的内容（短文本或简单 ReactNode）。 */
  content: ReactNode;
  /**
   * 包裹的 anchor —— 必须是单个 ReactElement。
   * 会被 cloneElement 注入 ref + 事件 + aria-describedby，
   * 同时保留并合并 children 已有的 mouseenter / mouseleave / focus / blur 处理。
   */
  children: ReactElement;
  /** 默认 'top'。 */
  placement?: TooltipPlacement;
  /** anchor 与 tooltip 的间距，默认读 theme.components.tooltip.offset。 */
  offset?: number;
  /** 显示箭头，默认 true。 */
  hasArrow?: boolean;
  /** 整体禁用（不显示 portal）。 */
  isDisabled?: boolean;
  /** hover/focus 进入到 tooltip 显示的延迟（ms），默认读 openDelay；warm 状态时跳过。 */
  openDelay?: number;
  /** hover/focus 离开到 tooltip 关闭的延迟（ms），默认读 closeDelay。 */
  closeDelay?: number;
  /** 受控显隐（仅用于程序控制场景，可选）。一旦提供则忽略所有内部 hover/focus 触发逻辑。 */
  isOpen?: boolean;
  /** 非受控初始显隐。 */
  defaultOpen?: boolean;
  /** 开关变化回调。 */
  onOpenChange?: (open: boolean) => void;
  /** 透传到 tooltip panel 的 className（不是 anchor）。 */
  className?: string;
  /** 透传到 tooltip panel 的 inline style（不是 anchor）。 */
  style?: CSSProperties;
  /** 透传到 tooltip panel 的 id；同时也是注入到 anchor aria-describedby 的值。 */
  id?: string;
}
