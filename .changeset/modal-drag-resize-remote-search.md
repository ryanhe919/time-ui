---
'@timeui/react': minor
'@timeui/tokens': minor
---

Modal 支持拖动与缩放；Select / MultiSelect 接入后端搜索与分页。

**Modal — 拖动 / 缩放（opt-in，默认关闭）**

- 新增 `isDraggable`：拖内置 header 移动面板；没有 `title` 时，给面板内任意元素加 `data-timeui-modal-drag-handle`（导出常量 `MODAL_DRAG_HANDLE_ATTR`）即可作为把手，把手内部的按钮 / 链接 / 表单控件以及 `data-timeui-modal-no-drag` 元素不会误触发拖动。
- 新增 `isResizable` + `resizeHandles`：四边四角八个缩放把手，可按需裁剪。
- 位置与尺寸支持受控 / 非受控：`rect` / `defaultRect` / `onRectChange`（回调带 `reason: 'init' | 'drag' | 'resize' | 'constrain'`），并有 `minWidth` / `minHeight` / `shouldConstrainToViewport` / `shouldResetRectOnClose` 约束。
- 键盘可达：`Ctrl/⌘ + 方向键` 移动，`Ctrl/⌘ + Shift + 方向键` 缩放，均为 16px 步长。
- `@timeui/tokens` 的 `modalTokens` 新增 `resizeHandleSize` / `resizeHandleCornerSize` / `minWidth` / `minHeight` / `viewportPadding`。

**Select / MultiSelect — 后端搜索与分页**

两个组件获得同名同义的一套 props（`AsyncSearchProps`），三种模式互相兼容、默认行为完全不变：

- **本地**（默认）—— 行为与既有版本一致；Select 补上了此前只有 MultiSelect 才有的 `filterOption`。
- **托管远程** —— 只传 `loadOptions`，组件负责 debounce（`searchDebounce`，默认 300ms）、`AbortSignal` 取消过期请求、乱序响应丢弃、按 `value` 去重的分页累积、滚动触底（`loadMoreThreshold`）与键盘到底翻页、失败重试。`searchParams` 随请求下发且变化时自动从第一页重搜，`pageSize` / `resetOnClose` 可调。
- **受控远程** —— `searchMode="remote"` 跳过本地过滤，配合 `searchValue` / `onSearchChange` / `onSearch` / `isLoading` / `isLoadingMore` / `hasMore` / `onLoadMore` / `loadError` / `onRetry` 完全自管数据。

远程模式下选中项常常不在当前结果里，两个组件都会缓存已选项的 label（并在 `items` 里兜底查找），因此 Select 的 trigger 与 MultiSelect 的 chip 不会退化成裸 `value`。

**行为修正**

`MultiSelect` 在 `isLoading` 期间不再整体卸载 listbox，改为保留一个 `aria-busy` 的空 listbox。此前 trigger 的 `aria-expanded="true"` 会配上指向不存在元素的 `aria-controls`，违反 `aria-required-attr`。依赖「loading 时 `role="listbox"` 不存在」的测试需要改为断言 `aria-busy` + 零个 `option`。
