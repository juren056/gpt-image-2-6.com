# GPT Image 2.6 上站前设计说明

这份说明给黄总挑选。它描述的是设计稿，不是已经上线的站。

没有改 `src/` 里的生产页面，没有改定价代码，没有接登录，也没有接支付。结账页是外观示意：按钮不能提交，页面上没有卡号输入框。

英文界面文案以本稿 HTML 为准。下面用中文说明结构、SEO、定价和该替换哪些旧文件。

## 品牌

- 产品名：GPT Image 2.6
- 域名：gpt-image-2-6.com
- 做什么：用同一个 prompt 台导出 GIF、SVG 或静态 PNG
- 主语言：英文。本稿首页、定价、登录、结账的界面都是英文
- 不沿用 Nano Banana 的暖黄、橄榄黑，也不沿用香蕉标记和旧登录侧图

视觉是夜色工作台：大面积深蓝夜色，logo 的蓝紫渐变用在标记和收尾横幅上，青色星光只留给主按钮、当前格式和少量强调。首页第一屏就是生成台，不是先放一长段介绍再把工具藏到下面。

标记文件是 `assets/logo.svg`，并导出了 `assets/logo-512.png`。本环境读不到附件里的原始 `gpt-image-2-6-logo-a.jpg` 和 `icon-512.png`，所以标记是按定稿图标重绘的：圆角蓝紫底、白描边画框、右上角青色四角星。上线时请换回原始图标文件，不要继续用 `public/logo.png` 里的香蕉。

## 首页在讲什么

打开首页，导航下面就是标题和生成台。左边选 GIF / SVG / PNG，写 prompt，设比例、帧数和循环；右边是预览和一条 8 帧的 GIF 帧带。往下才是三种格式的说明、工作台能力、四步、定价预览、FAQ 和收尾。

预览里的图是为这个主题新画的格式研究，用来说明版式。它们不是模型跑出来的结果，页面上也没有用户数、评分，也没有写 API 已接通。

手机版是同一页的窄屏：导航收成标记、Sign in 和 Start free，生成台改成上下叠放。

## SEO

生产首页建议（设计稿 HTML 自带 `noindex`，上线首页不要加）：

- title：`GPT Image 2.6 GIF Generator | Free GIF, SVG, and PNG Studio`
- description：`Generate a GIF, SVG, or PNG with GPT Image 2.6. Switch formats on one prompt desk, set a frame strip, and start with 3 free credits.`
- H1：`GPT Image 2.6 GIF, SVG, and still generator`

关键词放在 title、description、H1 和首屏眉题里：GPT Image 2.6、GPT Image 2.6 GIF、free GPT Image 2.6 generator、SVG。眉题英文是 `Free GPT Image 2.6 generator`。

首批页面：

| 路径 | 索引 | title |
| --- | --- | --- |
| `/` | index, follow | 见上 |
| `/pricing` | index, follow | `GPT Image 2.6 Pricing \| Credit Packs for GIF, SVG, and PNG` |
| `/gif` | 下一张落地页，本稿未单独画 | `GPT Image 2.6 GIF Generator \| Frame Strip and Loop Export` |
| `/svg` | 下一张落地页，本稿未单独画 | `GPT Image 2.6 SVG Generator \| Vector Export from a Prompt` |
| `/sign-in` | noindex，沿用现有 `(auth)` 路由 | `Sign in \| GPT Image 2.6` |
| `/checkout` | noindex，沿用现有结账路由 | `Checkout \| GPT Image 2.6` |

`/gif` 和 `/svg` 可以复用首页的格式段落，单独做成落地页。本稿把这两个词已经放进首页 H1 和格式区。

## 首页英文文案

导航：Studio、Formats、Pricing、FAQ、Sign in、Start free。

眉题：`Free GPT Image 2.6 generator`

H1：`GPT Image 2.6 GIF, SVG, and still generator`

导语：`Write one prompt. Export a looping GIF, an editable SVG, or a still PNG. The free desk includes 3 credits.`

欢迎卡：`3` / `free credits` / `1 short GIF, or 3 stills`

生成台：

- 格式：GIF、SVG、PNG。截图默认 GIF
- Prompt 标签：Prompt / Sample
- 示例 prompt：`A cyan star crossing a white frame on a violet night, eight-frame loop, no lettering.`
- 控件：`1:1`、`8 frames`、`Loop on`、`Solid`
- 费用：`Draft rate`，GIF 为 `This GIF · 3 credits`，SVG 为 `This SVG · 1 credit`，PNG 为 `This PNG · 1 credit`
- 按钮：`Generate GIF`（切到 SVG / PNG 时改成 Generate SVG / Generate PNG）
- 预览：`Preview`、`Layout sample`
- 帧带：`0.0s`、`Frame 3 / 8`、`1.0s`
- 预览脚注：`Square loop · 8 frames. The file would download from this stage.`

格式区：

- 眉题 Formats
- 标题 `Three exports. One prompt desk.`
- 说明：`GIF for a loop, SVG for vectors, PNG for a still. These pictures are format studies for the layout, not live model output.`
- GIF：`A frame strip sits under the preview. This draft prices a GIF up to 8 frames at 3 credits.`
- SVG：`Export paths you can keep editing. A still SVG is 1 credit at the draft rate.`
- PNG：`One frame for a cover or a poster. A PNG is 1 credit at the draft rate.`

能力区标题：`Built like a workbench`。六张卡是 Format switch、Frame strip、Vector export、Still export、Visible cost、One-time packs。

步骤标题：`From prompt to file`。01 Choose a format，02 Write the prompt，03 Set the frames，04 Generate。

草案单位：`PNG or SVG · 1 credit · GIF up to 8 frames · 3 credits`

定价预览标题：`Credits for the desk`。说明：`Free includes 3 credits. Spark, Studio, and Archive are one-time packs in this design draft.`

FAQ 标题：`Before you generate`。六个问题：What is GPT Image 2.6、Is there a free GPT Image 2.6 generator、Can I switch from GIF to SVG without rewriting、How is a GIF different from a PNG here、Do the packs renew every month、Where does the file go。

收尾：`Generate your first GIF` / `Use the 3 free credits on a loop, or keep them for an SVG or a PNG.` / 按钮 `Start free`。

页脚：Product、Files、Account，以及 `gpt-image-2-6.com`。

## 主题 token

字体是 Inter。标题字重 600，英文略紧字距。价格用等宽数字。正文 16px，行高约 1.55。

| Token | 色值 | 用法 |
| --- | --- | --- |
| Night | `#070814` | 页面底 |
| Panel | `#14182E` | 卡片 |
| Ink | `#0C1022` | 输入框内底 |
| Blue | `#3C5BFF` | 渐变左端 |
| Violet | `#7A45F5` | 渐变右端 |
| Logo gradient | `#3A5BFF → #8A46F0` | 标记和收尾横幅 |
| Cyan | `#3EF0FF` | 星光、主按钮、当前项 |
| Cyan ink | `#062126` | 青色按钮上的字 |
| Text | `#F4F6FF` | 主文字 |
| Muted | `#A7B0D0` | 说明 |
| Line | `rgba(186, 198, 255, 0.16)` | 描边 |
| Paper | `#F6F7FB` | 只用于结账右栏 |
| Paper ink | `#1C2033` | 结账卡片上的字 |

圆角：卡片 22px，生成台 28px，按钮全圆。主按钮是青色渐变，深色字。次按钮是描边。结账区保持浅色纸面，让它看起来像 Stripe 嵌入式结账，而不是再做一块夜色表单。

星光不要当每个列表的图标。列表用小圆点。星光留给标记、当前格式和收尾。

不要用：暖黄主按钮、橄榄黑、香蕉图、旧登录照片、评分、用户数。

## 定价草案

这是设计草案，不是 `src/config/pricing.ts` 里的现价。旧价不要照抄：月付 $7.99 / $18.99 / $44.99，积分包 $2.99 / $10.99 / $25.99。本稿也不画月付订阅，只画一次性积分包。

对标常见阶梯 $9.90 / $30 / $39：入门档对齐 $9.90，中间档降到 $19.90，顶档放在 $39.90。若希望中间档更靠近 $30，可以把 Studio 改成 $29.90，再重算积分。本稿按已定的 $9.90 / $19.90 / $39.90 画。

草案汇率，尚未做服务端校验：

- PNG 或 SVG 静图：1 credit
- GIF，最多 8 帧：3 credits
- 积分有效期建议 365 天，一次性，不自动续费

| 档 | 价格 | 积分 | 短 GIF | 静图 | 付款 |
| --- | --- | --- | --- | --- | --- |
| Free | $0 | 3 | 1 | 3 | 无，登录后使用 |
| Spark | $9.90 | 40 | 最多 13 | 40 | 一次性 |
| Studio | $19.90 | 100 | 最多 33 | 100 | 一次性，本稿建议档 |
| Archive | $39.90 | 240 | 80 | 240 | 一次性 |

40 和 100 积分各余 1 点，所以 GIF 次数写「最多」。240 正好是 80 个短 GIF。

免费档文案固定为 `Free · 3 credits`。3 点正好是一条短 GIF，或三张静图。

以后若写入目录，建议新的 product id，不要复用现在的 `credits_boost` / `credits_flex` / `credits_power` 价格：`credits_spark`（990 分）、`credits_studio`（1990 分）、`credits_archive`（3990 分）。这只是命名建议，本稿没有改目录。

## 登录和支付

登录页仍是现有结构：左侧展示，右侧表单。表单对应 `src/routes/(auth)/sign-in.tsx` 的第一屏：Google，然后邮箱验证码。本稿没有画 GitHub，也没有画密码屏和六位验证码屏。若 GitHub 提供方还开着，实现时可以加回一颗同风格按钮。

左侧三张叠图换成新主题：

- 大图：`assets/gif-study.svg`，对应原来的 poster 位
- 右下：`assets/svg-study.svg`
- 左下：`assets/still-study.svg`

旧图在 `public/images/auth-gallery/`：

- `brand-audio-20261012.webp` 和 `brand-audio-640-20261012.webp`
- `space-studio-20261012.webp`
- `social-streetwear-20261012.webp`

引用在 `src/blocks/auth-marketing-shell.tsx`，叠放样式在 `src/styles/banana-auth.css` 的 `.auth-gallery-art`。实现时换图即可，不必改登录请求。

结账页沿用现在的左右分栏：左边是 Studio 包，$19.90，100 credits，一次性。右边是 Stripe 嵌入式结账的外观。右栏写了 `Stripe embedded checkout · appearance only`。卡号、有效期、CVC、持卡人、国家都是不能输入的占位，Pay 按钮是 disabled。不要把这张图做成真表单。

Spark 和 Archive 以后走同一套结账布局，只换左边的商品摘要。生产代码仍应走现有 `StripeEmbeddedCheckout`，用 Appearance 把主按钮调成青色，不要自己收集卡号。

## 和旧模板的对应

| 现在的文件 | 本稿里变成什么 |
| --- | --- |
| `src/routes/index.tsx` → `src/blocks/banana-home.tsx` | `home.html` 整页 |
| `src/components/banana-home-content.tsx` 的 Hero、Intro | 收成首屏标题，生成台紧跟在下面 |
| `BananaGenerator` | 左边 prompt 台 + 右边预览和帧带 |
| `BananaFeatures`、`BananaSteps` | 能力六卡和四步 |
| `BananaModelComparison` | 取消多模型表，改成 GIF / SVG / PNG |
| `BananaCapabilities`、`BananaUseCases` | 三张格式研究卡。旧照片不回收 |
| `src/blocks/pricing.tsx`、`src/components/pricing-table.tsx` | `pricing.html` 和首页定价预览。只保留积分包一组 |
| `src/config/pricing.ts` | 不改。新价只写在本说明里 |
| `src/routes/(auth)/sign-in.tsx`、`(auth)/route.tsx` | `sign-in.html`。路由继续 noindex |
| `src/blocks/auth-marketing-shell.tsx`、`banana-auth.css` | 登录侧图和夜色表单 |
| `src/blocks/banana-checkout.tsx`、`src/components/stripe-embedded-checkout.tsx`、`banana-checkout.css` | `checkout.html`。左故事、右嵌入式外观 |
| `src/styles/globals.css` 里 `.creative-home` 的暖色 token | 本说明的夜色 token |
| `public/images/auth-gallery/*` | 三张新的 SVG 研究图 |

`DESIGN.md` 里的暖黄、Manrope 方向是旧品牌。本产品按蓝紫星光工作台另起，不改那份旧说明。

## 图示

截图用本机 Chrome 打开静态 HTML 后整页导出，宽度 1440，手机首页 390。不依赖 dev server。

- `artifacts/design-redesign/homepage-desktop.png`
- `artifacts/design-redesign/homepage-mobile.png`
- `artifacts/design-redesign/pricing.png`
- `artifacts/design-redesign/sign-in.png`
- `artifacts/design-redesign/checkout.png`
- `artifacts/design-redesign/theme-board.png`
- `artifacts/design-redesign/design-index.html` 一次看完全部
- `artifacts/design-redesign/home.html` 等为可打开的设计稿
- `artifacts/design-redesign/assets/gif-study.svg`
- `artifacts/design-redesign/assets/svg-study.svg`
- `artifacts/design-redesign/assets/still-study.svg`
- `artifacts/design-redesign/assets/logo.svg`
- `artifacts/design-redesign/assets/logo-512.png`

## 请黄总定的几件事

1. 中间档维持 $19.90，还是改成更接近 $30 的 $29.90。
2. 静图 1 点、8 帧 GIF 3 点，这个草案汇率是否采用。采用的话要另做服务端计价，不能只改界面。
3. 首页是否就用「第一屏即生成台」。若要更像长营销页，可以把标题区加高，把生成台下移。
4. 登录是否保留 GitHub 按钮。
5. 上线前用原始图标替换本稿重绘的 `logo.svg`。
