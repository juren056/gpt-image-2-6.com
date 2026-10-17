import assert from 'node:assert/strict';

import {
  buildGa4PurchaseEvent,
  normalizeFunnelEvent,
} from '../src/lib/analytics-events';
import {
  initializeGoogleAnalytics,
  type AnalyticsWindow,
} from '../src/lib/google-analytics';

const normalized = normalizeFunnelEvent('pricing_viewed', {
  source: 'header',
  prompt: 'private prompt',
  imageUrl: 'https://private.example/image.png',
  email: 'person@example.test',
  ip_address: '203.0.113.1',
  transaction_id: 'ORD-PRIVATE',
});

assert.equal(normalized.event, 'pricing_view');
assert.deepEqual(normalized.params, { source: 'header' });

const offerSelection = normalizeFunnelEvent('offer_product_selected', {
  source: 'homepage_plan_offer',
  group: 'monthly',
  product: 'creator_monthly',
  email: 'private@example.test',
});
assert.deepEqual(offerSelection, {
  event: 'offer_product_selected',
  params: {
    source: 'homepage_plan_offer',
    group: 'monthly',
    product: 'creator_monthly',
  },
});

const generationPaywall = normalizeFunnelEvent('generation_paywall_shown', {
  source: 'generator',
  model: 'nano-banana-2.1',
  credits: 28,
  shortfall: 8,
  prompt: 'private prompt',
});
assert.deepEqual(generationPaywall, {
  event: 'generation_paywall_shown',
  params: {
    source: 'generator',
    model: 'nano-banana-2.1',
    credits: 28,
    shortfall: 8,
  },
});

assert.deepEqual(
  buildGa4PurchaseEvent({
    transactionId: 'ORD-TEST-001',
    amountMinor: 999,
    currency: 'usd',
  }),
  {
    event: 'purchase',
    params: {
      transaction_id: 'ORD-TEST-001',
      value: 9.99,
      currency: 'USD',
    },
  }
);
assert.equal(
  buildGa4PurchaseEvent({
    transactionId: '',
    amountMinor: 999,
    currency: 'usd',
  }),
  null
);
console.log('Analytics event normalization and privacy verification passed.');

const browser: AnalyticsWindow = {};
assert.equal(initializeGoogleAnalytics(browser, ''), false);
assert.equal(
  initializeGoogleAnalytics(browser, "G-INVALID';alert(1)//"),
  false
);
assert.equal(Object.hasOwn(browser, 'gtag'), false);
assert.equal(initializeGoogleAnalytics(browser, ' G-3W5C23WYR3 '), true);
assert.equal(typeof browser.gtag, 'function');
assert.equal(browser.dataLayer?.length, 2);
assert.deepEqual(Array.from(browser.dataLayer?.[1] as IArguments), [
  'config',
  'G-3W5C23WYR3',
]);
initializeGoogleAnalytics(browser, 'G-3W5C23WYR3');
assert.equal(
  browser.dataLayer?.length,
  2,
  'Remounts must not duplicate initialization'
);
browser.gtag?.('event', 'pricing_view', { source: 'test' });
assert.equal(browser.dataLayer?.length, 3);
console.log('GA4 delayed initialization, validation and deduplication passed.');
