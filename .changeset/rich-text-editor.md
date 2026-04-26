---
'@timeui/react': minor
---

Add `RichTextEditor` — a full rich text editor based on TipTap, available as an independent subpath:

```ts
import { RichTextEditor } from '@timeui/react/rich-text-editor';
```

Why subpath: TipTap and ProseMirror weigh ~100 KB combined, so they're declared as **optional peer dependencies** and never flow into the main `@timeui/react` bundle. Installs that don't use the editor pay zero bytes for it.

**Highlights**

- Same size / variant / state vocabulary as `Input` and `Textarea` — `size: 'sm' | 'md' | 'lg'`, `variant: 'flat' | 'bordered' | 'faded'`, plus `isDisabled` / `isReadOnly` / `isInvalid`.
- Controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) modes, with internal sync that avoids feedback loops.
- Toolbar presets (`'minimal' | 'basic' | 'full'`), free-form `ToolbarItem[]` arrays, or `toolbar={false}` to hide entirely. Toolbar buttons reuse our own `Button isIconOnly`, eating the dog food.
- Pluggable: pass extra TipTap extensions via `extensions={[...]}`, or grab the editor instance via `onCreate={(editor) => ...}` for advanced workflows.
- A11y baked in: `role="textbox"`, `aria-multiline`, `aria-disabled` / `aria-readonly` / `aria-invalid`, toolbar `role="toolbar"`, per-button `aria-label` and `aria-pressed`. axe-clean.
- All visuals read from theme tokens — no hardcoded colors / sizes.

**Required peer deps to install alongside:**

```bash
pnpm add @tiptap/core @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-placeholder
```

Full docs: `/docs/components/rich-text-editor`.
