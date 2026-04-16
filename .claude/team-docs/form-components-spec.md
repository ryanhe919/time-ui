# TimeUI 表单组件设计 Spec（v1）

> 作者：产品经理 + 首席前端架构师
> 范围：本轮为 TimeUI 组件库新增的 **7 个表单相关组件**。
> 设计基调：Apple HIG（克制、细腻、可访问）+ 已有 Button 视觉语言（semantic color scale、细腻 focus ring、轻微 active 位移）。
> 本文只定义 spec（props / 行为 / a11y / 测试要点 / token），**不含实现代码**。实现时请严格对齐本文档与 `CLAUDE.md` 中的架构约束。

---

## 0. 组件清单与优先级

| #   | 组件                             | 一句话                                                                             | 优先级           | 依赖                            |
| --- | -------------------------------- | ---------------------------------------------------------------------------------- | ---------------- | ------------------------------- |
| 1   | **FormField**                    | 统一承载 `label / description / errorMessage / required` 的基础包装器              | P0（基座，先做） | 无                              |
| 2   | **Input**                        | 单行文本输入，4 种 variant + startContent/endContent + clearable + password toggle | P0               | FormField（可选组合）           |
| 3   | **Textarea**                     | 多行输入，支持 `minRows`/`maxRows` 自适应或固定 `rows`                             | P0               | FormField（可选组合）           |
| 4   | **Checkbox** / **CheckboxGroup** | 含 indeterminate、受控/非受控、组内共享 `name`/`value`                             | P1               | 无（Group 可选）                |
| 5   | **Radio** / **RadioGroup**       | Radio **必须**通过 RadioGroup 消费 `name`/`value`                                  | P1               | RadioGroup（强依赖）            |
| 6   | **Switch**                       | Apple 风格圆形滑块，2 种 size，支持 icon slot                                      | P1               | 无                              |
| 7   | **Select**                       | 基于 **native `<select>`** 封装，外观对齐 Input；不做 Popover/Portal               | P2               | Input 的视觉 recipe（样式复用） |

**串行约束**：FormField → (Input / Textarea 并行) → 其它表单组件并行。Select 建议放在 Input 之后以便复用 Input 的 variant 样式函数。

---

## 1. 设计统一原则（所有组件共用）

这些是 **硬性约束**，评审时任何一条违反都是 blocker。

### 1.1 技术实现

- **只用 Emotion `css` prop + `useTheme()`**。禁止 `@emotion/styled`，禁止任何硬编码颜色 / 间距 / 圆角 / 动效时长（均从 theme 读取）。
- 所有包裹 DOM 的组件必须 `forwardRef`；ref 指向**用户可交互的那个元素**（Input→`<input>`，Textarea→`<textarea>`，Checkbox→`<input type="checkbox">`，Radio→`<input type="radio">`，Switch→`<input type="checkbox" role="switch">`，Select→`<select>`，FormField→根 `<div>`）。
- 同时支持 **`lightTheme` 与 `darkTheme`**：所有色值都从 `theme.colors.*` 取，组件本身不判断 mode。
- **Stateful 组件必须同时支持受控与非受控**：即同时接受 `value` + `onChange` 与 `defaultValue`；两者不可同时传（TS + 运行时都给警告）。
- 类型严格：`displayName` 显式设置；props 的 `className`/`style` 透传到**根 DOM**；所有原生属性通过 `...rest` 透传到最合适的那个原生元素（详见每个组件的"props 透传规则"）。

### 1.2 视觉 / 动效

- **size 体系** 与 Button 对齐：`'xs' | 'sm' | 'md' | 'lg' | 'xl'`。默认 `md`。
- **radius 体系** 与 Button 对齐：`'sm' | 'md' | 'lg' | 'full'`。默认根据 size 取 `componentRadius.{sm,md,lg}`。
- **color 体系** 与 Button 对齐：`'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'`。默认 `'default'`（当 `isInvalid` 为 true 时强制 `'danger'`，不管用户传什么）。
- **variant 体系**（表单域专用，取 Button 的子集 + 新增 `underlined`）：`'flat' | 'bordered' | 'faded' | 'underlined'`。默认 `'flat'`。
  - `flat`：背景 = `colors.bg.sunken`，无边框（focus 时出现 2px outline）。最低视觉噪声，对齐 Apple HIG 设置页风格。
  - `bordered`：透明背景 + `borders.width.thin` + `colors.border.default`。
  - `faded`：`colors.default[100]` 背景 + `borders.width.thin` + `colors.default[500]` 边框。
  - `underlined`：仅底部 1px border，背景透明；focus 时底边变为 2px + `colors.focus`。
- **focus ring** 统一用 `outline: 2px solid colors.focus; outline-offset: 2px;`；绝不用 box-shadow 模拟（与 Button 一致）。
- **transition**：统一 `theme.motion.duration.normal` + `theme.motion.easing.standard`，过渡的属性包含 `background-color, color, border-color, outline-color, box-shadow, transform`。
- **必须** `@media (prefers-reduced-motion: reduce) { transition: none; animation: none; transform: none; }`。
- **disabled**：`opacity: 0.5; pointer-events: none;`（与 Button 一致），同时设置 `aria-disabled="true"`。
- **readOnly**：视觉上与 enabled 一致，但鼠标 `cursor: default`，focus 仍可聚焦；不触发 `onChange`。

### 1.3 a11y 强制条款

- 每个交互元素必须有 accessible name：通过 `<label htmlFor>`（FormField 提供）或 `aria-label` / `aria-labelledby`。
- **错误态**：`aria-invalid="true"` + `aria-describedby` 指向 errorMessage 节点的 id；errorMessage 节点本身加 `role="alert"`（仅在动态出现时）。
- **description**：通过 `aria-describedby` 关联；同时有 description 与 errorMessage 时，`aria-describedby` 串联两个 id，且 errorMessage 优先级更高（视觉上也覆盖 description）。
- **required**：同时设置 HTML `required` 与 `aria-required="true"`；label 上加视觉星号 `*`，并用 `aria-hidden` 的视觉 marker（实际语义由 `aria-required` 提供）。
- WCAG 2.1 AA 对比度：正文 ≥ 4.5:1，placeholder ≥ 4.5:1（用 `colors.text.muted`，不要用更浅），focus ring 与相邻色 ≥ 3:1。
- 键盘可达：所有原生控件依赖浏览器默认行为；自定义封装（Switch、Checkbox 的 custom indicator）必须让隐藏的 native input 保留在可聚焦流中。

### 1.4 命名约定（与 Button 一致 + 表单惯例）

- 布尔 props 统一用 `is*` 前缀描述状态：`isDisabled` / `isReadOnly` / `isRequired` / `isInvalid` / `isClearable`（例外：`disabled` 作为原生 alias 也支持，但内部优先读 `isDisabled`；如两者都传，`isDisabled` 胜）。
- Content slot 用 `startContent` / `endContent`（与 HeroUI 习惯一致，替代 `startIcon`/`endIcon`——表单域的 slot 不限图标，可能是文本/按钮）。
- 事件回调用 React 习惯名：`onChange(value)` 传**解包后的 value**（不是 event），原生事件用 `onInput` / `onBlur` / `onFocus` 透传。
  - 例外：Input/Textarea 的 `onChange(value: string)`。Checkbox 的 `onChange(checked: boolean)`。RadioGroup 的 `onChange(value: string)`。Switch 的 `onChange(checked: boolean)`。Select 的 `onChange(value: string)`。
  - 如需原生事件对象，提供 `onValueChange` 为解包版、保留 `onChange` 为原生 event → **反悔：统一用 `onChange(value)`，原生版命名为 `onChangeEvent`**，保持与 HeroUI 一致，降低心智负担。

---

## 2. 组件详细 Spec

### 2.1 `FormField`

**作用**：表单域的统一外壳，负责 label / description / errorMessage / required 的布局与 a11y 关联。
**依赖**：无。被 Input / Textarea / Select / Checkbox / Radio / Switch 内部可选组合，也可由用户手动包裹 `children`。
**根元素**：`<div role="group">`（若有 label，label 是 `<label>`；否则纯 `<div>`）。

#### Props

| 名称                 | 类型               | 默认值   | 说明                                                                                                                                                      |
| -------------------- | ------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`              | `ReactNode`        | -        | 字段标题。给 string 时会渲染为 `<label htmlFor={inputId}>`；给 node 时渲染为 `<span>` + `aria-labelledby`。                                               |
| `labelPlacement`     | `'top' \| 'start'` | `'top'`  | `start` 为左右布局（适合紧凑表单）。                                                                                                                      |
| `description`        | `ReactNode`        | -        | 说明文字，渲染到 errorMessage 之上。                                                                                                                      |
| `errorMessage`       | `ReactNode`        | -        | 错误信息；存在时自动把内部字段视为 `isInvalid=true`。                                                                                                     |
| `isRequired`         | `boolean`          | `false`  | 渲染 `*` 红色标记，并传递给内部 field。                                                                                                                   |
| `isInvalid`          | `boolean`          | 自动推导 | 显式 override。                                                                                                                                           |
| `isDisabled`         | `boolean`          | `false`  | 透传给子 field 并降低整体 opacity。                                                                                                                       |
| `children`           | `ReactNode`        | -        | 实际的 form control。**必须是单个 React element**，会被 `cloneElement` 注入 `id` / `aria-describedby` / `aria-invalid` / `aria-required` / `isDisabled`。 |
| `id`                 | `string`           | 自动生成 | field 的 id；不传则 `useId()` 生成。                                                                                                                      |
| `className`, `style` | -                  | -        | 透传到根 `<div>`。                                                                                                                                        |

#### 视觉 Variants

- **`labelPlacement='top'`**（默认）：`label` → `children` → `description | errorMessage`，纵向 gap `spacing[1.5]`（6px）。
- **`labelPlacement='start'`**：label 放左侧，宽度默认 30%，最小宽度 `spacing[20]`（80px）。
- label 文字：`theme.colors.text.primary`，`13px / 1.4 / 500 weight`（对齐 Apple 设置页）。
- description：`theme.colors.text.secondary`，`12px / 1.4 / 400`。
- errorMessage：`theme.colors.status.danger`，`12px / 1.4 / 400`，前面可选一个 `⚠` 图标（`aria-hidden`）。
- required 星号：`theme.colors.status.danger`，`margin-inline-start: spacing[0.5]`，`aria-hidden`。

#### 交互行为

- 纯容器，无交互；但负责 **id 串联** 与 **状态传播**。
- 内部自动为 children 组装：`id` / `aria-describedby` / `aria-invalid` / `aria-required` / `isDisabled` / `isInvalid`。
- `errorMessage` 非空时，自动 `isInvalid=true`（除非用户显式 `isInvalid={false}`）。

#### a11y 要求

- label（string 形式）用 `<label htmlFor={id}>` 语义关联；ReactNode 形式使用 `aria-labelledby`。
- errorMessage 容器有 `role="alert"` 且 `aria-live="polite"`（避免干扰屏幕阅读器的其它输入）。
- description + errorMessage 的 id 用空格分隔后一起赋给 `aria-describedby`。

#### 测试要点（≥ 6 条）

1. `label` 为 string 时 `<label>` 的 `htmlFor` 等于子 field 的 `id`。
2. `errorMessage` 非空时自动给子 field 加 `aria-invalid="true"`，且 `aria-describedby` 含 error id。
3. 同时有 `description` 和 `errorMessage` 时 `aria-describedby` 含两个 id（顺序：description → error）。
4. `isRequired` 同时设置子 input 的 `required` 与 `aria-required`，且渲染红色 `*`。
5. `isDisabled` 透传给子 field 并使根节点 opacity 下降（但 label 文字对比度仍 ≥ 4.5:1）。
6. 受控 id：`id` 显式传入时覆盖内部 `useId()`，多次渲染保持稳定。
7. `expectA11y(container)` 在 light 和 dark 两种 theme 下零违规（`test.each` 参数化）。

---

### 2.2 `Input`

**作用**：单行文本输入。最核心的表单原子。
**依赖**：可选组合 FormField（用户层面选择）。

#### Props

| 名称                                                                                                                            | 类型                                                                          | 默认值                 | 说明                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| `variant`                                                                                                                       | `'flat' \| 'bordered' \| 'faded' \| 'underlined'`                             | `'flat'`               | 见统一原则 1.2。                                                          |
| `color`                                                                                                                         | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger'` | `'default'`            | `isInvalid=true` 时强制 `'danger'`。                                      |
| `size`                                                                                                                          | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'`                                        | `'md'`                 | 与 Button 对齐。                                                          |
| `radius`                                                                                                                        | `'sm' \| 'md' \| 'lg' \| 'full'`                                              | size 映射（同 Button） | -                                                                         |
| `type`                                                                                                                          | `'text' \| 'email' \| 'url' \| 'tel' \| 'password' \| 'search' \| 'number'`   | `'text'`               | `'password'` 时配合 `isPasswordToggleVisible` 显示切换按钮。              |
| `value`                                                                                                                         | `string`                                                                      | -                      | 受控。                                                                    |
| `defaultValue`                                                                                                                  | `string`                                                                      | -                      | 非受控。                                                                  |
| `onChange`                                                                                                                      | `(value: string) => void`                                                     | -                      | 解包后的值。                                                              |
| `onChangeEvent`                                                                                                                 | `(e: ChangeEvent<HTMLInputElement>) => void`                                  | -                      | 需要原生 event 时用。                                                     |
| `placeholder`                                                                                                                   | `string`                                                                      | -                      | -                                                                         |
| `label`                                                                                                                         | `ReactNode`                                                                   | -                      | 传入时**内部隐式使用 FormField** 包装（label 在上）。                     |
| `description`                                                                                                                   | `ReactNode`                                                                   | -                      | 同上。                                                                    |
| `errorMessage`                                                                                                                  | `ReactNode`                                                                   | -                      | 同上，非空 → `isInvalid=true`。                                           |
| `startContent`                                                                                                                  | `ReactNode`                                                                   | -                      | 左侧 slot（图标、货币符号、"@"）。                                        |
| `endContent`                                                                                                                    | `ReactNode`                                                                   | -                      | 右侧 slot（单位、按钮）；`isClearable` / password toggle 会追加在此之后。 |
| `isClearable`                                                                                                                   | `boolean`                                                                     | `false`                | 有值且非 disabled/readOnly 时显示清除按钮（✕）。                          |
| `isDisabled`                                                                                                                    | `boolean`                                                                     | `false`                | -                                                                         |
| `isReadOnly`                                                                                                                    | `boolean`                                                                     | `false`                | -                                                                         |
| `isRequired`                                                                                                                    | `boolean`                                                                     | `false`                | -                                                                         |
| `isInvalid`                                                                                                                     | `boolean`                                                                     | auto                   | -                                                                         |
| `isPasswordToggleVisible`                                                                                                       | `boolean`                                                                     | `type === 'password'`  | password 切换眼睛图标。                                                   |
| `fullWidth`                                                                                                                     | `boolean`                                                                     | `false`                | 宽度 100%。                                                               |
| `autoComplete`, `autoFocus`, `name`, `id`, `maxLength`, `minLength`, `pattern`, `inputMode`, `spellCheck`, `step`, `min`, `max` | -                                                                             | -                      | 透传到 `<input>`。                                                        |
| `className`, `style`                                                                                                            | -                                                                             | -                      | **透传到根 wrapper**，不是 input 本身。                                   |

#### 视觉 Variants

- 各 variant 背景 / 边框规则见 1.2。
- 尺寸（高度对齐 Button 相同 size）：
  | size | height | fontSize | paddingX | iconSize |
  |---|---|---|---|---|
  | xs | 28px | 12px | 10px | 14 |
  | sm | 32px | 13px | 12px | 14 |
  | md | 40px | 14px | 14px | 16 |
  | lg | 48px | 16px | 16px | 18 |
  | xl | 56px | 18px | 20px | 20 |
- **错误态**：边框 / 底边用 `colors.status.danger`；focus ring 依然是 `colors.focus`（不是红色——Apple 的做法：focus 永远是品牌蓝，错误用边框和文本表达）。
- **startContent / endContent 颜色**：默认 `colors.text.muted`；hover 输入框时不变色。
- **clearable 按钮**：尺寸 = iconSize，色 `colors.text.muted`，hover 时 `colors.text.primary`，`aria-label="Clear input"`（走 i18n）。
- **password toggle**：同上尺寸；两种图标（`eye` / `eye-off`），`aria-label` 走 i18n（`'Show password' / 'Hide password'`），且 `aria-pressed` 反映当前显隐状态。

#### 交互行为

- 受控 / 非受控双支持：`value` 存在 → 受控；否则内部 `useState(defaultValue ?? '')`。**不允许同时传两者**（dev 环境 `console.warn`）。
- `onChange(value)` 在每次 input event 触发，原生 event 通过 `onChangeEvent` 暴露。
- **键盘**：
  - `Enter`：若在 `<form>` 内，提交表单（原生行为，不拦截）。
  - `Escape`：若 `isClearable` 且有值，**清空**并 refocus（可配置关闭 via `clearOnEscape={false}`）。
- **点击 clearable**：调用 `onChange('')`，之后 refocus input。事件 `onClear?: () => void` 可选暴露。
- **password toggle**：切换 `<input type>` 在 `'password'` 与 `'text'` 之间，不影响 value；切换时**不** refocus（避免键盘用户光标丢失，让浏览器自己保持）。
- **readOnly**：仍可 focus、可选中文字；不触发 clearable / password toggle 的副作用（它们仍显示但 disabled）。
- **disabled**：整个 wrapper `aria-disabled`，input `disabled`；所有 slot 的按钮同步 disabled。

#### a11y 要求

- `<input>` 是 accessible name 的主体；label 由 FormField 或 `aria-label` 提供。
- `isInvalid` → `aria-invalid="true"`，`errorMessage` 的 id 进入 `aria-describedby`。
- clearable / password toggle 按钮：`type="button"`（避免提交表单）、独立 `aria-label`、`tabIndex={-1}`（键盘用户用 Escape 或直接清空；避免 Tab 序列里塞过多东西）——此规则**可配置**：提供 `clearButtonTabIndex` prop，默认 `-1`。
- 如果 `type="search"`，给 `<input>` 加 `role="searchbox"` 是冗余的（浏览器已提供），不要手动加。

#### 测试要点（≥ 6 条）

1. 受控：`value` + `onChange` 每次键入触发 `onChange(value)` 且 `onChange` 的参数是**解包后的字符串**，不是 event。
2. 非受控：`defaultValue='foo'` 渲染后 input 的值是 `'foo'`，键入后 DOM 值正确，不触发外部状态。
3. `isClearable` 有值时出现 ✕ 按钮；点击后 input 清空并重新 focus，`onChange('')` 和 `onClear` 都被调用。
4. `type='password'` 默认显示 toggle；点击后 input 的 `type` 变为 `'text'`，按钮 `aria-pressed="true"`。
5. `errorMessage='...'` 自动设置 input 的 `aria-invalid="true"`，`aria-describedby` 含 error id，且错误文本对用户可见（非 CSS 隐藏）。
6. `isDisabled` 下键盘输入无效，clearable / password toggle 按钮也 disabled。
7. `isReadOnly` 下 input 有 `readonly` 属性，键入不改变 value，但 focus 正常；clearable 按钮也 disabled。
8. `startContent`/`endContent` 被渲染且不拦截 input 的点击 focus（点击 wrapper 空白处要 focus input）。
9. **点击 wrapper 空白区**应 focus input（不是只有 input 本身可点）。
10. `renderWithProviders` + light/dark 两种主题：`expectA11y(container)` 零违规。
11. `ref` 转发到 `<input>` 元素本身（`ref.current instanceof HTMLInputElement`）。
12. `prefers-reduced-motion` 下 CSS `transition` 被禁用（快照或 `matchMedia` mock 验证）。

---

### 2.3 `Textarea`

**作用**：多行输入。视觉 recipe 与 Input 完全一致，差异在高度与自适应。
**依赖**：共享 Input 的 variant/color 样式函数（**实现时抽到 `utils/fieldStyles.ts`**，避免重复）。

#### Props

| 名称                                                                                                                                                    | 类型               | 默认值   | 说明                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------- | ------------------------------------------------------------------------------------------------ | ---------------------- | ---------- |
| `variant`, `color`, `size`, `radius`                                                                                                                    | 同 Input           | 同 Input | -                                                                                                |
| `value` / `defaultValue` / `onChange` / `onChangeEvent`                                                                                                 | 同 Input（string） | -        | -                                                                                                |
| `rows`                                                                                                                                                  | `number`           | `3`      | 固定模式（不传 `minRows`/`maxRows` 时生效）。                                                    |
| `minRows`                                                                                                                                               | `number`           | -        | 自适应模式下限。                                                                                 |
| `maxRows`                                                                                                                                               | `number`           | -        | 自适应模式上限；达到后显示 scroll。                                                              |
| `isAutoSize`                                                                                                                                            | `boolean`          | `minRows |                                                                                                  | maxRows`存在时为`true` | 显式开关。 |
| `placeholder`, `label`, `description`, `errorMessage`, `isDisabled`, `isReadOnly`, `isRequired`, `isInvalid`, `fullWidth`, `startContent`, `endContent` | 同 Input           | 同 Input | **startContent / endContent 对 Textarea 是"右上角 / 左上角"锚点**，比如字数统计 / 语言切换按钮。 |
| `maxLength`                                                                                                                                             | `number`           | -        | 原生透传；**开启时可选启用**自动字数统计 slot。                                                  |
| `showCount`                                                                                                                                             | `boolean`          | `false`  | 在右下角显示 `当前/最大`（`aria-hidden`，真实提示靠 `aria-describedby` → description）。         |
| 其它 textarea 属性                                                                                                                                      | -                  | -        | 透传。                                                                                           |

#### 视觉 Variants

- 与 Input 相同的 4 种 variant（样式函数共享）。
- 默认 `padding: spacing[2] spacing[3]`（8px 12px）；无 height 约束，由 `rows` 或 auto-size 控制。
- 自适应：实现上用 `<textarea>` 高度跟随 `scrollHeight`（需要一个 hidden mirror 或 `field-sizing: content`——后者浏览器支持不足，用 mirror 方案兜底）。
- 字数统计：右下角绝对定位，`font-size: 11px`，`colors.text.muted`；当 `value.length > maxLength * 0.9` 时变 `colors.status.warning`，超限变 `colors.status.danger`。

#### 交互行为

- 同 Input 的受控 / 非受控规则。
- 自适应：每次 value 变更都重算高度（`useLayoutEffect`）；`minRows` 限制初始高度，`maxRows` 限制最大高度（达到后滚动）。
- `Enter` 不提交表单（原生行为），`Ctrl+Enter` / `Cmd+Enter` 可选通过 `onSubmitShortcut` 回调暴露（默认关闭，避免噪声）。
- `Escape` 在 Textarea 里**不清空**（与 Input 行为差异——多行场景误触代价太高）。

#### a11y 要求

- 同 Input；额外：若 `showCount` 可见，必须把字数信息通过 `aria-describedby` 指向一个 sr-only 节点（因为可见节点本身 `aria-hidden`），内容如 `"42 of 200 characters used"`。
- 达到 `maxLength` 时提供 `aria-live="polite"` 的状态节点（可与上一个节点复用）。

#### 测试要点（≥ 6 条）

1. 固定 `rows={5}` 时 DOM `rows="5"`，高度不随 value 变化。
2. `minRows=2 maxRows=6`：空 value 时高度对应 2 行；连续输入到 10 行时高度停在 6 行，且 `overflow-y: auto`。
3. 受控 / 非受控行为与 Input 一致（`onChange` 参数为 string）。
4. `showCount maxLength={10}`：输入 8 字符时字数节点为 warning 色；超过 10 时字数节点为 danger 色，且 sr-only 节点文本更新。
5. `Escape` 不清空 value（Textarea 特有）。
6. `errorMessage` 下 `aria-invalid="true"` 与 `aria-describedby` 正确串联。
7. `ref.current instanceof HTMLTextAreaElement`。
8. `prefers-reduced-motion` 下过渡被禁用。
9. `expectA11y(container)` 在 light/dark 零违规。

---

### 2.4 `Checkbox` + `CheckboxGroup`

**作用**：单个 checkbox（含 indeterminate）；CheckboxGroup 提供多选组的状态管理与布局。
**依赖**：Checkbox 独立可用；CheckboxGroup 可选。

#### `Checkbox` Props

| 名称                                                  | 类型                                         | 默认值             | 说明                                                                       |
| ----------------------------------------------------- | -------------------------------------------- | ------------------ | -------------------------------------------------------------------------- |
| `color`                                               | 同 Button                                    | `'primary'`        | 选中态用色。                                                               |
| `size`                                                | `'sm' \| 'md' \| 'lg'`                       | `'md'`             | 尺寸。（checkbox 不需要 xs/xl）                                            |
| `radius`                                              | `'sm' \| 'md'`                               | size 映射          | 指示器圆角。                                                               |
| `value`                                               | `string`                                     | -                  | 在 CheckboxGroup 中**必填**；独立使用时可选。                              |
| `isSelected`                                          | `boolean`                                    | -                  | 受控选中态。                                                               |
| `defaultSelected`                                     | `boolean`                                    | `false`            | 非受控。                                                                   |
| `isIndeterminate`                                     | `boolean`                                    | `false`            | 中间态（视觉与逻辑 — DOM `.indeterminate = true`）；与 `isSelected` 正交。 |
| `onChange`                                            | `(checked: boolean) => void`                 | -                  | -                                                                          |
| `onChangeEvent`                                       | `(e: ChangeEvent<HTMLInputElement>) => void` | -                  | -                                                                          |
| `isDisabled`, `isReadOnly`, `isRequired`, `isInvalid` | -                                            | -                  | 同规则。                                                                   |
| `children`                                            | `ReactNode`                                  | -                  | label 文字（与指示器一起点击）。                                           |
| `name`                                                | `string`                                     | CheckboxGroup 注入 | 单独用时可手动。                                                           |

#### `CheckboxGroup` Props

| 名称                                                                            | 类型                         | 默认值         | 说明                                    |
| ------------------------------------------------------------------------------- | ---------------------------- | -------------- | --------------------------------------- |
| `label`, `description`, `errorMessage`, `isRequired`, `isInvalid`, `isDisabled` | 同 FormField                 | -              | Group 外壳本身就是一个 FormField。      |
| `orientation`                                                                   | `'horizontal' \| 'vertical'` | `'vertical'`   | 布局。                                  |
| `value`                                                                         | `string[]`                   | -              | 受控。                                  |
| `defaultValue`                                                                  | `string[]`                   | `[]`           | 非受控。                                |
| `onChange`                                                                      | `(value: string[]) => void`  | -              | -                                       |
| `color`, `size`, `radius`                                                       | 同 Checkbox                  | -              | 作为 children 的默认值（via context）。 |
| `name`                                                                          | `string`                     | auto `useId()` | 共享给所有子 Checkbox。                 |

#### 视觉 Variants

- 指示器尺寸：sm=16px、md=20px、lg=24px；内描边 `borders.width.thin colors.border.strong`；hover 时描边变 `colors.border.focus` 的 50% 透明度。
- 选中：背景 `colors[color].DEFAULT`，打勾用白色 SVG（`colors[color].foreground`）。
- Indeterminate：同选中背景，中间一条 2px 白色横线。
- Invalid：描边变 `colors.status.danger`；focus 时 `colors.focus` ring 仍为品牌蓝。
- label 间距：指示器与 label 之间 `spacing[2]`（8px）；整行点击区域包含 label（hover 时**不** hover label 文字，只 hover 指示器）。

#### 交互行为

- **键盘**：Space 切换（native）。
- **indeterminate**：选中或取消选中时自动退出 indeterminate（符合 Apple 的批量操作习惯）。实现上通过 `ref.current.indeterminate = isIndeterminate` 在 effect 里设置（React 不支持此属性作为 prop）。
- **CheckboxGroup 受控**：每次子 Checkbox 变化时 group 计算新数组并调用 `onChange`；value 里存 `Checkbox.value`。
- **CheckboxGroup 中子 Checkbox 冲突优先级**：group 的 `isDisabled` 优先于子项；group 的 `color/size` 仅作默认，子项可以 override。

#### a11y 要求

- 单 Checkbox：`<label>` 包裹 `<input type="checkbox">` + 视觉指示器 + children；不用 `aria-label`（天然有 label）。
- CheckboxGroup：根 `role="group"` + `aria-labelledby`（指向 group label id）。
- indeterminate：DOM 属性 `indeterminate=true`（屏幕阅读器会读 "mixed"）。
- invalid：input 加 `aria-invalid="true"`，group 级别的 errorMessage 通过 group 的 `aria-describedby` 暴露。

#### 测试要点（≥ 6 条）

1. Checkbox 受控：`isSelected=true` + `onChange`，点击触发 `onChange(false)`；`isSelected=false` 点击触发 `onChange(true)`。
2. Checkbox 非受控：`defaultSelected=true` 初始 DOM `checked`，点击后 DOM 变化但外部状态不变。
3. `isIndeterminate=true` 时 DOM `input.indeterminate === true`，且视觉为横线；点击后变为 `checked=true` 且 indeterminate 清除。
4. CheckboxGroup 受控：value=`['a']`，点击 `b` 选项触发 `onChange(['a','b'])`（顺序按渲染顺序）。
5. CheckboxGroup `isDisabled` 覆盖所有子 Checkbox。
6. CheckboxGroup 生成的 `name` 注入到每个子 Checkbox 的 `<input>` 上。
7. Group 有 label 时 `role="group"` + `aria-labelledby` 关联正确。
8. 键盘 Space 切换；Tab 进入时 focus ring 可见（`focus-visible`）。
9. `expectA11y(container)` 在两种主题零违规。
10. `prefers-reduced-motion` 下无动画。

---

### 2.5 `Radio` + `RadioGroup`

**作用**：单选。Radio 必须嵌套在 RadioGroup 中（单独使用是 anti-pattern，单独用应直接写 native `<input>`）。
**依赖**：Radio **强依赖** RadioGroup（通过 context 拿 `name` / `selectedValue` / `onChange`）。

#### `RadioGroup` Props

| 名称                                                                            | 类型                         | 默认值         | 说明             |
| ------------------------------------------------------------------------------- | ---------------------------- | -------------- | ---------------- |
| `label`, `description`, `errorMessage`, `isRequired`, `isInvalid`, `isDisabled` | 同 FormField                 | -              | -                |
| `orientation`                                                                   | `'horizontal' \| 'vertical'` | `'vertical'`   | -                |
| `value`                                                                         | `string`                     | -              | 受控。           |
| `defaultValue`                                                                  | `string`                     | -              | 非受控。         |
| `onChange`                                                                      | `(value: string) => void`    | -              | -                |
| `color`, `size`                                                                 | 同 Checkbox                  | -              | context 默认值。 |
| `name`                                                                          | `string`                     | auto `useId()` | -                |

#### `Radio` Props

| 名称            | 类型        | 默认值     | 说明                                     |
| --------------- | ----------- | ---------- | ---------------------------------------- |
| `value`         | `string`    | -          | **必填**。                               |
| `color`, `size` | 同 Checkbox | 继承 group | -                                        |
| `children`      | `ReactNode` | -          | label。                                  |
| `description`   | `ReactNode` | -          | per-item 说明（显示在 label 下方小字）。 |
| `isDisabled`    | `boolean`   | `false`    | 单项禁用（group 禁用会覆盖）。           |

#### 视觉 Variants

- 外圆：与 Checkbox 指示器等尺寸；border `colors.border.strong`；hover 变 `colors.border.focus` 50%。
- 选中：外圆描边 `colors[color].DEFAULT`，内部填充一个 `colors[color].DEFAULT` 的实心圆（直径为外圆的 50%）。
- 内圆**淡入动画**（`transform: scale(0 → 1)`，`duration.fast`，`easing.emphasized`）；`prefers-reduced-motion` 时无动画。

#### 交互行为

- 键盘：Tab 进入选中项 → ↑↓/←→ 切换项（native radio group 行为）。
- RadioGroup `value` 控制哪个 Radio 被选中；Radio 自身没有 `isSelected` prop（由 group 决定，避免状态分裂）。
- 若 group 无 `value` 且无 `defaultValue`，初始无选中。

#### a11y 要求

- RadioGroup 根 `role="radiogroup"` + `aria-labelledby`。
- 每个 Radio 是 `<label>` 包裹 `<input type="radio" name={groupName}>`。
- `isRequired` → group 级 `aria-required="true"`（不用在每个 radio 上重复）。

#### 测试要点（≥ 6 条）

1. RadioGroup 受控：`value='a'`，点击 `b` 触发 `onChange('b')`；DOM checked 由 value 决定。
2. 非受控：`defaultValue='a'` 初始选中 `a`；点击 `b` 后 DOM checked=b 但不触发外部状态。
3. 所有 Radio 的 `name` 等于 group 生成的 name（HTML radio group 的必要条件）。
4. 键盘 ↓ 在 vertical group 中移动到下一项并选中；`disabled` 的项被跳过。
5. `isDisabled` group 级下所有 Radio 不可点击。
6. Radio 单独使用（无 RadioGroup 包裹）时 dev 环境 `console.warn` 提示并降级为不可用。
7. `expectA11y(container)` 在两种主题零违规，包括含错误信息的情况。
8. `prefers-reduced-motion` 下内圆无 scale 动画。

---

### 2.6 `Switch`

**作用**：布尔开关，Apple 风圆形滑块。视觉优先于 Checkbox 用在"设置项"场景。
**依赖**：无。

#### Props

| 名称                                                  | 类型                                       | 默认值      | 说明                                                                    |
| ----------------------------------------------------- | ------------------------------------------ | ----------- | ----------------------------------------------------------------------- |
| `color`                                               | 同 Button（`'success'` 默认，对齐 iOS 绿） | `'success'` | 开启态底色。                                                            |
| `size`                                                | `'sm' \| 'md' \| 'lg'`                     | `'md'`      | sm=31x18, md=51x31 (iOS 同款), lg=59x36（以 px 表示；CSS 实现按比例）。 |
| `isSelected`                                          | `boolean`                                  | -           | 受控。                                                                  |
| `defaultSelected`                                     | `boolean`                                  | `false`     | 非受控。                                                                |
| `onChange`                                            | `(checked: boolean) => void`               | -           | -                                                                       |
| `isDisabled`, `isReadOnly`, `isRequired`, `isInvalid` | -                                          | -           | -                                                                       |
| `startContent`                                        | `ReactNode`                                | -           | 滑块左侧图标（例如 `☀`）—— 开启时显示。                                 |
| `endContent`                                          | `ReactNode`                                | -           | 滑块右侧图标（例如 `🌙`）—— 关闭时显示。                                |
| `children`                                            | `ReactNode`                                | -           | label 文本（右侧）。                                                    |
| `name`, `value`                                       | -                                          | -           | 透传到隐藏的 `<input>` 以支持表单提交。                                 |

#### 视觉 Variants

- 轨道：圆角 `radius.full`；关闭时 `colors.bg.muted`（light）/ `colors.default[500]`（对齐 iOS 灰）；开启时 `colors[color].DEFAULT`。
- 滑块：白色圆 + `shadows.sm`；`transform: translateX(...)` 用 `motion.duration.normal` + `easing.emphasized`。
- 尺寸（滑块直径 = 轨道高度 - 4px）：
  | size | 轨道 | 滑块 | padding |
  |---|---|---|---|
  | sm | 32×20 | 16 | 2 |
  | md | 48×28 | 24 | 2 |
  | lg | 56×32 | 28 | 2 |
- focus ring：包裹整个 track，`outline: 2px solid colors.focus; outline-offset: 2px;`。

#### 交互行为

- 键盘：Space/Enter 切换（native checkbox 已提供；Enter 需手动绑定因为 Enter 在 checkbox 上默认不切换）。
- **内部实现用隐藏 `<input type="checkbox" role="switch">`**（保留原生表单提交 + 屏幕阅读器天然支持），视觉 track/thumb 用 CSS。
- readonly：视觉不变，但点击 / 键盘都不改变 state。
- disabled：`opacity: 0.5`，pointer-events none。

#### a11y 要求

- `<input role="switch" aria-checked={isSelected}>`；即使浏览器对 `type=checkbox` 的 `role=switch` 支持差异，也要显式加 `aria-checked`。
- label 关联同 Checkbox（label 包裹）。
- `isInvalid` → `aria-invalid`。

#### 测试要点（≥ 6 条）

1. 受控：`isSelected=true` + `onChange`，点击 track 触发 `onChange(false)`。
2. 非受控：`defaultSelected=true` 初始 checked；点击后 DOM 更新但外部状态不变。
3. DOM 中的 input 有 `role="switch"` 与 `aria-checked` 正确。
4. `Space` 键切换；`Enter` 键切换（确认非默认行为被显式处理）。
5. `isReadOnly` 时点击/键盘不改变 state 且无 `onChange` 调用。
6. `name` + `value` 在 `<form>` 提交时 FormData 正确包含（`isSelected` 时提交）。
7. `expectA11y` 两主题零违规。
8. `prefers-reduced-motion` 下 thumb 无动画（直接跳变）。

---

### 2.7 `Select`

**作用**：基于 **native `<select>`** 的下拉，视觉对齐 Input，避免 Popover/Portal 的复杂性。
**依赖**：复用 Input 的 variant 样式函数（抽到 `utils/fieldStyles.ts`）。

#### Props

| 名称                                                                            | 类型                                                                                     | 默认值   | 说明                                                                                                                                                          |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`, `color`, `size`, `radius`, `fullWidth`                               | 同 Input                                                                                 | 同 Input | -                                                                                                                                                             |
| `label`, `description`, `errorMessage`, `isRequired`, `isInvalid`, `isDisabled` | -                                                                                        | -        | 同 Input（隐式 FormField）。                                                                                                                                  |
| `placeholder`                                                                   | `string`                                                                                 | -        | 渲染为 `<option value="" disabled hidden>`；初始 `value=''` 且无 `defaultValue` 时显示它。                                                                    |
| `value`                                                                         | `string`                                                                                 | -        | 受控。                                                                                                                                                        |
| `defaultValue`                                                                  | `string`                                                                                 | -        | 非受控。                                                                                                                                                      |
| `onChange`                                                                      | `(value: string) => void`                                                                | -        | -                                                                                                                                                             |
| `onChangeEvent`                                                                 | `(e: ChangeEvent<HTMLSelectElement>) => void`                                            | -        | -                                                                                                                                                             |
| `items`                                                                         | `Array<{ value: string; label: ReactNode; isDisabled?: boolean; description?: string }>` | -        | 声明式；**与 `children`（`<SelectOption>`）二选一**。                                                                                                         |
| `children`                                                                      | `ReactNode`                                                                              | -        | 声明 `<SelectOption value="...">Label</SelectOption>`；内部编译为 `<option>`（native 不支持 ReactNode 作为 label，fallback 到 `toString`，所以 items 优先）。 |
| `startContent`, `endContent`                                                    | -                                                                                        | -        | 左侧 slot（图标）；右侧默认有 chevron，可用 `endContent` 覆盖。                                                                                               |
| `name`, `id`, `required`, `multiple`                                            | -                                                                                        | -        | 原生透传（**`multiple={true}` 暂不支持**——v1 scope 外；传入时 dev 警告）。                                                                                    |

#### 视觉 Variants

- 与 Input 完全一致的 4 种 variant。
- 右侧默认 chevron（12×12 SVG，`colors.text.muted`）；**原生下拉箭头被隐藏**（`appearance: none`），我们自己画。
- **分组**：如果 `items` 中某项有 `group` 字段（可选），自动生成 `<optgroup>`。v1 可不做分组，留 prop 接口。

#### 交互行为

- 完全依赖原生 `<select>` 的键盘 / 触屏 / 屏幕阅读器行为（这是放弃自定义 popover 的最大收益）。
- 受控 / 非受控同 Input。
- placeholder 项 `disabled` 且 `hidden`，用户不能再选回空值（若想允许清空需传 `isClearable` → v1 **不做**，因为 native select 没有干净的"清空"UI）。

#### a11y 要求

- 原生 `<select>` 天然支持；只需保证 label / describedby / invalid 的串联。
- `isRequired` → `required` 属性 + `aria-required`。
- 自定义 chevron 必须 `aria-hidden`。

#### 测试要点（≥ 6 条）

1. 受控：`value='b'` + `onChange`，用户选 `c` 触发 `onChange('c')`（字符串）。
2. 非受控：`defaultValue='a'` 初始选中 `a`；切换后 DOM 更新但外部状态不变。
3. `items` 渲染出正确数量的 `<option>` 且 `value` / `disabled` 正确。
4. `placeholder` 生效：初始时选中的是 placeholder option，`disabled hidden` 齐备。
5. `children` 写法（`<SelectOption>`）编译为正确的 `<option>`；传入非 string children 时 dev 警告。
6. `errorMessage` → `aria-invalid="true"` + `aria-describedby` 串联。
7. `isDisabled` 下 select 不可交互。
8. chevron 为 `aria-hidden` 且点击 select 区域任意处会打开下拉（浏览器原生行为——这条测试依赖用户事件模拟，可以放 e2e 里）。
9. `ref.current instanceof HTMLSelectElement`。
10. `expectA11y` 两主题零违规。

---

## 3. 新增 token 清单

绝大部分可复用现有 token；下表仅列 **真正需要新增** 的条目。如果某条能通过调整组件实现避免新增，我会在"说明"里注明替代方案。

| token 路径                | light 取值                                                                      | dark 取值                                       | 用途 / 说明                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors.bg.field`         | `palette.white`                                                                 | `palette.gray[900]`（参考 dark theme 现有暗色） | **可选新增**。Input/Textarea/Select 在 `variant='bordered'` 时的背景。若复用 `bg.surface` 在 dark 下对比度足够（需实测），可不新增。**默认方案：复用 `bg.surface`，不新增。** |
| `colors.field.hover`      | `palette.gray[50]`                                                              | `rgba(255,255,255,0.04)`                        | **可选新增**。Input hover 背景（`flat` variant 下）。**默认方案：复用 `bg.muted`，不新增。**                                                                                  |
| `components.input`        | 对齐 `components.button` 的 5 档尺寸对象                                        | 同 light                                        | **建议新增**。各 size 的 `height / fontSize / lineHeight / paddingX / iconSize`。现在所有表单组件共享（Input/Textarea/Select），避免 3 个组件各自硬编码尺寸数字。             |
| `components.checkbox`     | `{ sm:16, md:20, lg:24 }`（指示器尺寸 px）                                      | 同 light                                        | **建议新增**。Checkbox / Radio 指示器尺寸。                                                                                                                                   |
| `components.switch`       | `{ sm:{w:32,h:20,thumb:16}, md:{w:48,h:28,thumb:24}, lg:{w:56,h:32,thumb:28} }` | 同 light                                        | **建议新增**。Switch 的轨道/滑块尺寸。                                                                                                                                        |
| `borders.width.underline` | `'2px'`                                                                         | 同 light                                        | **可选新增**。Input `variant='underlined'` focus 时的底线；可以复用 `borders.width.thick` 若已是 2px。**默认方案：复用 `borders.width.thick`，不新增。**                      |

**结论**：**必须新增**的 token 只有 `components.input / components.checkbox / components.switch` 这 3 个尺寸表（放在 `packages/tokens/src/components.ts`）；色值类 token **不新增**，全部复用现有 semantic scale。

---

## 4. 开发任务分派建议

### 4.1 工程师切分（4 人并行模型）

| Engineer       | 责任                         | 组件                                                                                                                                                              | 理由                                                                                                 |
| -------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **E1（基座）** | token + FormField + 样式工具 | `components.{input,checkbox,switch}` token 新增、`FormField`、`utils/fieldStyles.ts`（variant 样式函数）、`utils/useControllableState.ts`（受控/非受控统一 hook） | 所有组件的前置依赖；E1 完成一半（fieldStyles + useControllableState 基础 API）后 E2/E3/E4 才能开动。 |
| **E2**         | Input + Textarea             | `Input`（含 clearable、password toggle）、`Textarea`（含 auto-size）                                                                                              | 共享 fieldStyles，可以并行在同一 PR 中推进。                                                         |
| **E3**         | Checkbox + Radio             | `Checkbox` + `CheckboxGroup`、`Radio` + `RadioGroup`                                                                                                              | 两组结构相似，一个人做可以最大化代码复用（内部的 indicator 绘制可抽共用）。                          |
| **E4**         | Switch + Select              | `Switch`、`Select`（含 `SelectOption`）                                                                                                                           | Switch 独立；Select 依赖 fieldStyles（E1 产物），稍晚开始。                                          |

### 4.2 串行 / 并行

```
Day 1:   E1 → 新增 token + fieldStyles + useControllableState
           ↓（API 冻结后）
Day 2+:  E1 FormField (独立)  ||  E2 Input → Textarea  ||  E3 Checkbox → Radio  ||  E4 Switch → Select
           ↓
Day N:   Integration / Storybook polish / a11y review
```

- 关键串行点：**fieldStyles 与 useControllableState 的 API 必须在 Day 1 end of day 冻结**（E1 先把 TS 签名写死 + 空实现合入 main），否则 E2/E4 会阻塞。
- FormField 不阻塞其它人：每个 field 组件先自实现 label/error 渲染；有了 FormField 后再改成内部 `return <FormField>{unwrappedField}</FormField>`。所以 **FormField 可以 E1 在 token 冻结后自己做**，不用等。

### 4.3 冲突防护（barrel / theme 文件）

**核心冲突文件**：

1. `packages/components/src/index.ts`（barrel 导出）
2. `packages/tokens/src/components.ts`（新增 input/checkbox/switch token）
3. `packages/themes/src/lightTheme.ts` / `darkTheme.ts`（如果有新 color token——本 spec 默认不新增，所以 **不会碰 theme**）
4. `packages/tokens/src/index.ts`（可能需要重新 re-export）

**规则**：

- **每个组件一个 PR**，每个 PR **只追加** barrel 的 `export * from './XXX'`，**不改其它行**，冲突时 rebase 非常干净（单行 append 不会 conflict）。
- `tokens/src/components.ts` 在 Day 1 由 E1 一次性把 `input / checkbox / switch` 三个子对象都加好（即使数值留占位），后续谁也不再改这个文件，**只读不写**。
- **严禁在表单组件 PR 里顺手改 Button / 共享样式**；如需要，单独开 refactor PR。
- PR 标题走 Conventional Commits：`feat(input): initial implementation`、`feat(tokens): add input/checkbox/switch size tokens`。
- Changesets：每个新组件 **单独一个 minor** changeset（文案 "Add `<Component>` component."），token 新增用 `patch`。

### 4.4 质量门禁（合入 main 前）

每个组件 PR 必须过：

- `pnpm --filter @timeui/react test`（含新组件的 `.test.tsx` 与 `.a11y.test.tsx`）
- `pnpm --filter @timeui/react test:coverage`（lines/fn/stmt ≥ 85%、branch ≥ 80%——本仓库的阈值）
- `pnpm lint && pnpm typecheck`
- `pnpm size`（表单组件共计预算不超过 +30KB gzipped，见下）
- 新增至少一个 Storybook story 覆盖所有 variant × size 矩阵

**size 预算分配**（参考，实现人自己对齐）：

- FormField ≈ 1.5 KB
- Input ≈ 6 KB（含 clearable / password toggle 逻辑）
- Textarea ≈ 4 KB（auto-size mirror）
- Checkbox + Group ≈ 4 KB
- Radio + Group ≈ 3 KB
- Switch ≈ 3 KB
- Select ≈ 4 KB
- **合计 ≈ 25.5 KB gzipped**，低于 80 KB 主包总预算的余量。

---

## 5. 未决 / v2 候选（本轮不做）

- `NumberInput`（含 stepper 按钮）— 需要 i18n 数字格式化。
- `FileInput` / Dropzone — 需要 drag & drop 状态机。
- `Combobox` / `Autocomplete` — 需要 Popover + 虚拟列表。
- `DatePicker` / `TimePicker` — 体量大，单独 RFC。
- Checkbox / Radio 的 `card` variant（大块可点击卡片）— 等用户反馈再加。
- Select 的自定义 Popover 版本（`SelectMenu`）— 等 `Popover` 原语落地后做。

---

## 6. 验收清单（评审时用这个打勾）

- [ ] 每个组件同时支持受控与非受控（文档与测试双覆盖）
- [ ] 每个组件在 light 和 dark theme 下都通过 `expectA11y`
- [ ] 每个组件支持 `prefers-reduced-motion`
- [ ] 每个组件 `forwardRef` 指向可交互 DOM 元素
- [ ] variant / color / size / radius 命名与 Button 一致
- [ ] 布尔 props 统一 `is*` 前缀
- [ ] `onChange` 解包为值；原生 event 走 `onChangeEvent`
- [ ] 所有字段都能正确嵌套进 `FormField`（label/description/errorMessage 自动串联）
- [ ] Storybook 覆盖所有 variant × size × state（disabled/readOnly/invalid/required）
- [ ] 每组件 ≥ 6 条测试用例
- [ ] Changesets 齐备（每组件一个 minor）
- [ ] size-limit 通过
