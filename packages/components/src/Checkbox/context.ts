/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Checkbox 组件的核心渲染与交互逻辑。
 */

import { createContext, useContext } from 'react';
import type { CheckboxColor, CheckboxRadius, CheckboxSize } from './Checkbox.types';

export interface CheckboxGroupContextValue {
  name: string;
  value: string[];
  toggle: (value: string, nextChecked: boolean) => void;
  color?: CheckboxColor;
  size?: CheckboxSize;
  radius?: CheckboxRadius;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
}

export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

export const useCheckboxGroupContext = (): CheckboxGroupContextValue | null =>
  useContext(CheckboxGroupContext);
