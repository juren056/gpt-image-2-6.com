import assert from 'node:assert/strict';

import {
  DEFAULT_IMAGE_MODEL_ID,
  IMAGE_EDIT_MODEL_ID,
  IMAGE_GENERATION_COST,
  IMAGE_MODEL_IDS,
  requireEnabledImageModel,
  sanitizeImageEditOptions,
  sanitizeImageGenerationOptions,
  SIMPLE_TOOL_IMAGE_MODEL_ID,
} from '../src/config/image-models';

assert.equal(DEFAULT_IMAGE_MODEL_ID, IMAGE_MODEL_IDS.fluxPro);
assert.equal(SIMPLE_TOOL_IMAGE_MODEL_ID, IMAGE_MODEL_IDS.fluxPro);
assert.equal(IMAGE_EDIT_MODEL_ID, 'fal-ai/flux-2-pro/edit');
assert.equal(
  requireEnabledImageModel(IMAGE_MODEL_IDS.fluxPro).credits,
  IMAGE_GENERATION_COST
);
assert.deepEqual(
  sanitizeImageEditOptions(['https://example.com/product.png'], {
    image_size: 'portrait_4_3',
    num_images: 1,
    enable_safety_checker: false,
  }),
  {
    image_size: 'portrait_4_3',
    enable_safety_checker: true,
    num_images: 1,
    output_format: 'png',
    image_urls: ['https://example.com/product.png'],
  }
);

assert.throws(() => requireEnabledImageModel('untrusted/model'), /Unsupported/);

assert.deepEqual(
  sanitizeImageGenerationOptions({
    image_size: 'landscape_4_3',
    num_images: 99,
    enable_safety_checker: false,
    image_url: 'https://example.com/private.png',
  }),
  {
    image_size: 'landscape_4_3',
    enable_safety_checker: true,
    num_images: 1,
    output_format: 'png',
  }
);
assert.deepEqual(
  sanitizeImageGenerationOptions({ image_size: 'unsupported-size' }),
  {
    image_size: 'square_hd',
    enable_safety_checker: true,
    num_images: 1,
    output_format: 'png',
  }
);
assert.deepEqual(
  sanitizeImageGenerationOptions({ image_size: 'square_hd', seed: 42 }),
  {
    image_size: 'square_hd',
    enable_safety_checker: true,
    num_images: 1,
    output_format: 'png',
    seed: 42,
  }
);
assert.equal(
  'seed' in sanitizeImageGenerationOptions({ seed: 2_147_483_648 }),
  false
);
assert.equal(
  'enable_prompt_expansion' in
    sanitizeImageGenerationOptions({ enable_prompt_expansion: true }),
  false
);

console.log('Image model catalog verification passed.');
