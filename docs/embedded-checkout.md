# On-site Stripe checkout

The owner requested an on-site payment form on 2026-10-11, replacing the previous
confirmation button followed by a Stripe-hosted checkout page. The two-column
Nano Banana checkout shell is retained; its payment side mounts the actual Stripe
Embedded Checkout iframe. The only payment submission button is Stripe's button.

## Flow and preservation boundaries

1. Choose a product from pricing and sign in if needed.
2. The checkout page loads its authoritative product and public readiness data.
3. An authenticated, same-origin POST requests an embedded Stripe session.
4. Stripe collects the payment fields and submits the payment inside its iframe.
5. Cards return to the existing payment callback after completion. Alipay and bank
   authentication can still leave the page for the provider-required verification.

Monthly card subscriptions, one-time Alipay prepaid memberships and credit packs
keep their existing server catalog, amounts, credits and validity. Checkout metadata
still identifies the order, account and product; webhook and callback fulfilment
still use the template's atomic, idempotent credit/subscription processing. A form
mount or client redirect never marks an order paid.

The API defaults to hosted mode for existing callers. The on-site page explicitly
requests embedded mode. Embedded Stripe sessions set `return_url` and omit
`success_url`/`cancel_url`, which Stripe disallows for that mode. Client secrets are
returned only to the authenticated purchaser with `private, no-store`, and are
removed from persisted checkout records and callback payment results. The Stripe
secret key remains server-only; the configured publishable key initializes Stripe.js.

The page does not automatically repeat order creation after focus, reconnect,
remount or errors. Explicit retry is available. React teardown destroys the widget.
Stripe.js is loaded through the official package's pure entry only when the payment
page has a session. The compatible 7.x package line retains `initEmbeddedCheckout`
for the existing server SDK's `ui_mode: embedded` contract.

The homepage/generator protection baseline is unchanged. Release preparation now
also hashes the built Worker entry so checkout-only changes get distinct release
directories rather than overwriting an earlier reviewed release.

## Verification

`scripts/tests/verify-embedded-checkout.ts` covers both hosted and embedded provider
responses, callback parameters, card/Alipay methods, subscription metadata, price
preservation and missing publishable-key validation. Provider responses in that
test are simulated; it does not charge a card or prove webhook delivery.

Production release `601b8124bd6f` is deployed to `nanobanana21pro.com`, Worker
`nanobanana21pro-com`, version `34d7527c-2d5d-4d20-ba6e-cc67c6dbe5a7`.
The Worker/domain/D1 identity assertions passed before upload. No migration was
needed and no other project's deployment configuration was changed.

- `pnpm build`, TypeScript checking, prepaid membership verification and the
  embedded checkout provider tests passed. The worktree security scan reported
  no findings across 73 changed files.
- 1,530 public pages plus sitemap and robots were generated from the final SSR
  service. Both `NITRO_BUILD_DIR` and `NITRO_OUTPUT_DIR` must name the same build
  when using isolated output directories. The homepage guard rejected an initial
  prerender using an older SSR service; that output was regenerated before release.
  The final source and built homepage guards passed without changing the baseline.
- Chrome verified real Stripe embedded sessions for Starter card auto-renewal
  ($8.99 / 400 credits), Starter Alipay prepaid membership ($8.99 / 400 credits),
  and Flex credits ($11.99 / 600 credits / 365 days). Stripe's card inputs, payment
  choices and final payment/subscription buttons appeared inside our checkout URL.
  No intermediate hosted-checkout button remains in the new UI.
- Anonymous session creation was rejected as Unauthorized. Cross-origin requests
  were rejected with HTTP 403. Public pages, seven approved homepage photos, system
  typography and the enabled Fal model passed production HTTP checks.
- Checkout shell screenshots at 390 / 768 / 1440 px had no horizontal overflow.
  A real embedded form was also inspected at a narrow Chrome layout (approximately
  488 CSS px due to the user's browser zoom) and at the normal desktop width.
  The exact 390 px test was signed out and therefore did not contain Stripe fields.
- Checkout uses its existing fixed dark branded shell; Stripe renders its own
  accessible payment surface. The SDK is loaded only on checkout. Public SEO
  metadata and static output remain protected, and checkout remains noindex.
  No Lighthouse/Core Web Vitals performance score is claimed for this release.

Evidence is in `.artifacts/embedded-checkout/`: `production-embedded.png`,
`production-card.png`, `production-alipay.png`, breakpoint screenshots,
`production-check.json`, and build/typecheck/security/deploy logs.

QA only opened three pending checkout sessions. No card details were entered,
no payment method was saved, and no payment/subscription/Alipay continuation was
submitted. Live charging and webhook delivery were not tested; the existing
verified callback and atomic fulfillment implementation was preserved.
