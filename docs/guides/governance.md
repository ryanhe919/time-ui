# 治理规则

TimeUI 目前由小团队维护，本文描述**谁决定什么、决策怎么走、项目如何演进**。

## 角色

### 贡献者（Contributors）

任何提 Issue / PR / RFC 的人。只受 `CODE_OF_CONDUCT.md` 约束（如存在；否则适用 Contributor Covenant v2.1 的通用条款）。

### 维护者（Maintainers）

在某个领域拥有写权限。审 PR、分流 Issue、指导贡献者。通过 `.github/CODEOWNERS` 登记到对应 team。

现有团队分工：

| Team                    | 范围                                      |
| ----------------------- | ----------------------------------------- |
| `@timeui/architects`    | monorepo 结构、构建、发版流水线、跨包决策 |
| `@timeui/dx`            | 工具链、脚手架、编辑器配置、CI、治理模板  |
| `@timeui/design-system` | tokens、themes、icons                     |
| `@timeui/components`    | React 组件、core 提供者、utils            |
| `@timeui/docs`          | 文档站（Next.js + MDX）、示例             |
| `@timeui/qa`            | 测试基础设施、a11y 审查、依赖安全         |

### 核心组（Core Team）

至少 3 名来自上述团队的成员组成。最终决策权：发版、RFC 接受、治理变更。新成员由现有 core member 提名，简单多数通过。

## 决策流程

多数变更走 lazy consensus：

1. 提 PR。
2. 至少一位 code owner approve。
3. CI 全绿，如果用户可见则附 changeset。
4. 合入。

有分歧 → 走 RFC。

## RFC 生命周期

以下情况需要 RFC：

- 跨组件的公开 API
- 破坏性变更
- 新增包
- 治理 / 流程变更

### 阶段

| 阶段           | 进入条件                                  | 退出条件                             |
| -------------- | ----------------------------------------- | ------------------------------------ |
| **Draft**      | 用 RFC 模板提 Issue                       | 作者标记 ready for review            |
| **Review**     | ≥ 2 位 core member 参与评论               | 至少 10 个自然日；主要反对意见被回应 |
| **Final Call** | Core team 发表 "final call" 评论          | 7 个自然日无 blocking 反对           |
| **Accepted**   | Core team 投票（多数通过，至少 3 人参与） | 实现 PR 合入                         |
| **Rejected**   | Core team 投票                            | Issue 关闭 + 理由评论                |
| **Superseded** | 新 RFC 替代                               | Issue 关闭并链接到新 RFC             |

Accepted RFC 由实现 PR 的 changeset 归档链接；RFC Issue 锁定，不删除。

## 废弃策略

TimeUI 按包遵循 semver。

1. **声明**：在 minor 版本里给 API 打 JSDoc `@deprecated`，在首次调用时打一条 dev-only `console.warn`，并在文档里注明替代方案。
2. **缓冲期**：被废弃 API 继续工作 **至少两个 minor 版本** 或 **90 天**，取更长者。
3. **移除**：在下一个 major 移除。Release notes 里写迁移指引，可行时在 `tools/codemods/` 下提供 codemod。

安全驱动的移除可加速，流程见 `SECURITY.md`。

## 发版节奏

- **Patch**：按需发布，通常每周都有。
- **Minor**：约每月一次，聚合 changeset。
- **Major**：一年最多两次，发布前用 `next` dist-tag 放 beta。

Canary / snapshot 可以随时通过 `pnpm changeset:snapshot` 发布。

## 修改本文

治理变更必须走 RFC，并得到 core team 显式多数通过。
