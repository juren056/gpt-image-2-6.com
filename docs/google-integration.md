# Google Search Console 与 GA4

配置日期：2026-10-10。Google 和 Cloudflare 控制台配置均通过 CUA 完成。

## Search Console

- 域名资源：`sc-domain:nanobanana21pro.com`，DNS TXT 所有权验证已通过。
- Cloudflare 根域名的 Google 验证 TXT 记录须保留。
- 站点地图：`https://nanobanana21pro.com/sitemap.xml`，提交成功，后续重新提交一次。
- 首页实际网址测试通过，显示“网址可编入 Google 索引”；首页收录请求已提交。
- 站点地图实际网址测试通过，Google 抓取源代码显示完整 XML urlset。
- 当前站点地图报告仍显示“无法抓取”，尚未确认后台解析成功；提交成功不代表已完成抓取或索引。

入口：https://search.google.com/search-console?resource_id=sc-domain%3Ananobanana21pro.com

## GA4

- 媒体资源：`nanobanana21pro.com`，资源 ID `558313491`。
- 网站数据流：`Nano Banana Web`，数据流 ID `16097672578`。
- 衡量 ID：`G-3W5C23WYR3`。
- 报告时区：中国 GMT+8；货币：USD。
- 增强型衡量已开启；电子邮件地址隐去已开启。
- 通过 Cloudflare D1 控制台将 `config.google_analytics_id` 保存为上述 ID。
- 移除根布局中的旧 Qwen GA4 默认 ID，未配置时不再加载模板统计标签。
- 新部署首页 DOM 只包含上述 GA4 loader/init；Google 官方安装测试显示“在您的网站上检测到了 Google 代码”。
- 配置完成时实时报告仍为 0，尚未确认 Google 后台出现首批事件；安装检测成功与报表收到数据是两个独立状态。

入口：https://analytics.google.com/analytics/web/#/a389162355p558313491/

## 发布与验证

- Cloudflare Worker 版本：`9511b5c6-c27c-4278-9914-a9240125f684`。
- `pnpm cf:build` 成功；安全扫描 95 个变更文件，无发现。
- 未创建 GSC 与 GA4 的跨产品数据共享关联。
- 控制台截图保存在本地 `.artifacts/google-integration/`。
