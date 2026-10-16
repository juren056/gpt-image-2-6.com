# Homepage subscription plan display

Recorded on 2026-10-16 after the owner explicitly requested that subscription
plans also appear on the homepage.

## Implemented behavior

The homepage pricing section now renders two complete groups in sequence:

1. One-time credit packs remain first as the primary offer.
2. Card-based monthly subscriptions appear immediately below, with Starter,
   Creator and Pro cards visible without switching a pricing tab.

The standalone pricing page keeps its existing group tabs and continues to
include Alipay prepaid memberships. Checkout product IDs, prices, credit amounts,
payment behavior and the five-second credit-pack popup are unchanged.

## Review evidence

The production build was reviewed locally at 1440px and 390px. Both viewports
showed the one-time and auto-renew group headings, all six expected prices, no
page-level horizontal overflow, no failed responses and no console errors.

Evidence is stored under `.artifacts/home-subscriptions/`:

- `desktop-pricing.png`
- `mobile-pricing.png`
- `local-results.json`
- `build.log`
