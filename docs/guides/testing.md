# 测试指南

TimeUI 的质量把关分三层，三层都可以**在本地用 CI 相同的命令**跑通。

| 层级             | 工具                     | 覆盖范围                                  |
| ---------------- | ------------------------ | ----------------------------------------- |
| 单元 / 集成      | Vitest + Testing Library | 每个组件（位于 `packages/components`）    |
| 可访问性（a11y） | `vitest-axe` + axe-core  | 在单测里通过 `expectA11y()` 调用          |
| 构建 / 尺寸      | tsup + size-limit        | 所有包打包产物 + `@timeui/react` 主包预算 |

> Storybook、Chromatic、Playwright 相关的旧流程已移除；文档站换成了 Next.js + @next/mdx，交互示例直接在 MDX 里渲染。

---

## 单元测试

```bash
pnpm --filter @timeui/react test              # 跑一次
pnpm --filter @timeui/react test:watch        # watch 模式
pnpm --filter @timeui/react test:coverage     # v8 覆盖率
```

覆盖率阈值（`packages/components/vitest.config.ts`）：

- lines / functions / statements：**75%**
- branches：**50%**

> 阈值随组件库成长会逐步抬高，当前取值是重构后的临时值。

报告输出：`text`（stdout）、`html`（`coverage/index.html`）、`lcov`（`coverage/lcov.info`，CI 上传到 Codecov）。

### 写组件测试

永远通过 `@timeui/react/test-utils` 的 `renderWithProviders` 渲染，以保证测试环境与终端用户消费的 `ConfigProvider` + `ThemeProvider` 栈一致：

```tsx
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@timeui/react/test-utils';
import { screen } from '@testing-library/react';
import { Widget } from './Widget';

describe('Widget', () => {
  it('在深色主题下能渲染', () => {
    renderWithProviders(<Widget label="Hi" />, { theme: 'dark' });
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });
});
```

选项：`{ theme?: 'light' | 'dark' | TimeUITheme, config?: Partial<TimeUIConfig>, locale?: Locale }`，其余同 Testing Library `RenderOptions`（`wrapper` 除外）。

### 可访问性断言

`expectA11y(container)` 封装了 axe-core，放在测试末尾调用：

```tsx
import { renderWithProviders, expectA11y } from '@timeui/react/test-utils';

it('无 axe 违规', async () => {
  const { container } = renderWithProviders(<Widget label="Hi" />);
  await expectA11y(container);
});
```

参考 `packages/components/src/Button/Button.a11y.test.tsx`。**每个组件至少一条 a11y 测试**。

---

## 构建与尺寸预算

```bash
pnpm build        # 构建所有包
pnpm size         # 校验 size-limit 预算
```

`size-limit` 配置在 `.size-limit.cjs`，现行预算：

| 入口                           | Gzip 上限 |
| ------------------------------ | --------- |
| `@timeui/react`（全量）        | 30 KB     |
| `@timeui/react`（仅 `Button`） | 20 KB     |
| `@timeui/react/code-block`     | 5 KB      |
| `@timeui/tokens`               | 4 KB      |

Shiki 是 CodeBlock 的可选 peer dep；需要语法高亮的用户自行 `pnpm add shiki`，主包不受影响。

---

## 文档站回归

```bash
pnpm --filter @timeui/docs build          # 构建 Next.js standalone
pnpm --filter @timeui/docs start          # 本地起已构建的文档站
```

文档站目前没有自动化视觉回归。如需本地冒烟，可直接在浏览器打开每个组件页面（`/zh/docs/components/...`）检查。

---

## CI 流水线

`.github/workflows/ci.yml` 在每个 PR 上运行：

1. **verify** — Lint、Typecheck、单测 + 覆盖率上传、所有包构建、文档站构建。
2. **size** — 校验 `size-limit` 预算。

`.github/workflows/release.yml` 在合并到 `main` 时由 Changesets 触发发版 PR / 发布 npm。
`.github/workflows/deploy-docs.yml` 把文档站 rsync 到生产机（CentOS + pm2）。
`.github/workflows/security-audit.yml` 用 Google [osv-scanner](https://github.com/google/osv-scanner) 扫描 `pnpm-lock.yaml`——替代已失效的 `pnpm audit`（npm registry 的老 audit 端点已退休返回 410）。触发时机：PR（当 lockfile 或 package.json 变化）、push 到 main、以及每周一 01:00 UTC 的定时任务。

本地手工扫描：

```sh
# 首次下载 osv-scanner（已 gitignore）
curl -sSL -o /tmp/osv-scanner \\
  https://github.com/google/osv-scanner/releases/latest/download/osv-scanner_darwin_arm64
chmod +x /tmp/osv-scanner

# 执行扫描
/tmp/osv-scanner scan source --lockfile=pnpm-lock.yaml
```

`.github/dependabot.yml` 每周一早 01:00（Asia/Shanghai）开 PR 聚合 patch/minor 升级，安全补丁不受此节奏限制、立即开 PR。

## 必要的 Secrets

| Secret          | 用途                                                  | 必需度         |
| --------------- | ----------------------------------------------------- | -------------- |
| `CODECOV_TOKEN` | 上传覆盖率（私有仓库）                                | 可选           |
| `NPM_TOKEN`     | 发布到 npm（建议用启用 Bypass 2FA 的 Granular Token） | 发版必需       |
| `DEPLOY_HOST`   | docs 部署目标机 IP                                    | 部署文档站必需 |
| `DEPLOY_USER`   | SSH 用户名                                            | 部署文档站必需 |
| `DEPLOY_KEY`    | SSH 私钥（ed25519）                                   | 部署文档站必需 |
| `DEPLOY_PATH`   | 远程部署目录                                          | 部署文档站必需 |
| `DEPLOY_PORT`   | SSH 端口（默认 22）                                   | 可选           |
