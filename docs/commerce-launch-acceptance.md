# Commerce launch acceptance — 2026-10-11

Deployment: `c95f43f2-4111-4f6e-8ad0-6d4a4982d50e`, Worker `nanobanana21pro-com`, domain `nanobanana21pro.com`, D1 `nanobanana21pro-db`. The approved yellow/black homepage composition is retained. Public pages are static assets on the free Workers deployment.

- Cloudflare production build and TypeScript validation passed.
- 1,530 rendered public pages passed the targeted unavailable/preview wording scan. Unverified Nano Banana 2.5 is excluded from public choices and its old paths redirect to the homepage.
- Nano Banana 2.1 generates one 1K image per request, using 8 credits. The server fixes image count and resolution.
- A real owner-account browser request completed: task `f6641231-c61f-4c81-95ac-40b23a58f184`, model `google/nano-banana-2.1`, 1024×1024 image loaded, asset status Completed, credit usage 8, balance 8 → 0. Exactly 8 acceptance credits were granted through the template admin credit workflow for this test.
- New two-column checkout uses server-authoritative product prices and entitlements. The live Flex flow opened Stripe Checkout for USD 11.99 / 600 credits / 365 days. Card and Alipay were displayed. No payment was submitted; paid webhook settlement is therefore not claimed as tested.
- Nine anonymous admin requests were rejected; unsigned Fal callbacks were rejected; public config contained no credential fields. Prototype property product IDs are rejected.
- Checkout is noindex and absent from sitemap. Root, pricing, checkout, product catalog, model catalog, sitemap and robots returned HTTP 200 after deployment.

Evidence: `.artifacts/account/checkout-live-branded.png`, `.artifacts/account/stripe-live-checkout.png`, `.artifacts/account/generation-live-2-1.png`, `.artifacts/account/commerce-static-audit.json`, `.artifacts/account/admin-boundaries-report.json`.

Limits: this acceptance run exercised text-to-image and checkout creation, not every model/edit operation or a charged payment. Annual products remain excluded until their credit lifecycle is supported. Stripe's hosted page currently uses the merchant display name “Marcus”, configured in the Stripe account.
