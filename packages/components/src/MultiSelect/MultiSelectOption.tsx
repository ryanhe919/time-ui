/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-29
 * @description `MultiSelectOption` 仅作为子组件壳：
 *              不渲染任何 DOM，由 `MultiSelect` 父组件通过 `Children.forEach` 推导成 items。
 *              与 `SelectOption` 同款机制，多挂一个 Symbol 标记便于跨打包识别。
 */

import type { MultiSelectOptionProps } from './MultiSelect.types';

export const MULTI_SELECT_OPTION_TAG = Symbol.for('timeui.MultiSelectOption');

export const MultiSelectOption = (_props: MultiSelectOptionProps) => null;

(MultiSelectOption as unknown as { displayName: string }).displayName = 'MultiSelectOption';
(MultiSelectOption as unknown as { __timeuiTag: symbol }).__timeuiTag = MULTI_SELECT_OPTION_TAG;
