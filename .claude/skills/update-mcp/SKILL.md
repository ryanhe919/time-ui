---
name: update-mcp
description: 重建 @timeui/mcp 包的 data/index.json 索引（基于 apps/docs 的 MDX 编译）。当 docs 站点的 MDX 结构变化、组件 props 表更新、或 navigation 改了之后必跑。也用于诊断 MCP 客户端检索结果不正确的问题。
---

# MCP 索引重建

## 何时调用

- 任意 `apps/docs/src/app/[locale]/docs/components/**/*.mdx` 改动后
- `apps/docs/src/lib/navigation.ts` 改动后
- 用户反馈 AI 客户端通过 MCP 拿到的数据是旧的 / 不全
- 任何 docs-author / `/update-docs` / `/new-component` 流程的尾巴

## 流程

### 1. 重建索引

```bash
pnpm --filter @timeui/mcp build:index
```

会扫 `apps/docs` 的 navigation + i18n + 所有组件 mdx，产出 `packages/mcp/data/index.json`。

### 2. 跑 mcp 单测

```bash
pnpm --filter @timeui/mcp test
```

测试会校验索引结构合法性（每个组件至少有一个 locale、props 表结构、search 关键词命中等）。

### 3. 如有必要本地起 stdio MCP server 验证

```bash
pnpm --filter @timeui/mcp build
node packages/mcp/dist/cli.js  # 或者 timeui-mcp 命令
```

然后用一个 list_components / get_component 调用看返回是否包含新组件 / 字段是否完整。

### 4. （可选）跑 HTTP transport

```bash
node packages/mcp/dist/http.js  # timeui-mcp-http
curl http://127.0.0.1:3333/...
```

## 诊断

如果索引重建后 MCP 客户端仍拿到旧数据：

- 客户端是否需要重启？（stdio transport 是按进程缓存的）
- 客户端是否在用旧版本的 `@timeui/mcp` 包？（npm 上的版本是不是落后了？）
- `data/index.json` 里有没有目标组件？（直接 `cat | jq` 一下）

## 红线

- 不要手动编辑 `data/index.json`。它是构建产物。
- 不要忘了跑单测—— index.json 格式漂移在 CI 上很容易没人察觉。
