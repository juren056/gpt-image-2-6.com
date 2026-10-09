import assert from 'node:assert/strict';

import {
  DEFAULT_IMAGE_MODEL_ID,
  findImageModel,
  IMAGE_GENERATION_COST,
  IMAGE_MODEL_IDS,
  QWEN_IMAGE_3_EDIT_MODEL_ID,
  QWEN_IMAGE_EDIT_MODEL_ID,
  requireEnabledImageModel,
  sanitizeImageEditOptions,
  sanitizeImageGenerationOptions,
  SIMPLE_TOOL_IMAGE_MODEL_ID,
} from '../src/config/image-models';

assert.equal(DEFAULT_IMAGE_MODEL_ID, IMAGE_MODEL_IDS.qwen3);
assert.equal(SIMPLE_TOOL_IMAGE_MODEL_ID, IMAGE_MODEL_IDS.qwen2Standard);
assert.equal(QWEN_IMAGE_EDIT_MODEL_ID, 'fal-ai/qwen-image-edit-2511');
assert.equal(QWEN_IMAGE_3_EDIT_MODEL_ID, 'alibaba/qwen-image-3/edit');
assert.equal(
  requireEnabledImageModel(IMAGE_MODEL_IDS.qwen3).credits,
  IMAGE_GENERATION_COST
);
assert.deepEqual(
  sanitizeImageEditOptions(['https://example.com/product.png'], {
    image_size: 'portrait_4_3',
    num_images: 4,
    enable_safety_checker: false,
  }),
  {
    image_size: 'portrait_4_3',
    enable_prompt_expansion: false,
    enable_safety_checker: true,
    num_images: 4,
    output_format: 'png',
    image_urls: ['https://example.com/product.png'],
  }
);

const qwen2 = findImageModel(IMAGE_MODEL_IDS.qwen2Standard);
assert.ok(qwen2);
assert.equal(qwen2.enabled, false);
assert.equal(qwen2.availability, 'disabled');
assert.throws(
  () => requireEnabledImageModel(IMAGE_MODEL_IDS.qwen2Standard),
  /disabled/
);
assert.throws(
  () => requireEnabledImageModel(IMAGE_MODEL_IDS.qwen2Pro),
  /disabled/
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
    enable_prompt_expansion: false,
    enable_safety_checker: true,
    num_images: 1,
    output_format: 'png',
  }
);
assert.deepEqual(
  sanitizeImageGenerationOptions({ image_size: 'unsupported-size' }),
  {
    image_size: 'square_hd',
    enable_prompt_expansion: false,
    enable_safety_checker: true,
    num_images: 1,
    output_format: 'png',
  }
);
assert.deepEqual(
  sanitizeImageGenerationOptions({ image_size: 'square_hd', seed: 42 }),
  {
    image_size: 'square_hd',
    enable_prompt_expansion: false,
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
  sanitizeImageGenerationOptions({ enable_prompt_expansion: true })
    .enable_prompt_expansion,
  true
);

console.log('Image model catalog verification passed.');
