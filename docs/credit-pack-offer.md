# One-time credit-pack promotion — 2026-10-16

The owner authorized lower prices and asked to make one-time credit packs the
primary offer, with a homepage popup five seconds after entry. The existing
black/yellow homepage composition, photographic examples, generator, model table,
account features and payment provider remain in place.

## Prices

The server-authoritative catalog now charges the following prices for new
checkouts:

| Product   |  Price | Credits | Billing                                   |
| --------- | -----: | ------: | ----------------------------------------- |
| Mini Pack |  $2.99 |     100 | One-time                                  |
| Flex      | $10.99 |     600 | One-time                                  |
| Power     | $25.99 |   1,500 | One-time                                  |
| Starter   |  $7.99 |     400 | Monthly subscription or one-month prepaid |
| Creator   | $18.99 |   1,100 | Monthly subscription or one-month prepaid |
| Pro       | $44.99 |   2,800 | Monthly subscription or one-month prepaid |

Existing recurring Stripe subscriptions keep their existing Stripe agreement;
the new prices apply when a new checkout is created. Credit packs remain valid
for 365 days. Product cards derive prices and credits from the server catalog, and
the credit-pack group is the first pricing tab.

## Homepage offer behavior

The Mini Pack dialog opens five seconds after the hydrated homepage is visible.
If the tab is hidden when the delay expires, it waits until the tab becomes
visible. Dismissing the dialog closes it for the current homepage visit. Reloading,
reopening the site or returning to the homepage starts a fresh five-second timer.

The dialog uses the existing localized pricing messages. Its CTA records the
existing privacy-filtered credit-pack event and opens
`/checkout?product=credits_boost&redirect=/settings/billing`. Signed-out visitors
continue through the established sign-in return flow. The server catalog remains
the authority for Stripe checkout amount and awarded credits.

## Validation

- TypeScript, Prettier, all 18 locale catalogs and analytics privacy checks passed.
- Prepaid-membership regression and direct server-catalog assertions passed.
- A full isolated production build passed.
- Headless Chromium measured the popup after the five-second timer, confirmed it
  appears again after re-entering the homepage, and reached checkout with $2.99
  and 100 credits.
- Desktop 1440×1000 and mobile 390×844 screenshots were reviewed. The dialog fits
  both viewports, preserves focus-managed dismissal, and produced no console
  errors.
- No Stripe payment was submitted. Checkout rendering verifies the selected
  product and amount; payment completion and webhook credit granting remain the
  existing production flow.

Evidence is stored under `.artifacts/credit-offer/`.
