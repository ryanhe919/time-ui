/** @jsxImportSource @emotion/react */
import type { SelectOptionProps } from './Select.types';

/**
 * Static tag that marks a component as a TimeUI `SelectOption`. The parent
 * `<Select>` uses this instead of `type === SelectOption` identity checks,
 * so it still works when the component module is loaded twice (e.g. during
 * dev-server hot reload, or ESM + CJS dual-bundling).
 */
export const SELECT_OPTION_TAG = Symbol.for('timeui.SelectOption');

/**
 * `SelectOption` — metadata component. Runtime-wise it renders nothing; its
 * props are introspected by the parent `<Select>` to build the custom listbox.
 * This keeps the authoring ergonomics (JSX children) without shipping a real
 * DOM `<option>`, which wouldn't survive inside our custom popover anyway.
 */
export const SelectOption = (_props: SelectOptionProps) => null;

(SelectOption as unknown as { displayName: string }).displayName = 'SelectOption';
(SelectOption as unknown as { __timeuiTag: symbol }).__timeuiTag = SELECT_OPTION_TAG;
