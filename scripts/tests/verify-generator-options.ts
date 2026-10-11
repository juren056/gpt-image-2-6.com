import assert from 'node:assert/strict';

import { validateCreativeRequest } from '../../src/config/creative-studio';
import { parseActiveCreativeTask } from '../../src/lib/banana-task-resume';
import { buildCreativeImageOptions } from '../../src/lib/creative-image-options';

const input = {
  model: 'nano-banana-2.1',
  operation: 'generate',
  prompt: 'A banana photographed in soft window light.',
};
for (const [resolution, unit] of [
  ['1K', 8],
  ['2K', 12],
  ['4K', 28],
] as const) {
  for (const outputCount of [1, 2, 3, 4]) {
    for (const operation of ['generate', 'edit']) {
      const request = validateCreativeRequest({
        ...input,
        operation,
        resolution,
        outputCount,
        size: '9:16',
        imageUrls:
          operation === 'edit'
            ? ['https://cdn.example.com/reference.webp']
            : [],
      });
      assert.equal(request.credits, unit * outputCount);
      const payload = buildCreativeImageOptions(request);
      assert.equal(payload.resolution, resolution);
      assert.equal(payload.aspect_ratio, '9:16');
      assert.equal(payload.num_images, outputCount);
      assert.equal(payload.safety_tolerance, '4');
      assert.equal(payload.limit_generations, true);
    }
  }
}
assert.equal(validateCreativeRequest(input).resolution, '1K');
assert.equal(validateCreativeRequest(input).credits, 8);
for (const resolution of ['8K', '2k', '', 2, null, {}, ['4K']]) {
  assert.throws(
    () => validateCreativeRequest({ ...input, resolution }),
    /resolution/i
  );
}
assert.throws(
  () =>
    validateCreativeRequest({
      ...input,
      model: 'nano-banana-2-lite',
      resolution: '4K',
    }),
  /default output resolution/
);
assert.equal(
  buildCreativeImageOptions(
    validateCreativeRequest({ ...input, model: 'nano-banana-2-lite' })
  ).resolution,
  undefined
);
for (const size of validateCreativeRequest(input).model.sizes) {
  assert.equal(
    buildCreativeImageOptions(validateCreativeRequest({ ...input, size }))
      .aspect_ratio,
    size
  );
}
for (const resolution of ['1K', '2K', '4K']) {
  assert.equal(
    parseActiveCreativeTask(
      JSON.stringify({
        id: 'pending-task',
        model: input.model,
        mode: 'generate',
        resolution,
      })
    )?.resolution,
    resolution
  );
}
assert.equal(
  parseActiveCreativeTask(
    JSON.stringify({
      id: 'pending-task',
      model: input.model,
      mode: 'generate',
      resolution: 'invalid',
    })
  )?.resolution,
  '1K'
);
console.log(
  'Generator resolution validation, per-resolution batch billing, provider payload, ratios, safety settings and task resume passed.'
);
