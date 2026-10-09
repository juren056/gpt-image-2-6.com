# 网站待命配置

站点：https://nanobanana21pro.com

## 当前配置

- 邮箱＋密码注册/登录开启；不要求邮箱验证，注册后自动登录。
- 创作工作台开启。现有 7 个 production-enabled、商业用途已允许的模型均由 fal 提供；已加入显式允许名单。去背景、放大、矢量化三个 fal 工具也已加入名单。默认 FLUX.2 [pro] 生成和编辑继续使用 fal。
- 现有模型目录中未通过 production/commercial 状态检查的模型继续保留待上线状态，不伪装为可调用。
- Stripe 支付开关开启，默认渠道为 Stripe；保留现有价格、积分包和订阅规则。
- 只有填入 Stripe Secret Key 和 Webhook Signing Secret 后，结账才进入真实支付流程。凭据未齐时显示结账暂不可用，并在创建订单前返回 503。不会创建假订单或扣款。
- 配置与公开开关采用一分钟级缓存；后台保存后刷新页面即可获取更新，无需重新构建。不同 Worker 实例/CDN 更新可能有短暂延迟。

## 后续接入

使用管理员账号进入 `/admin/settings`。管理员邮箱需要站点所有者指定，不能自动将普通注册用户提升为管理员。

1. AI → Fal：填写 `fal_api_key`，保存。现有模型/工具通过其原有 fal 端点请求，未更换提供商。有效密钥及账户余额仍是实际生成的必要条件；本次未执行付费生成。
2. Payment → Stripe：填写 `stripe_secret_key`、`stripe_signing_secret`，可同时填写 `stripe_publishable_key`。保持 `stripe_enabled=true`、`default_payment_provider=stripe`。测试和正式环境的密钥与回调密钥应匹配。
3. Stripe 回调地址：`https://nanobanana21pro.com/api/payment/notify/stripe`。原有签名校验、支付成功积分发放、订阅续费/退款处理继续使用现有代码。
4. fal 回调地址由服务器自动生成：`/api/images/fal-webhook`，包含任务签名参数；无需手工填写固定任务令牌。
5. 本地文件上传和长期保存如需 R2，配置 Storage → R2 的 bucket、access key、secret key、endpoint/domain。fal 返回的托管结果可在未配置自有存储时使用；本地上传的持久化仍需存储配置。

目前线上尚无 fal/Stripe 凭据，不能把“开关已开启”理解为已完成真实生成或实收支付。密钥应在后台填写，不放到前端或版本库。

## 已完成验证

- Stripe 订阅/一次性会员套餐离线验证通过。
- fal 图像/视频工具请求和回调签名离线验证通过。
- 未验证邮箱的注册、自动登录、密码登录和会话检查已在隔离本地 D1 通过。
- 未进行真实扣款、支付开户或付费模型调用。
