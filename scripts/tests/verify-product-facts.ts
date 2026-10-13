import assert from 'node:assert/strict';

import {
  getCreativeUnitCredits,
  validateCreativeRequest,
} from '../../src/config/creative-studio';
import { pricingCatalog } from '../../src/config/pricing';
import {
  imageRequestEstimates,
  PRIMARY_IMAGE_MODEL,
  productCredits,
  welcomeReward,
} from '../../src/config/product-facts';
import { publicImageTaskSettings } from '../../src/lib/image-task-settings';

for (const [id, plan] of Object.entries(pricingCatalog)) {
  assert.equal(productCredits(id, 0), plan.credits);
  for (const estimate of imageRequestEstimates(plan.credits)) {
    assert.equal(
      estimate.unitCredits,
      getCreativeUnitCredits(
        PRIMARY_IMAGE_MODEL,
        'generate',
        estimate.resolution
      )
    );
    assert(estimate.count * estimate.unitCredits <= plan.credits);
    assert((estimate.count + 1) * estimate.unitCredits > plan.credits);
  }
}
assert.deepEqual(
  imageRequestEstimates(400).map((x) => x.count),
  [50, 33, 14]
);
const references = Array.from(
  { length: 14 },
  (_, i) => `https://example.com/ref-${i}.png`
);
assert.equal(
  validateCreativeRequest({
    model: 'nano-banana-2.1',
    operation: 'edit',
    prompt: 'Preserve reference objects',
    imageUrls: references,
    size: '1:1',
    resolution: '1K',
    outputCount: 1,
  }).imageUrls.length,
  14
);
assert.throws(() =>
  validateCreativeRequest({
    model: 'nano-banana-2.1',
    operation: 'edit',
    prompt: 'Preserve reference objects',
    imageUrls: [...references, 'https://example.com/extra.png'],
    size: '1:1',
    resolution: '1K',
    outputCount: 1,
  })
);
assert.deepEqual(publicImageTaskSettings(null), {});
assert.deepEqual(publicImageTaskSettings({}), {});
assert.deepEqual(
  publicImageTaskSettings({
    aspect_ratio: '16:9',
    resolution: '2K',
    num_images: 2,
    image_urls: ['https://example.com/private.png'],
    authorization: 'private',
    seed: Infinity,
  }),
  { aspect_ratio: '16:9', resolution: '2K', num_images: 2 }
);
assert.deepEqual(
  publicImageTaskSettings({
    image_size: { width: 1024 },
    quality: 'x'.repeat(129),
    num_images: '1',
  }),
  {}
);
console.log(
  'Catalog quote estimates, 14/15-reference boundary and public task-setting privacy checks passed.'
);
assert.deepEqual(
  welcomeReward({
    initial_credits_enabled: 'true',
    initial_credits_amount: '20',
    initial_credits_valid_days: '30',
  }),
  { amount: 20, days: 30 }
);
assert.equal(
  welcomeReward({
    initial_credits_enabled: 'false',
    initial_credits_amount: '20',
  }),
  null
);
assert.equal(
  welcomeReward({
    initial_credits_enabled: 'true',
    initial_credits_amount: '20junk',
  }),
  null
);
assert.equal(
  welcomeReward({
    initial_credits_enabled: 'true',
    initial_credits_amount: '-1',
  }),
  null
);
