# 发版指南

TimeUI 用 [Changesets](https://github.com/changesets/changesets) 管理版本与 npm 发布，整套流程由 `.github/workflows/release.yml` 驱动。

## TL;DR

1. 在分支上开发。
2. `pnpm changeset`，描述本次改动（按包区分 patch / minor / major）。
3. 把生成的 `.changeset/*.md` 跟代码一起提交、合进 PR。
4. PR 合到 `main` 后，Changesets 机器人会开一个 "Version Packages" PR。
5. 合并这个 PR → Release workflow 自动打版本、更新 `CHANGELOG.md`、发布到 npm。

**不要手动 `npm publish`。**

## 写一条合格的 changeset

```
pnpm changeset
```

只勾选**真正改动到的包**。类型：

- `patch`：Bug 修复、内部重构、依赖升级。
- `minor`：新增功能、新组件、新 props、新 variant。
- `major`：破坏性变更（删 prop、改默认值、改类型签名）。

摘要按"面向用户的变更日志"写：

> `Button`: 新增 `loading` prop，在保持宽度不变的前提下用 spinner 替换 children。

chore、docs、test、内部重构通常**不需要** changeset。

## 正常发版流程

```
PR 合并到 main
   ↓
changesets/action 开 "Version Packages" PR
   ↓
Maintainer review 版本号 + CHANGELOG diff
   ↓
合并 → release job 构建所有包 → changeset publish 到 npm
   ↓
GitHub Release 自动生成
```

## Canary / 快照版本

适用于：某个改动尚未合并，但想让下游先试用。

```
pnpm changeset version --snapshot canary
pnpm -r --filter "./packages/*" build
pnpm changeset publish --tag canary
```

项目里已经封装为一条命令：

```
pnpm changeset:snapshot
```

下游安装：

```
pnpm add @timeui/react@canary
```

`canary` tag 与 `latest` 互不干扰。需要清理时：

```
npm dist-tag rm @timeui/react canary
```

## Hotfix 流程

针对已发版本的紧急修复：

1. 从发布 tag 拉分支：`git checkout -b hotfix/0.4.x v0.4.2`。
2. 修 + 加一条 `patch` changeset。
3. PR 目标分支指向长期维护的 `release/0.4`（没有就建）。
4. 合并 → Changesets 自动在该分支线上发 patch。
5. 用 cherry-pick 或后续 PR 把修复移植到 `main`。

如果主线分支已大幅分叉，可以手动发：

```
pnpm changeset version
pnpm -r --filter "./packages/*" build
pnpm changeset publish
```

## 下架 / 弃用

**不要 `npm unpublish`**（72 小时后 npm 不允许，且会破坏下游的 lockfile）。

用 deprecate 代替：

```
npm deprecate @timeui/react@0.4.3 "严重回归 — 请使用 0.4.4"
```

安全性问题请按 [../SECURITY.md 在仓库根目录](../../SECURITY.md) 的协同披露流程处理（patch 发布 → GHSA → `npm deprecate`）。

## 发布到 npm 的 Token 配置

发布到 npm 的身份由 `NPM_TOKEN` secret 提供：

- 必须是 **Granular Access Token**。
- 作用范围（Packages）包括 `@timeui` scope。
- 启用 **"Bypass 2FA"** ——否则 CI 会在 publish 时被 npm 403 拒绝（自动化环境不能交互输入 OTP）。
- 权限勾选 `Read and write`。

设置位置：npmjs.com → Account Settings → Access Tokens → Generate New Token → Granular。

## 常见故障

- **"No changesets found"** —— 正常，说明本轮没有待发布变更。
- **publish 403** —— 大概率是 `NPM_TOKEN` 过期 / 没开 Bypass 2FA / scope 不含 `@timeui`。
- **Version PR 没开出来** —— 看 release workflow 日志；常见原因是 `GITHUB_TOKEN` 权限不足（需要在仓库 Settings → Actions → Workflow permissions 勾选 "Allow GitHub Actions to create and approve pull requests"），或者 `CHANGELOG.md` 合并冲突。
- **发错版本想回滚** —— 不要 unpublish，补一个反向 changeset 再发一版；然后 `npm deprecate` 掉错版本。
