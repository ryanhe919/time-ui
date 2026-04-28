---
name: update-docs
description: 为已有组件追加/更新双语 MDX 文档与 LivePlayground 示例。当组件代码已经存在但文档缺失/过时、或需要给已有组件加新示例时调用。会自动调起 docs-author，并在文档落地后强制重建 MCP 索引。
---

# 文档更新工作流

## 何时调用

- 已有组件源码 + 测试，但 `apps/docs/src/app/[locale]/docs/components/<name>/` 缺 mdx 或缺示例
- 组件 API 改了，文档没同步
- 用户说「补一下 X 的文档」「X 的文档过时了」「给 X 加个示例」

**不适用**：新增组件（用 `/new-component` 走完整流程，里面已含文档环节）。

## 流程

### 1. 调起 docs-author

```
Agent({
  subagent_type: "docs-author",
  prompt: "为 <ComponentName> 更新文档；当前组件源码在 packages/components/src/<Name>/；spec 文档（如有）在 .claude/team-docs/...；要补/改的内容：<具体描述>"
})
```

### 2. 等 docs-author 完成（含本地浏览器眼检）

docs-author 会：

- 读源码 + spec
- 写/改 `apps/docs/src/app/[locale]/docs/components/<kebab-name>/{en,zh}.mdx` + `page.tsx`
- 起 dev server 浏览器眼检 LivePlayground
- 关 dev server

### 3. **必须**重建 MCP 索引

```bash
pnpm --filter @timeui/mcp build:index
pnpm --filter @timeui/mcp test
```

这是这个 skill 的关键差异：单纯改 MDX 不重建索引会让 AI 客户端拿到过期数据。

### 4. （可选）写 patch changeset

如果只是文档勘误一般不需要 changeset；如果是 API 变更同步的文档更新，跟随 API 变更的 changeset 一起。

## 完成后的汇报

```
✅ <ComponentName> 文档更新完成
- mdx 修改：en + zh 双语
- LivePlayground：浏览器眼检通过
- MCP 索引：已重建（packages/mcp/data/index.json）
- changeset：<patch / 不需要>
```

## 红线

- **MCP 索引必须重建**。漏掉这一步是这个 skill 最常见的失败模式。
- 不要单语种交付（只写 en 或只写 zh）。
