/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现 Select 组件的核心渲染与交互逻辑。
 */

import type { SelectOptionProps } from './Select.types';

export const SELECT_OPTION_TAG = Symbol.for('timeui.SelectOption');

export const SelectOption = (_props: SelectOptionProps) => null;

(SelectOption as unknown as { displayName: string }).displayName = 'SelectOption';
(SelectOption as unknown as { __timeuiTag: symbol }).__timeuiTag = SELECT_OPTION_TAG;
