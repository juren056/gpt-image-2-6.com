import assert from 'node:assert/strict';

import {
  buildGa4PurchaseEvent,
  normalizeFunnelEvent,
} from '../src/lib/analytics-events';

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
