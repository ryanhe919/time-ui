---
name: component-design
description: 单独的"组件设计阶段"工作流——只产出 spec 不实现。当用户已有需求但还没准备好开发、或想先评审设计再开工时调用。比 /new-component 轻量，只触发 component-architect 一个 agent。
---

# 仅设计 spec（不开工）

## 何时调用

- 用户说「先写 spec / 先做设计 / 先评审接口」「我们先聊设计」
- 用户对组件还不确定细节，想先有个 spec 当讨论稿
- 项目早期阶段、需要给客户/产品方先看接口设计

**不适用**：用户已经清楚要做并希望端到端交付 → 用 `/new-component`。

## 流程

直接 spawn **一次性** component-architect（不组 team）：

```
Agent({
  subagent_type: "component-architect",
  prompt: <用户原始需求 + 期望覆盖的组件 + 优先级>,
  description: "Design spec for <feature>"
})
```

architect 会产出 `.claude/team-docs/<feature>-spec.md`。

## 后续选项（spec 出来后告诉用户）

> Spec 已就绪：`.claude/team-docs/<feature>-spec.md`。可选下一步：
>
> - **同意设计**：跑 `/new-component` 进入实现阶段（会组 team）。
> - **修改设计**：直接告诉我哪条要改，我让 architect 改 spec。
> - **设计语言评审**：跑 `Agent(design-language-guardian)` 检查与已有组件一致性。

## 红线

- 不要在这个 skill 里组 team —— 它就是为"轻量设计"存在的。
- 不要让 architect 顺手写代码——spec 阶段不写实现。
