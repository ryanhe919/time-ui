/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-29
 * @description `MultiSelectOptGroup` 子组件壳：仅承载 `label` 与一组 `<MultiSelectOption>`。
 *              不渲染 DOM；分组结构由 `MultiSelect` 父组件根据 children 推导。
 */

import type { MultiSelectOptGroupProps } from './MultiSelect.types';

export const MULTI_SELECT_OPT_GROUP_TAG = Symbol.for('timeui.MultiSelectOptGroup');

export const MultiSelectOptGroup = (_props: MultiSelectOptGroupProps) => null;

(MultiSelectOptGroup as unknown as { displayName: string }).displayName = 'MultiSelectOptGroup';
(MultiSelectOptGroup as unknown as { __timeuiTag: symbol }).__timeuiTag =
  MULTI_SELECT_OPT_GROUP_TAG;
