# Nano Banana / CalculusMate 代码隔离检查

检查日期：2026-10-11（北京时间）。检查为只读；没有更改应用代码、数据库数据或生产部署。

## 结论

当前 Nano Banana 源码、构建产物及线上代码未发现 CalculusMate 内容混入。Cloudflare 中仍可见两次 CalculusMate 历史部署，它们是错误关联自动构建留下的记录，不属于本仓库 Git 提交历史，也不再承接当前流量。

## 检查结果

| 范围 | 结果 |
| --- | --- |
| Git 仓库 | origin 为 `https://github.com/juren056/nanobanana21pro.com.git`；远程 main 与本地 HEAD 同为 `979fe0b4bbd205256370b988aee1f9e8b8e37090` |
| Git 历史 | 本地所有 refs 的 3 个提交扫描无 CalculusMate 标识；错误构建的提交 `3861320efdfb5937c64ea40669f5095cdefb3527` 不在本仓库对象中 |
| 本地文件 | 检查源码、翻译、public 与 `.output` 共 2738 个文件；文本文件未命中 CalculusMate 品牌、域名、数据库 ID、计算器路由及专属模块标识 |
| 环境与部署配置 | `.env.production`、`.env.local`、`.env.development`、Wrangler 部署配置未发现 CalculusMate 标识；检查未输出环境变量值 |
| 当前部署 | `18ec1e7e-f232-4640-95e8-454a6fc37fbe` 承接 100% 流量，来源 Wrangler；最新部署时间 2026-10-11 00:35:04 北京时间 |
| 服务端代码 | 从 Cloudflare 内容 API 取回当前 Worker 的全部 226 个模块，与 `.output/server` 同名文件逐字节比较；差异 0，CalculusMate 标识 0 |
| 前端代码 | 线上 131 个 JS、2 个 CSS 均 HTTP 200，与本地构建逐字节一致；差异 0，CalculusMate 标识 0 |
| 公开页面 | 首页、prompts、pricing、editor、scientific-figures、sitemap、robots 均 HTTP 200，与生成文件逐字节一致，无 CalculusMate 标识 |
| 数据库绑定 | 当前 D1 为 `342759c0-6eec-465f-a80c-717c500ab546`（`nanobanana21pro-db`），不是 CalculusMate D1 |
| 数据库配置 | 对生产 config 表只读扫描，8 行中无 CalculusMate 名称或域名匹配；未执行写入 |

服务端核验使用 Cloudflare 官方 [Get Worker Script Content API](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/content/methods/get/)。仅使用原有 Wrangler 凭据读取本账户服务，没有新增访问权限或输出凭据。

## 历史记录说明

`78b3da1b` 与 `bf6d07a5` 是曾经将 CalculusMate 整个部署包发布到 Nano Banana Worker 的错误版本。恢复时发布了完整 Nano Banana 构建包；本次回读线上完整服务端模块确认没有留下混合代码。

这些历史版本不应被重新部署或用于回滚。错误的 CalculusMate Git 关联已解除；后续 Nano Banana 发布应使用本仓库的部署脚本与配置。

## 证据

- `.artifacts/account/code-isolation-audit.json`：逐文件比对、SHA-256、扫描与页面检查结果，`passed: true`。
- `.artifacts/account/code-isolation-current-deployment.json`：当前版本与 100% 流量状态。
- `.artifacts/account/remote-worker-content.meta.json`：线上 Worker 内容返回 HTTP 200。
- `.artifacts/account/cf-projects-separated.png`：两个 Worker 分别绑定各自域名。

本次没有重写 Git 历史或删除 Cloudflare 历史部署记录。审计结论针对当前代码、部署与配置，不将历史记录消失作为代码隔离的判断依据。
