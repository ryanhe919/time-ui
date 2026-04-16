# 安全策略

## 受支持的版本

| 版本范围 | 是否支持       |
| -------- | -------------- |
| 最新     | ✅             |
| 非最新   | ❌（请先升级） |

## 漏洞上报

**请勿在 Issue / Discussion 公开披露。** 请按以下方式联系：

1. 邮件发送到 **ryanhe0919@gmail.com**，内容包含：
   - 漏洞描述
   - 可复现步骤（最小化 PoC）
   - 受影响的包与版本范围
   - （如有）建议的修复思路
2. 你会在 **48 小时内**收到确认回复。
3. 修复会在私有分支完成，随后：
   - 发布 patch 版本
   - 创建一条 [GitHub Security Advisory (GHSA)](https://docs.github.com/zh/code-security/security-advisories)
   - 用 `npm deprecate` 标记受影响版本范围

## 协同披露

我们遵循协同披露原则——请在 patch 发布前不要公开漏洞细节，以保护所有在使用 TimeUI 的项目。

## 已知安全边界

- **CodeBlock** 通过 Shiki 渲染 HTML。仅接受传入的 `code` 字符串，不会执行其中的任何脚本，但宿主站点建议配置合适的 CSP 头。
- **`@timeui/react/code-block`** 是可选 sub-entry；shiki 是 optional peer dependency，不装也不会影响主包运行。
- npm 包仅发布 `dist/` 目录（见各包 `package.json#files`），不会夹带源码、测试或 `.env`。

## 依赖漏洞

依赖层面的 CVE 由 Dependabot + `pnpm audit` 跟踪。若你发现某个依赖的已知漏洞尚未被修复，请一并通过上面邮箱上报。
