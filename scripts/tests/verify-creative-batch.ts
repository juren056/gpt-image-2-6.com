import assert from 'node:assert/strict';

import {
  getCreativeOutputLimit,
  validateCreativeRequest,
} from '../../src/config/creative-studio';
import { parseActiveCreativeTask } from '../../src/lib/banana-task-resume';

const input = {
  model: 'nano-banana-2.1',
  operation: 'generate',
  prompt: 'A yellow banana on a dark stone pedestal',
};

const defaultRequest = validateCreativeRequest(input);
assert.equal(defaultRequest.outputCount, 1);
assert.equal(defaultRequest.credits, 8);
assert.equal(defaultRequest.size, 'auto');

for (const [model, unitCost] of [
  ['nano-banana-2.1', 8],
  ['nano-banana-2', 6],
  ['nano-banana-pro', 15],
  ['nano-banana-2-lite', 3],
] as const) {
  assert.equal(getCreativeOutputLimit(model), 4);
  for (const outputCount of [1, 2, 3, 4]) {
    const request = validateCreativeRequest({ ...input, model, outputCount });
    assert.equal(request.outputCount, outputCount);
    assert.equal(request.credits, unitCost * outputCount);
    const edit = validateCreativeRequest({
      ...input,
      model,
      operation: 'edit',
      imageUrls: ['https://cdn.example.com/banana.png'],
      outputCount,
    });
    assert.equal(edit.credits, unitCost * outputCount);
    assert.equal(edit.providerModel.endsWith('/edit'), true);
  }
}

for (const outputCount of [
  0,
  -1,
  5,
  1.5,
  NaN,
  Infinity,
  '2',
  '',
  null,
  true,
  {},
  [],
]) {
  assert.throws(
    () => validateCreativeRequest({ ...input, outputCount }),
    /Output count must be an integer/
  );
}

for (const model of [
  'flux-2-pro',
  'seedream-5-pro',
  'gpt-image-2.5-flare',
  'gpt-image-2.5-sunburst',
]) {
  assert.equal(getCreativeOutputLimit(model), 1);
  assert.equal(validateCreativeRequest({ ...input, model }).outputCount, 1);
  assert.throws(
    () => validateCreativeRequest({ ...input, model, outputCount: 2 }),
    /between 1 and 1/
  );
}

assert.throws(
  () =>
    validateCreativeRequest({ ...input, operation: 'edit', outputCount: 4 }),
  /requires a reference image/
);
assert.throws(
  () =>
    validateCreativeRequest({
      ...input,
      operation: 'edit',
      outputCount: 2,
      imageUrls: ['http://cdn.example.com/banana.png'],
    }),
  /HTTPS/
);
assert.throws(
  () =>
    validateCreativeRequest({
      ...input,
      model: 'nano-banana-2-lite',
      operation: 'edit',
      outputCount: 2,
      imageUrls: [
        'https://cdn.example.com/1.png',
        'https://cdn.example.com/2.png',
      ],
    }),
  /at most 1 reference/
);

for (const size of ['auto', '21:9', '5:4', '4:5', '4:1', '1:4', '8:1', '1:8']) {
  assert.equal(validateCreativeRequest({ ...input, size }).size, size);
}

console.log(
  'Creative batch count, server quote and reference validation passed.'
);
for (const outputCount of [1, 2, 3, 4]) {
  const resumed = parseActiveCreativeTask(
    JSON.stringify({
      id: 'task-123',
      model: 'nano-banana-2.1',
      mode: 'generate',
      outputCount,
    })
  );
  assert.equal(resumed?.outputCount, outputCount);
}
for (const outputCount of ['4', 0, 5, -1, 1.5, null]) {
  const resumed = parseActiveCreativeTask(
    JSON.stringify({
      id: 'task-123',
      model: 'nano-banana-2.1',
      mode: 'generate',
      outputCount,
    })
  );
  assert.equal(resumed?.outputCount, 1);
}
assert.equal(
  parseActiveCreativeTask(
    JSON.stringify({
      id: 'task-123',
      model: 'flux-2-pro',
      mode: 'generate',
      outputCount: 4,
    })
  )?.outputCount,
  1
);
