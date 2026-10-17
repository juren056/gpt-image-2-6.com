import assert from 'node:assert/strict';

import {
  createGenerationPurchaseIntent,
  parseGenerationPurchaseIntent,
  recommendGenerationProduct,
} from '../src/lib/generation-purchase';
import type { GeneratorDraft } from '../src/lib/generator-entry';
import type { CheckoutProduct } from '../src/types/checkout';

const products: CheckoutProduct[] = [
  {
    productId: 'credits_power',
    productName: 'Power',
    priceInCents: 2599,
    currency: 'usd',
    credits: 1500,
    recurring: false,
    paymentMethods: ['card'],
  },
  {
    productId: 'credits_boost',
    productName: 'Mini',
    priceInCents: 299,
    currency: 'usd',
    credits: 100,
    recurring: false,
    paymentMethods: ['card'],
  },
  {
    productId: 'starter_monthly',
    productName: 'Starter',
    priceInCents: 799,
    currency: 'usd',
    credits: 400,
    recurring: true,
    paymentMethods: ['card'],
  },
  {
    productId: 'credits_flex',
    productName: 'Flex',
    priceInCents: 1099,
    currency: 'usd',
    credits: 600,
    recurring: false,
    paymentMethods: ['card'],
  },
];

assert.equal(
  recommendGenerationProduct(products, 24)?.productId,
  'credits_boost'
);
assert.equal(
  recommendGenerationProduct(products, 112)?.productId,
  'credits_flex'
);
assert.equal(
  recommendGenerationProduct(products, 700)?.productId,
  'credits_power'
);
assert.equal(recommendGenerationProduct(products, 1600), undefined);

const draft: GeneratorDraft = {
  prompt: 'A yellow bottle on limestone',
  model: 'nano-banana-2.1',
  operation: 'generate',
  aspectRatio: '1:1',
  resolution: '1K',
  outputCount: 1,
  imageUrls: [],
};
const intent = createGenerationPurchaseIntent(draft, 8, 10_000);
assert.deepEqual(parseGenerationPurchaseIntent(intent, 20_000), intent);
assert.equal(parseGenerationPurchaseIntent(intent, 2_000_000), null);
assert.equal(
  parseGenerationPurchaseIntent({ ...intent, credits: -1 }, 20_000),
  null
);

console.log('Generation purchase recommendation and resume intent verified.');
