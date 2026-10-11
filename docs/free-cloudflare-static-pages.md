# Cloudflare 免费部署：公开页面静态输出

`pnpm cf:build` 先构建完整 Worker，再执行 `scripts/prerender-public.mjs`。
后者使用同一次构建的 Vite SSR 服务生成公开 HTML；失败时中止构建。

- 路径清单：`src/config/public-prerender-paths.json`，85 个页面 × 18 种语言。
- 输出：`.output/public/index.html`、各路径对应的 `.html`、`sitemap.xml`、`robots.txt`。
- 页面保留正文、标题、canonical、语言标记与客户端交互。
- 清单禁止账户、管理、登录页面和 `/api/*` 接口；`/api` 本身是公开的 API 说明页。
- 构建请求不传账户 cookie；响应若写入 cookie，构建会失败，防止个性化内容进入静态文件。
- Cloudflare 原生静态资源服务优先响应公开页面；没有对应文件的账户及 API 请求继续进入 Worker。
- 公开页面内容改动、新增路径、CMS 发布后的静态内容更新，都需要重新构建和部署。
- 语言 fallback 页沿用原有 noindex / canonical 策略，不因静态化扩大索引清单。

部署命令：`pnpm cf:deploy`。已检查的构建可用
`node scripts/cloudflare.mjs deploy --prebuilt` 上传。
构建与部署日志放在 `.artifacts/account/`，该目录不提交。

免费套餐的后端请求仍受 Workers 运行配额约束。静态化移除了公开页面的逐次 React SSR 开销，
不改变 fal、积分、支付、登录及账户归属校验。
