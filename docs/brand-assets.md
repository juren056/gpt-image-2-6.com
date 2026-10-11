# Nano Banana 品牌图标与搜索抓取

设计名：Pixel Peel（用户选定的 D 方案）。阶梯像素轮廓、香蕉黄、炭绿边缘与青柠绿果柄组成紧凑香蕉。根据选定概念稿重绘为 16×16 整数网格矢量母版，适配小尺寸；不表示 Google 或模型提供商官方身份。

## 完整文件

| 文件                                             | 用途                                               |
| ------------------------------------------------ | -------------------------------------------------- |
| `public/logo.svg`                                | 网站导航、登录与后台 Logo                          |
| `public/logo.png`                                | 512×512 搜索品牌 Logo，Organization 结构化数据引用 |
| `public/favicon.svg`                             | 矢量浏览器图标                                     |
| `public/favicon.ico`                             | 内含真实 16、32、48、96 像素 PNG 的兼容图标        |
| `public/favicon-{16,32,48,96}x{16,32,48,96}.png` | 各尺寸 PNG 图标，48/96 用于首页 icon 声明          |
| `public/apple-touch-icon.png`                    | 180×180 iOS 主屏图标                               |
| `public/icon-{192,512}.png`                      | Web App 普通图标                                   |
| `public/site.webmanifest`                        | 应用名称、启动地址、颜色与图标清单                 |
| `public/brand/nano-banana-mark.{svg,png}`        | 透明标志                                           |
| `public/brand/nano-banana-icon.svg`              | 图标矢量源文件                                     |
| `public/brand/nano-banana-icon-1024.png`         | 1024×1024 高分辨率导出                             |
| `public/brand/nano-banana-wordmark.svg`          | 水平字标（Inter / Segoe UI / Arial 字体回退）      |
| `public/brand/nano-banana-social.{svg,png}`      | 1200×630 分享封面                                  |

运行 `node scripts/brand-assets.mjs` 可从同一矢量母版重新生成全部文件。颜色：`#191C18`、`#FFD43B`、`#B6DE55`。全部图标透明背景，仅保留香蕉；分享封面也移除香蕉后面的白色方块。favicon 路径保持稳定。旧白底图标已覆盖，旧 maskable 文件及旧概念参考图已删除，品牌包已重新生成。安装图标使用 purpose=any，平台自身可能添加系统底色。

本次改版在图标、品牌 Logo、manifest 和分享封面引用上使用固定版本 `v=pixel-peel-transparent-2`，让浏览器重新请求新图。此版本不随日常部署变化。

## 已配置

- 首页 head 的 favicon / Apple icon / manifest 声明；实际 ICO 分辨率与声明匹配。
- 首页 WebSite 名称与导航品牌一致；Organization 明确声明可公开访问的 512×512 PNG Logo。
- 全站默认 OG / Twitter 分享封面与实际 1200×630 尺寸一致。
- robots.txt 允许首页及图标抓取，指向 sitemap.xml；首页 sitemap lastmod 更新为本次实际修改日期。
- 中文与英文首页继续使用各自 canonical 与 hreflang。

## GSC 后续

1. 在已验证的域名资源中提交 `https://nanobanana21pro.com/sitemap.xml`。
2. 对 `https://nanobanana21pro.com/` 使用网址检查 → 请求编入索引，让 Google 重新抓取 favicon 声明。
3. 图标地址不要求单独提交 sitemap；不要使用移除工具删除旧图标记录。

GSC 域名资源已验证，首页收录请求和 sitemap 提交已完成，见 `docs/google-integration.md`。Google 搜索中的图标更新取决于重新抓取，不保证即时刷新。

官方参考：

- https://developers.google.com/search/docs/appearance/favicon-in-search
- https://developers.google.com/search/docs/appearance/structured-data/organization
