import assert from 'node:assert/strict';

import {
  normalizeCreativeScene,
  parseActiveCreativeTask,
} from '../src/lib/banana-task-resume';

assert.equal(normalizeCreativeScene('someone@example.com'), 'general');
assert.equal(normalizeCreativeScene('science'), 'science');
for (const input of [
  '{',
  'null',
  '[]',
  JSON.stringify({
    id: '../credits',
    model: 'nano-banana-pro',
    mode: 'generate',
  }),
  JSON.stringify({ id: 'task-123', model: 'unknown', mode: 'generate' }),
  JSON.stringify({ id: 'task-123', model: 'nano-banana-pro', mode: 'delete' }),
])
  assert.equal(parseActiveCreativeTask(input), null);
const restored = parseActiveCreativeTask(
  JSON.stringify({
    id: 'task-123',
    model: 'nano-banana-pro',
    mode: 'edit',
    ratio: '3:4',
    scene: 'product',
  })
);
assert.equal(restored?.mode, 'edit');
assert.equal(restored?.ratio, '3:4');
assert.equal(restored?.scene, 'product');
const fallback = parseActiveCreativeTask(
  JSON.stringify({
    id: 'task-123',
    model: 'nano-banana-pro',
    mode: 'generate',
    ratio: 'invalid',
    scene: 'private data',
  })
);
assert.equal(fallback?.scene, 'general');
assert.notEqual(fallback?.ratio, 'invalid');
console.log(
  'Workflow resume validation, parameter recovery and scene privacy checks passed.'
);
