/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Radio 组件的核心渲染与交互逻辑。
 */

import { createContext, useContext } from 'react';
import type { RadioColor, RadioSize } from './Radio.types';

export interface RadioGroupContextValue {
  name: string;
  value: string | undefined;
  setValue: (value: string) => void;
  color?: RadioColor;
  size?: RadioSize;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export const useRadioGroupContext = (): RadioGroupContextValue | null =>
  useContext(RadioGroupContext);
