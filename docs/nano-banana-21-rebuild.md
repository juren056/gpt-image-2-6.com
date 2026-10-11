# Nano Banana 2.1 专题重建

本文记录第一轮专题重建。后续长尾清单扩充、CUA 交互验收和最新部署版本见 [长尾词清单执行记录](nano-banana-longtail-rebuild.md)。

核对日期：2026-10-10。页面结构依据用户提供的 `nanobanana21pro.com 建站页面规划.csv`，保留选定的 D 像素香蕉图标、Cloudflare/D1、登录、fal 和支付基础。

## 页面分工

| URL                            | 独立搜索意图与内容                                                   |
| ------------------------------ | -------------------------------------------------------------------- |
| `/`                            | Nano Banana 2.1 主词；版本说明、创作工作台、选模型、成本、流程与问答 |
| `/prompts`                     | 2.1 提示词；六类原创范例、完整文本、使用范例、编辑保留规则           |
| `/posts/nano-banana-21-vs-pro` | 2.1 vs Pro；同输入比较方法、检查标准、费用与可用状态                 |
| `/pricing`                     | 2.1 pricing/cost；区分供应商价格与网站积分，保留实际结账流程         |
| `/api`                         | 2.1 API；fal 接口、服务端密钥、队列、重复提交与输出处理              |
| `/free`                        | 2.1 free；真实免费准备功能、账户与模型资格、积分限制                 |
| `/scientific-figures`          | 2.1 科研示意图；概念图与真实数据分工、结构提示词、专业审核           |
| `/editor`                      | 2.1 editor；参考图预览、改变/保留清单、任务状态与版本记录            |
| `/guide`                       | how to use；四步教程、成本检查、审核与导出                           |
| `/nano-banana-pro`             | Pro 兄弟词；独立工作台、参考图与 2.1 对比入口                        |
| `/guide/nano-banana-2-to-2-1`  | 2 → 2.1 迁移；接口盘点、验收集、逐步开放和回退条件                   |

新增专题正文完整提供英文和中文。沿用站点仅将 EN/ZH 纳入搜索的策略，不将没有完整专题翻译的语言变体加入 sitemap。保留现有专门工具和文章 URL，避免重建时删除已有入口。

## 事实核验与采用范围

- [Google 模型文档](https://ai.google.dev/gemini-api/docs/models/gemini-nano-banana-2.1)已列出 `gemini-nano-banana-2.1`。官网信息优先于对标站的旧版 FAQ。
- [Google 停用表](https://ai.google.dev/gemini-api/docs/deprecations)没有宣布 `gemini-3.1-flash-image` 在 2026-10-29 关停。因此迁移页不使用该倒计时。
- fal 的[生成接口](https://fal.ai/models/google/nano-banana-2.1/api)为 `google/nano-banana-2.1`，[编辑接口](https://fal.ai/models/google/nano-banana-2.1/edit/api)为 `google/nano-banana-2.1/edit`。
- 对标站 [nanobanana.org](https://nanobanana.org/)用于参考“模型页、提示词、价格、工具”的意图分工。正文、范例与界面是本站新写的内容。
- 用户材料中的 KD、引用域门槛、估算流量、收入案例和私有社群原话没有得到独立数据验证，不作为网站事实、用户评价或排名保证发布。

## 工作台与商业状态

新工作台支持模型选择、生成/编辑模式、画幅、六类提示词、复制、JSON 创作说明下载、本地参考图预览。连接后沿用受保护的 `/api/studio/run`、图片任务状态、服务器报价与积分体系。

2.1 已加入模型和接口注册表，但 `productionEnabled=false`、`credits={}`。必须完成 fal 密钥、存储配置与有预算的真实接口验收，然后明确设置积分报价和生产启用清单，才能向用户计费；准备提示词不会调用模型，也不会使用积分。页面不声称示意图来自 2.1。

账号密码登录与无需邮箱验证的配置保留。支付基础和现有套餐保留；仍需商户密钥、产品价格映射与 webhook 配置。网站订阅不能替代用户直接调用 fal 所需的供应商账户。

## 搜索与分析

每页独立 title、description、单一 H1、canonical、EN/ZH 双向 hreflang、可见 FAQ 与一致结构化数据。专题进入 sitemap，只有 `/api` 公共说明页可抓取，真实 `/api/*` 接口仍被 robots 排除。GSC 域名验证与 GA4 `G-3W5C23WYR3` 保留。

TDK 的改动属于本次用户明确要求的主词重建。后续应以 GSC 页面/查询数据为基准做小步调整，不在纯 UI 发布中连带修改标题、描述和 H1。外链发布、账号创建与向第三方投稿不在本次重建范围内；未执行。

正文更新：修改 `messages/en.json` / `messages/zh.json` 中的 `nano_site.*`。新增键后运行 `node scripts/generate-nano-site-messages.mjs`，生成静态 Paraglide 访问，避免动态访问整个消息对象。

验证记录位于 gitignored 的 `.artifacts/nano-site-*.log` 和页面检查 JSON。浏览器检查在本轮因工具不能可靠识别当前网址而被中止，响应式视觉和浏览器交互不能记为已实测。

## 上线审查

| 维度     | 检查范围与结果                                                                                                      | 仍需关注                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 响应式   | 新页面使用流动宽度、分段网格、移动导航和可横向滚动的代码块；操作按钮保持至少 40px                                   | 390 / 768 / 1440px 浏览器视觉检查未完成                                |
| 明暗主题 | 新页面使用语义颜色；香蕉黄色动作、深色按钮文字、键盘焦点可见                                                        | 明暗主题截图未完成                                                     |
| SEO      | 线上 22 个 EN/ZH 页面通过独立标题、H1、canonical、hreflang、可见 FAQ、sitemap 和 robots 检查；54 个导航链接返回成功 | Google 实际抓取、收录与排名要以 GSC 后续数据为准                       |
| 性能     | 正文 SSR，首页 WebP 显式尺寸，站点配置和分析脚本在 hydration 后加载                                                 | 未运行 Lighthouse；现有全站消息共享包 gzip 约 1.15MB，仍有后续优化空间 |
| 安全     | 工作区扫描无发现；继续使用服务器身份、模型生产开关、积分报价和任务归属检查                                          | 本次未执行真实付费模型任务或支付交易                                   |

## 发布结果

已部署到 https://nanobanana21pro.com 。Cloudflare Worker 版本为 `b7cae202-9eaf-4852-8b21-73416977b0d2`，部署服务的启动校验通过。

`pnpm cf:build`、`pnpm typecheck`、`pnpm test:creative-studio`、`pnpm test:public-pages` 和工作区安全扫描通过。生产 HTTP 检查通过 22 个专题页面、54 个内部导航链接和 2.1 未启用计费的状态。公开配置确认 GA4 `G-3W5C23WYR3`、密码登录已启用、邮箱验证关闭、支付等待凭据；域名 GSC 验证 TXT 仍在。

最终本地 Workers 预览两次启动失败，错误来自 Windows Workers 原生运行时，未计为本地运行检查通过。部署后的 Cloudflare 启动与实际域名页面检查通过。浏览器视觉和交互检查仍受本轮工具中止的限制，没有宣称完成 Lighthouse 或浏览器端端到端验收。
