# 账户平台与免费静态部署验收

部署日期：2026-10-11（北京时间）。

- 正式站点：https://nanobanana21pro.com/
- 账户积分：https://nanobanana21pro.com/settings/credits
- Cloudflare 恢复版本：`18ec1e7e-f232-4640-95e8-454a6fc37fbe`（与已验收的 `fb47e527` 使用同一构建产物）。
- Worker：`nanobanana21pro-com`；D1：`nanobanana21pro-db`。

## 完成的产品路径

重建账户侧栏、身份菜单、Profile / Credits / Billing / Referral、升级弹窗、每日签到。
接入真实积分及流水、订阅订单、邀请奖励和账户资料。
资产库支持收藏、集合、分类、可恢复回收站、下载和参考续作；保留原生成及扣费记录。
补充生成历史、提示词库、Skills、Tools 和创作入口；使用提示词或资产只准备任务，不自动生成或扣费。

修复了免费账户被误识别为订阅账户、侧栏底部被挤出屏幕，以及提示词库跳转后正文未带入的问题。

## 部署与验收证据

- Cloudflare 生产构建通过；1530 个公开页面生成静态 HTML。
- 1530 页语言标记与单 H1 检查通过，未发现当前账户身份出现在公开 HTML。
- sitemap 中 124 页线上检查通过：HTTP 200，无缺失或重复标题、描述，无错误 H1、canonical 或孤立页面。
- 首页与 `/prompts` 的线上响应和生成文件逐字相同，响应 `cf-cache-status: HIT`。
- robots / sitemap / 公共配置可访问；未登录访问资产接口返回 401。
- 类型检查、安全扫描及 nullable subscription API 回归测试通过。
- 资产库账户隔离与回收站测试、创作工作流测试、登录导航测试已通过。
- Chrome 验证免费账单、账户菜单、资料、邀请、资产库读取及科学提示词带入。
- 390 / 768 / 1440px 的账户页无横向溢出；手机侧栏账户按钮位于可见区域。
- 深浅主题验证完成，恢复用户原有深色主题；首页登录状态在 hydration 后恢复，生成模式可切换。

日志、SEO JSON 和截图：`.artifacts/account/`（不提交）。
静态构建维护说明：`docs/free-cloudflare-static-pages.md`。

## 待接入项

支付入口与服务保留，当前 checkout 未配置；没有创建收费订单。
fal 仍为原有模型服务。Nano Banana 2.1 保持未启用、报价待确认状态。
此次验收没有调用收费生成、领取真实签到积分或修改账户资料。
Lighthouse / 实际用户 Core Web Vitals 尚未测量，不宣称相关评分。

曾误绑定 `calculusmate.com` 仓库的 Cloudflare Git 关联已解除，后台 Builds 显示 Connect；该仓库后续推送不再触发本 Worker 的自动部署。
当前版本通过本仓库部署脚本发布；如要恢复 Git 自动部署，应先绑定正确仓库。

## 1016 故障恢复

2026-10-11 00:27（北京时间），错误关联的 `juren056/calculusmate.com` main 构建上传版本 `bf6d07a5-a750-4d44-9478-64b5151e0096`，将 Nano Banana Worker 的应用变量、D1 和域名换为 CalculusMate 配置。Cloudflare 部署活动明确标为 Build，提交为 `3861320efdfb5937c64ea40669f5095cdefb3527`。因此 Nano Banana 域名失去正确服务绑定并出现 1016。

使用本仓库已验收的静态构建恢复 Nano Banana 的代码、域名及 D1 绑定；解除错误 Git 关联；仅重发 `calculusmate` 自己的域名 triggers，保留其当前代码和数据库。没有执行数据迁移或更换 secrets。

恢复后 Chrome 两站首页均显示各自内容；HTTP 检查 Nano Banana 首页、prompts、robots、公共配置和 CalculusMate 首页均为 200。Cloudflare 列表显示 `nanobanana21pro-com → nanobanana21pro.com`，`calculusmate → calculusmate.com`，只有后者关联 CalculusMate 仓库。

证据：`.artifacts/account/deploy-recovery.log`、`calculusmate-route-recovery.log`、`cf-projects-separated.png`、`recovered-nanobanana.png`、`recovered-calculusmate.png`。
