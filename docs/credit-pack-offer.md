# Homepage plan offer — 2026-10-16

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

The plan dialog opens five seconds after the hydrated homepage is visible.
If the tab is hidden when the delay expires, it waits until the tab becomes
visible. Dismissing the dialog closes it for the current homepage visit. Reloading,
reopening the site or returning to the homepage starts a fresh five-second timer.

The dialog now has two keyboard-accessible groups. One-time credit packs remain
the default, with Mini, Flex and Power. Card subscriptions offer Starter, Creator
and Pro. Selecting a product updates the name, description, price, credits,
request estimate, billing disclosure and checkout action. Mini and Starter are
the defaults for their groups; Flex and Creator are marked popular, while Power
and Pro are marked best value.

Desktop uses three compact choices across a 672px dialog. Mobile stacks the
choices and keeps the dialog within the viewport with internal scrolling. Arrow
keys move between groups and products, and focus, Enter, Escape and reduced-motion
behavior remain supported. A link opens the complete pricing page, where Alipay
prepaid memberships remain available without adding that overlapping payment
variant to the popup.

All six products come from the server-authoritative `pricingCatalog`; the popup
does not duplicate prices, credits or product IDs. Its CTA records the existing
privacy-filtered credit-pack or subscription event and opens the selected product
at `/checkout?product=<product>&redirect=/settings/billing`. Signed-out visitors
continue through the established sign-in return flow.

## Validation

- TypeScript, Prettier, all 18 locale catalogs and analytics privacy checks passed.
- Prepaid-membership regression and direct server-catalog assertions passed.
- A full isolated production build passed.
- Headless Chromium measured the popup after the five-second timer, confirmed it
  appears again after re-entering the homepage, selected both groups with mouse
  and arrow keys, and reached the correct checkout URL for all six products.
- Desktop 1440×1000 and mobile 390×844 screenshots were reviewed. The dialog fits
  both viewports, presents all options without clipping, preserves focus-managed
  dismissal, and produced no console errors or failed responses.
- The stale localized Mini Pack feature copy was corrected from 200 to the actual
  server-authoritative 100 credits in all 18 locale catalogs.
- No Stripe payment was submitted. Checkout rendering verifies the selected
  product and amount; payment completion and webhook credit granting remain the
  existing production flow.

Evidence is stored under `.artifacts/plan-offer/`.
