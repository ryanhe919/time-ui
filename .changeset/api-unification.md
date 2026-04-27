---
'@timeui/react': major
---

**Unify component API naming across all 36+ components (BREAKING CHANGE).**

Following the audit recorded in `.scratch/api-unification-spec.md`, every component now follows a single set of naming conventions. The biggest themes:

- **Boolean state props use the `is*` prefix.** `disabled → isDisabled`, `loading → isLoading`, `fullWidth → isFullWidth`, `selected → isSelected`, `clearable → isClearable`, `bordered → isBordered`, `striped → isStriped`, `pulse → isPulse`, etc.
- **Overlay open state is `isOpen` / `defaultOpen` / `onOpenChange`** (not `open` / `defaultIsOpen` / `onClose`). Affects Modal, Drawer, Popover, Tooltip, Toast, SearchDialog. The lone exception to the `is*` convention is `defaultOpen` (matches React conventions for `defaultValue` etc.).
- **Steps switches to `activeIndex` / `defaultActiveIndex`** (was `current` / `defaultCurrent`). Aligns with Tabs' `selectedKey` family.
- **Pagination's main change handler is `onPageChange`** (was `onChange`), to leave room for `onPageSizeChange` already in use.
- **Data-item key fields are now `itemKey` / `sectionKey` / `columnKey`** instead of `key`, so they don't collide with React's reserved `key`. Affects `TabItem`, `StepItem`, `MenuSection`, `TableColumn`.
- **`onChangeEvent` removed.** The pattern of exposing both `onChange(value)` and `onChangeEvent(e)` was removed from Input, Textarea, Checkbox, Switch, Radio. Use `onChange` (value-shaped) plus standard React event handlers (`onBlur`, `onFocus`, etc.) on the underlying element if you need the event.
- **Modal/Drawer focus & scroll props renamed for clarity:** `blockScrollOnMount → shouldBlockScroll`, `returnFocusOnClose → shouldReturnFocus`.
- **Popover/Tooltip arrow:** `withArrow → hasArrow`.
- **Visual modifier props:** `Text muted → isMuted`, `Avatar pulse → isPulse`, etc.
- **Size scales unified to a 5-tier `xs | sm | md | lg | xl` scale** across all 22 components that take a `size` prop (was a mix of 3-tier and ad-hoc scales).
- **Slot props standardised on `startContent` / `endContent`** (was a mix of `prefix` / `suffix` / `leading` / `trailing`).
- **Search trigger**: `fullWidth → isFullWidth`, size scale expanded to xs–xl.

Migration: there are no deprecated aliases — old names will fail to type-check. Use the rename table in `.scratch/api-unification-spec.md` for a complete diff.
