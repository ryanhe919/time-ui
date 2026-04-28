---
name: new-component
description: 用真正的持久 Agent Team 编排一次完整的"新组件"流程（需求分析 → 设计 spec → 并行实现 → 并行测试 → 双语文档 → MCP 索引 → changeset）。当用户提出新增 1 个或多个 TimeUI 组件、明确说"组个团队做 X"、或要求走端到端流程时调用。
---

# 新组件团队工作流

## 何时调用

用户消息包含以下任一信号 → 用本 skill：

- 「新增一个 X 组件」「做一个 X 组件」「需要一个 X 来做 Y」
- 「组个团队做 X」「team 做 X」「Agent Team」
- 「按完整流程」「从设计到发布」「按规范走一遍」
- 同时新增 ≥ 2 个组件（必须用 team，不可一次性 Agent 应付）

**不适用**：仅修 bug、仅改样式、仅升级依赖、仅写文档勘误 → 直接做，不组队。

## 流程总览

```
[Phase 1] tech-lead（你自己）─→ TeamCreate("timeui-<feature>")
                              └→ Agent(component-architect) 写 spec
                                       │
[Phase 2] design-language-guardian 评审 spec（异步）
                                       │
[Phase 3] tech-lead 按 spec 切分任务，并行派工：
            ├→ Agent(component-engineer #1) 做组件 A
            ├→ Agent(component-engineer #2) 做组件 B
            └→ Agent(component-engineer #3) 做组件 C
                                       │
[Phase 4] 实现完成 → 并行派工：
            ├→ Agent(component-tester #1) 测组件 A
            ├→ Agent(component-tester #2) 测组件 B
            └→ Agent(component-tester #3) 测组件 C
                                       │
[Phase 5] design-language-guardian 评审实现（异步）
                                       │
[Phase 6] Agent(docs-author) 写双语文档（建议串行单实例，避免 navigation 冲突）
                                       │
[Phase 7] Agent(release-engineer) build/lint/typecheck/test:coverage/size/MCP/changeset
                                       │
[Phase 8] tech-lead 给所有成员发 shutdown_request → TeamDelete
```

## 详细步骤

### Phase 1：起团队 + 设计师上岗

```
TeamCreate({ name: "timeui-<feature>" })
```

- `<feature>` 用 kebab-case，如 `timeui-form-fields`、`timeui-data-grid`、`timeui-tooltip`。

```
Agent({
  team_name: "timeui-<feature>",
  name: "architect",
  subagent_type: "component-architect",
  prompt: <把用户原始需求 + 期望交付的组件清单原文给他>
})
```

- 等架构师产出 spec 文档（`.claude/team-docs/<feature>-spec.md`）后再进 Phase 2。

### Phase 2：设计语言评审（可选但推荐）

```
Agent({
  team_name: "timeui-<feature>",
  name: "guardian",
  subagent_type: "design-language-guardian",
  prompt: "评审 .claude/team-docs/<feature>-spec.md 的设计语言一致性"
})
```

- 收到评审：🔴 阻断项 → 让 architect 改 spec；🟡 警告 → 记录在你脑子里 Phase 5 时再校；✅ 直接进 Phase 3。

### Phase 3：并行实现

按 spec 第 5 章「开发任务分派建议」切分。每个工程师对应一个 Agent 实例：

```
Agent({ team_name: ..., name: "engineer-1", subagent_type: "component-engineer", prompt: "...你的任务：组件 A 和 B；spec 路径：..." })
Agent({ team_name: ..., name: "engineer-2", subagent_type: "component-engineer", prompt: "...你的任务：组件 C；..." })
```

**并行规则**：

- 工程师之间**不直接通信**，有问题通过 SendMessage 找你（tech-lead）协调。
- 共享 util / hook（如 `useControllableState`）：spec 里指定哪个工程师负责，其它人先用占位 import；占位作者第一时间合入再让其它人 rebase。
- barrel 文件 `packages/components/src/index.ts`：所有人**只追加新行不改其它行**。

### Phase 4：并行测试

实现进来后立刻派测试（不要等所有组件都实现完）：

```
Agent({ team_name: ..., name: "tester-1", subagent_type: "component-tester", prompt: "测组件 A，已实现在 packages/components/src/A/" })
```

- 测试不达标（覆盖率 < 85% 或漏测试要点）→ tester 找你 → 你看是 spec 问题还是实现问题，决定让谁修。

### Phase 5：实现评审（可选）

```
SendMessage({ to: "guardian", content: "评审已实现的组件 A/B/C 是否对齐 spec 与设计语言" })
```

- 红色项必须修才能进 Phase 6。

### Phase 6：文档（建议单实例串行）

```
Agent({ team_name: ..., name: "docs", subagent_type: "docs-author", prompt: "为组件 A/B/C 写双语 MDX 文档" })
```

- 建议**单 docs-author 实例顺序做**，因为 `apps/docs/src/lib/navigation.ts` 是冲突高发文件。
- docs-author 必须本地起 dev server 浏览器眼检（在 prompt 里强调）。

### Phase 7：发布预检

```
Agent({ team_name: ..., name: "release", subagent_type: "release-engineer", prompt: "对 <feature> 这一波新组件跑全套门禁 + MCP 索引重建 + changeset" })
```

任意一步失败：你（tech-lead）协调对应队友修。

### Phase 8：清场

按 CLAUDE.md（用户全局规则）要求**必须**清场：

```
对每个 still-running 成员：SendMessage({ to: <name>, type: "shutdown_request" })
TeamDelete({ name: "timeui-<feature>" })
```

## 你（tech-lead，主 Claude）的工作

- **不要自己下场写组件代码 / 测试 / MDX**。你的角色是协调：派工、读汇报、解决跨成员冲突、决定优先级。
- 唯一你必须亲自做的事：
  - 写最终的 commit / PR（tech-lead 提交，不让成员提交）。
  - 当成员之间有 spec 解读分歧时拍板（或回头让 architect 修 spec）。
  - 监控用户预算（不要让团队跑出意外的 token 消耗）。

## 完整调用示例（tech-lead 可直接抄）

> 假设用户说："帮我加一个 `Tooltip` 和 `Popover` 组件，先做 Tooltip。"

**Phase 1：起 team + 派架构师**

```
TeamCreate({ name: "timeui-overlays" })
```

```
Agent({
  team_name: "timeui-overlays",
  name: "architect",
  subagent_type: "component-architect",
  description: "Spec for Tooltip + Popover",
  prompt: `用户需求：新增 Tooltip 与 Popover 两个 overlay 组件，先 Tooltip。
约束：必须复用项目已有的 Portal 模式（参考 Modal/Drawer），保持设计语言一致。
请按 .claude/agents/component-architect.md 的规范产出 .claude/team-docs/overlays-spec.md。`
})
```

→ 等他写完 spec 给汇报。

**Phase 2：（可选）评审 spec**

```
Agent({
  team_name: "timeui-overlays",
  name: "guardian",
  subagent_type: "design-language-guardian",
  description: "Review overlays spec",
  prompt: "评审 .claude/team-docs/overlays-spec.md 与已有 Modal/Drawer/Popover 的一致性"
})
```

→ 收到红绿评审。红的让 architect 改 spec；绿的进 Phase 3。

**Phase 3：派工程师并行实现**

```
Agent({
  team_name: "timeui-overlays",
  name: "engineer-tooltip",
  subagent_type: "component-engineer",
  description: "Implement Tooltip",
  prompt: `Spec：.claude/team-docs/overlays-spec.md
你负责：Tooltip 组件
不要碰：Popover（另一位工程师做）；packages/tokens/（token 已由 architect 在 Day 1 加好，只读不写）
共享 util：useFloatingPosition 已在 packages/utils 里，直接 import。`
})
```

```
Agent({
  team_name: "timeui-overlays",
  name: "engineer-popover",
  subagent_type: "component-engineer",
  description: "Implement Popover",
  prompt: `<同上，组件换成 Popover>`
})
```

**Phase 4：实现合入后立刻派测试**

```
Agent({
  team_name: "timeui-overlays",
  name: "tester-tooltip",
  subagent_type: "component-tester",
  description: "Test Tooltip",
  prompt: `Spec：.claude/team-docs/overlays-spec.md（看 Tooltip 那节的 6+ 条测试要点）
源码：packages/components/src/Tooltip/
覆盖率门禁：lines/fn/stmt ≥ 85%、branch ≥ 80%。`
})
```

（Popover 同理一个 tester 实例）

**Phase 5：评审实现（可选）**

```
SendMessage({ to: "guardian", content: "评审 packages/components/src/Tooltip/ 与 Popover/ 是否对齐 spec 与设计语言；产出红/绿/警告评审" })
```

**Phase 6：单实例文档**

```
Agent({
  team_name: "timeui-overlays",
  name: "docs",
  subagent_type: "docs-author",
  description: "Docs for Tooltip + Popover",
  prompt: `为 Tooltip 与 Popover 写双语 MDX，先 Tooltip 后 Popover（避免 navigation.ts 冲突）。
本地起 dev server 浏览器眼检后提交。`
})
```

**Phase 7：发布预检**

```
Agent({
  team_name: "timeui-overlays",
  name: "release",
  subagent_type: "release-engineer",
  description: "Release readiness for overlays",
  prompt: "对 Tooltip + Popover 跑 7 步发布门禁；每个组件单独 minor changeset。"
})
```

**Phase 8：清场**

```
SendMessage({ to: "architect", type: "shutdown_request" })
SendMessage({ to: "guardian", type: "shutdown_request" })
SendMessage({ to: "engineer-tooltip", type: "shutdown_request" })
SendMessage({ to: "engineer-popover", type: "shutdown_request" })
SendMessage({ to: "tester-tooltip", type: "shutdown_request" })
SendMessage({ to: "tester-popover", type: "shutdown_request" })
SendMessage({ to: "docs", type: "shutdown_request" })
SendMessage({ to: "release", type: "shutdown_request" })
TeamDelete({ name: "timeui-overlays" })
```

→ 然后 tech-lead 自己提交 commit + PR。

## 失败模式 / 反模式

- ❌ **用一次性 Agent 调用代替 TeamCreate**：CLAUDE.md 已经禁止，会被用户打回（参考 2026-04-26 的明确反馈）。
- ❌ **跳过 spec 直接派工程师**：没有 spec 工程师们做出来的东西不一致，返工成本远高于先写 spec。
- ❌ **测试和实现是同一个 Agent 做**：违反职责分离，且实现者写测试天然有盲点。
- ❌ **忘记 MCP 索引重建**：docs 改了但 MCP 没重建，AI 客户端拿到旧数据 → 客户回头质疑组件库一致性。
- ❌ **完工后忘 TeamDelete**：team 不清理会一直占磁盘。
