/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 定义 FormField 模块的 TypeScript 类型约束。
 */

import type { ReactElement, ReactNode, HTMLAttributes } from 'react';

export type FormFieldLabelPlacement = 'top' | 'start';

export interface FormFieldInjectedChildProps {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  required?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isRequired?: boolean;
}

export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label?: ReactNode;
  labelPlacement?: FormFieldLabelPlacement;
  description?: ReactNode;
  errorMessage?: ReactNode;
  isRequired?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;
  id?: string;
  children: ReactElement;
}
