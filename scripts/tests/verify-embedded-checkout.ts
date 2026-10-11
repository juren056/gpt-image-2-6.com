import assert from 'node:assert/strict';

import { StripeProvider } from '../../src/core/payment/stripe';
import {
  PaymentInterval,
  PaymentType,
  type PaymentOrder,
} from '../../src/core/payment/types';

const requests: Record<string, unknown>[] = [];
const provider = new StripeProvider({
  secretKey: 'test-fixture',
  publishableKey: 'public-fixture',
  allowPromotionCodes: true,
});
// Simulate the provider boundary: embedded sessions intentionally have no URL.
Object.defineProperty(provider, 'client', {
  value: {
    customers: { list: async () => ({ data: [{ id: 'customer_fixture' }] }) },
    checkout: {
      sessions: {
        create: async (params: Record<string, unknown>) => {
          requests.push(params);
          return {
            id: 'session_fixture',
            url: params.ui_mode ? null : 'https://checkout.stripe.com/fixture',
            client_secret: params.ui_mode ? 'fixture-client-secret' : null,
          };
        },
      },
    },
  },
});

const order: PaymentOrder = {
  type: PaymentType.ONE_TIME,
  price: { amount: 899, currency: 'usd' },
  description: 'Fixture credits',
  customer: { email: 'buyer@example.com' },
  metadata: { order_no: 'fixture-order', user_id: 'fixture-user' },
  successUrl: 'https://example.com/api/payment/callback?order_no=fixture-order',
  cancelUrl: 'https://example.com/checkout',
};
const hosted = await provider.createPayment({ order });
assert.equal(
  hosted.checkoutInfo.checkoutUrl,
  'https://checkout.stripe.com/fixture'
);
assert.equal(hosted.checkoutInfo.clientSecret, undefined);
assert.equal(requests[0].success_url, order.successUrl);
assert.equal(requests[0].cancel_url, order.cancelUrl);
assert.equal(requests[0].return_url, undefined);

const embedded = await provider.createPayment({
  order: {
    ...order,
    checkoutUi: 'embedded',
    paymentMethodTypes: ['card', 'alipay'],
  },
});
assert.equal(embedded.checkoutInfo.checkoutUrl, '');
assert.equal(embedded.checkoutInfo.clientSecret, 'fixture-client-secret');
assert.equal(requests[1].ui_mode, 'embedded');
assert.equal(requests[1].return_url, order.successUrl);
assert.equal(requests[1].redirect_on_completion, 'always');
assert.equal(requests[1].success_url, undefined);
assert.equal(requests[1].cancel_url, undefined);
assert.deepEqual(requests[1].payment_method_types, ['card', 'alipay']);
assert.deepEqual(requests[1].metadata, order.metadata);
assert.equal(requests[1].allow_promotion_codes, true);

await provider.createPayment({
  order: {
    ...order,
    checkoutUi: 'embedded',
    type: PaymentType.SUBSCRIPTION,
    paymentMethodTypes: ['card'],
    plan: { name: 'Starter', interval: PaymentInterval.MONTH },
  },
});
assert.equal(requests[2].mode, 'subscription');
assert.deepEqual(requests[2].subscription_data, { metadata: order.metadata });
assert.equal(
  (
    requests[2].line_items as {
      price_data: { recurring: { interval: string }; unit_amount: number };
    }[]
  )[0].price_data.recurring.interval,
  'month'
);
assert.equal(
  (requests[2].line_items as { price_data: { unit_amount: number } }[])[0]
    .price_data.unit_amount,
  899
);
provider.configs.publishableKey = '';
await assert.rejects(
  () => provider.createPayment({ order: { ...order, checkoutUi: 'embedded' } }),
  /not configured/
);
assert.equal(requests.length, 3);
console.log(
  'Hosted/embedded checkout, callback, subscription metadata and provider validation passed.'
);
