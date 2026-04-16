# `.vscode-template`

Canonical editor configs for TimeUI contributors. This repo tracks them under `.vscode-template/` (not `.vscode/`) so individual contributors can opt in without the folder being clobbered by personal overrides.

## Use

On first clone:

```sh
cp -r .vscode-template .vscode
```

After that, treat `.vscode/` as personal — pull in upstream changes from `.vscode-template/` as you like.

Contents:

- `settings.json` — format on save, ESLint + Stylelint as fix-all sources, workspace TypeScript.
- `extensions.json` — recommended extensions (ESLint, Prettier, Stylelint, Vitest Explorer, Playwright, EditorConfig, MDX).
- `launch.json` — Vitest debug configs (current file, watch) and a create-component CLI launcher.
