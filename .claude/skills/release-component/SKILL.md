---
name: release-component
description: 跑全套发布预检并写 changeset。组件实现+测试+文档完成后调用，会调起 release-engineer 完成 build/lint/typecheck/test:coverage/size/MCP/changeset 7 步。
---

# 组件发布预检

## 何时调用

- 组件代码 + 测试 + 文档都到位，准备进 release PR 之前
- 用户说「准备发版」「跑下门禁」「我要 release」
- `/new-component` 流程的最后一步

## 流程

直接调起 release-engineer：

```
Agent({
  subagent_type: "release-engineer",
  prompt: "对 <ComponentName 列表> 跑发布预检：build / lint / typecheck / test:coverage / size / MCP 索引重建 / changeset"
})
```

release-engineer 会按顺序跑 7 步，任一步失败会停下来报告。

## 失败处理

- **build/typecheck 失败** → 让对应 component-engineer 修源码或 types
- **lint 失败** → 同上
- **test:coverage 不达标** → 让 component-tester 补用例
- **size 超标** → 与 component-architect 讨论是否拆 subpath export
- **MCP 索引异常** → 看是不是 docs MDX 结构有问题，让 docs-author 修
- **changeset 写错** → release-engineer 自己改

## 完成后的汇报

直接转述 release-engineer 的汇报模板（build✅ / lint✅ / typecheck✅ / coverage XX% / size XX KB / MCP 索引 ✅ / changesets N 个）。

## 红线

- 不要跳过任何一步。Release 流程的每一步都是真问题的探针。
- changesets 别忘了——没 changeset 的 PR 合到 main 不会触发版本号 bump，组件就发不出去。
