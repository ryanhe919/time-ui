---
'@timeui/react': minor
---

feat(chat): polish Chat family + add ChatScrollToBottom & ChatFileChip

A round of audit-driven cleanup across the Chat component family, plus
two new components that fill recurring product gaps. No breaking
changes — `ChatComposer.ref` switches from a `<div>` element to an
imperative handle, see migration note below.

**ChatComposer**

- Ref now exposes a `ChatComposerHandle` with `focus()` / `blur()` /
  `getElement()` / `getTextarea()`. Calling `composerRef.current?.focus()`
  finally focuses the textarea (was previously a no-op on the wrapper
  div). Migration: replace `useRef<HTMLDivElement>` with
  `useRef<ChatComposerHandle>`; if you used `composerRef.current` as a
  DOM node, call `composerRef.current?.getElement()` instead.
- Focus state moved from React `useState` to CSS `:focus-within`, so
  the wrapper no longer re-renders on focus / blur. The `data-focused`
  attribute is removed (you can rely on `:focus-within` in CSS).
- Focus ring upgraded from a 1px border colour swap to a 2px
  `inset box-shadow` to match the `Input` / `Select` field family — no
  more 1→2px width jitter on focus.
- Composer demo MDX (`chat/composer/{en,zh}.mdx`) is now a runnable
  self-contained `Demo()` function so the LiveDemo no longer throws
  `ScopeError: value is not defined` in editable mode.

**New: `ChatScrollToBottom`**

Floating "↓ N new messages" pill button for chat surfaces. Pair with
the new `ChatMessageList` `onAtBottomChange(atBottom)` callback so the
button only shows when the user has scrolled away from the bottom.
Configurable icon, optional unread count badge, full keyboard +
focus-visible support.

**New: `ChatFileChip`**

Replaces hand-rolled file-chip `<span>`s in the composer top slot. One
component covers the standard set: file name + extension-derived kind
icon, optional size label, optional remove button (with proper event
isolation), optional inline upload progress bar, error state, and a
clickable variant for "preview attachment" flows.

**`ChatMessageList` — auto-scroll bug fix**

The list previously forced `scrollTop = scrollHeight` on every child
update, hijacking the user's position whenever they scrolled up to read
history. Auto-scroll now only fires when the user is already within
32px of the bottom. The new `onAtBottomChange` prop reports
"scrolled-away / back-at-bottom" transitions so consumers can show /
hide `ChatScrollToBottom`. Also documents the deliberate
`aria-live="polite" aria-relevant="additions"` choice (we omit
`'text'` to keep streaming tokens from being re-announced).

**`ChatToolCall` — focus visual aligned**

Header focus now lifts the whole card (border colour change + 2px
outline ring) instead of drawing an inset outline inside the button.
Matches `ChatActionButton` / `ChatSendButton` / `ChatKnowledgeRefs`.

**`ChatMessage` — flow polish**

- Streaming caret sized in `em` units (0.55em × 1em) so it scales with
  the surrounding font size; visual is unchanged at the default 14px
  but no longer fixed-pixel.
- Assistant / tool / knowledge bubbles now default to
  `white-space: normal`. User input bubbles still use `pre-wrap` to
  preserve manual newlines. Fixes spurious empty lines when wrapping a
  `<ChatMarkdown>` inside an assistant message.
