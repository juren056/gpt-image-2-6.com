import assert from 'node:assert/strict';

import { getPricingProduct } from '../src/config/pricing';
import { StripeProvider } from '../src/core/payment/stripe';
import { PaymentType } from '../src/core/payment/types';
import {
  addCalendarMonths,
  getSubscriptionRenewalMode,
  isPrepaidSubscriptionId,
  PREPAID_SUBSCRIPTION_PREFIX,
} from '../src/modules/subscriptions/service';

function verifyCatalogParity() {
  for (const tier of ['starter', 'creator', 'pro']) {
    const automatic = getPricingProduct(`${tier}_monthly`);
    const prepaid = getPricingProduct(`${tier}_prepaid_monthly`);

    assert.ok(automatic);
    assert.ok(prepaid);
    assert.equal(automatic.type, PaymentType.SUBSCRIPTION);
    assert.equal(automatic.requiredProvider, 'stripe');
    assert.deepEqual(automatic.paymentMethodTypes, ['card']);
    assert.equal(prepaid.type, PaymentType.ONE_TIME);
    assert.equal(prepaid.priceInCents, automatic.priceInCents);
    assert.equal(prepaid.credits, automatic.credits);
    assert.equal(prepaid.membership?.renewalMode, 'prepaid');
    assert.equal(prepaid.membership?.durationMonths, 1);
    assert.equal(prepaid.requiredProvider, 'stripe');
    assert.deepEqual(prepaid.paymentMethodTypes, ['alipay']);
  }
}

function verifyCalendarMonthBoundaries() {
  assert.equal(
    addCalendarMonths(new Date('2026-01-31T12:00:00.000Z'), 1).toISOString(),
    '2026-02-28T12:00:00.000Z'
  );
  assert.equal(
    addCalendarMonths(new Date('2028-01-31T12:00:00.000Z'), 1).toISOString(),
    '2028-02-29T12:00:00.000Z'
  );
  assert.equal(
    addCalendarMonths(new Date('2026-12-31T12:00:00.000Z'), 1).toISOString(),
    '2027-01-31T12:00:00.000Z'
  );
}

function verifyRenewalModeDetection() {
  const prepaidId = `${PREPAID_SUBSCRIPTION_PREFIX}ORD123`;
  assert.equal(isPrepaidSubscriptionId(prepaidId), true);
  assert.equal(getSubscriptionRenewalMode(prepaidId), 'prepaid');
  assert.equal(isPrepaidSubscriptionId('sub_123'), false);
  assert.equal(getSubscriptionRenewalMode('sub_123'), 'auto');
}

async function verifyStripeCheckoutModes() {
  const provider = new StripeProvider({
    secretKey: 'sk_test_offline_verification',
    publishableKey: 'pk_test_offline_verification',
  });
  const captured: Record<string, any>[] = [];
  (provider as any).client = {
    checkout: {
      sessions: {
        create: async (params: Record<string, any>) => {
          captured.push(params);
          return {
            id: `cs_test_${captured.length}`,
            url: `https://checkout.stripe.test/${captured.length}`,
          };
        },
      },
    },
  };

  const prepaid = getPricingProduct('creator_prepaid_monthly');
  const automatic = getPricingProduct('creator_monthly');
  assert.ok(prepaid?.plan);
  assert.ok(automatic?.plan);

  await provider.createPayment({
    order: {
      type: prepaid.type,
      price: { amount: prepaid.priceInCents, currency: prepaid.currency },
      description: prepaid.description,
      plan: prepaid.plan,
      paymentMethodTypes: prepaid.paymentMethodTypes,
    },
  });
  await provider.createPayment({
    order: {
      type: automatic.type,
      price: {
        amount: automatic.priceInCents,
        currency: automatic.currency,
      },
      description: automatic.description,
      plan: automatic.plan,
      paymentMethodTypes: automatic.paymentMethodTypes,
    },
  });

  assert.equal(captured[0].mode, 'payment');
  assert.deepEqual(captured[0].payment_method_types, ['alipay']);
  assert.equal(captured[0].line_items[0].price_data.recurring, undefined);
  assert.equal(captured[1].mode, 'subscription');
  assert.deepEqual(captured[1].payment_method_types, ['card']);
  assert.equal(
    captured[1].line_items[0].price_data.recurring.interval,
    'month'
  );
}

verifyCatalogParity();
verifyCalendarMonthBoundaries();
verifyRenewalModeDetection();
await verifyStripeCheckoutModes();

console.log('Prepaid membership verification passed.');
