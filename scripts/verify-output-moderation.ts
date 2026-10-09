import assert from 'node:assert/strict';

import {
  inspectProviderSafetyPayload,
  moderateWithOpenAI,
  moderateWithOpenAIRetry,
} from '../src/core/ai/moderation';

assert.equal(
  inspectProviderSafetyPayload({ has_nsfw_concepts: [false] })?.decision,
  'allow'
);
assert.equal(
  inspectProviderSafetyPayload({ data: { has_nsfw_concepts: [false, true] } })
    ?.decision,
  'block'
);
assert.equal(
  inspectProviderSafetyPayload({ enable_safety_checker: true }),
  null
);
assert.equal(
  inspectProviderSafetyPayload('{"has_nsfw_concepts":[0,"true"]}')?.decision,
  'block'
);

let capturedBody = '';
const safe = await moderateWithOpenAI({
  apiKey: 'test-only',
  text: 'safe product photo',
  imageUrls: ['https://example.com/product.png'],
  fetchImpl: (async (_input, init) => {
    capturedBody = String(init?.body || '');
    return new Response(
      JSON.stringify({
        model: 'omni-moderation-latest',
        results: [
          {
            flagged: false,
            categories: {},
            category_scores: { sexual: 0.001 },
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch,
});
assert.equal(safe.decision, 'allow');
assert.match(capturedBody, /image_url/);
assert.doesNotMatch(capturedBody, /test-only/);

const blocked = await moderateWithOpenAI({
  apiKey: 'test-only',
  imageUrls: ['https://example.com/unsafe.png'],
  fetchImpl: (async () =>
    new Response(
      JSON.stringify({
        model: 'omni-moderation-latest',
        results: [
          {
            flagged: true,
            categories: { 'sexual/minors': true },
            category_scores: { 'sexual/minors': 0.96, sexual: 0.99 },
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )) as typeof fetch,
});
assert.equal(blocked.decision, 'block');
assert.equal(blocked.severity, 'critical');

const categorySpecificConfidence = await moderateWithOpenAI({
  apiKey: 'test-only',
  imageUrls: ['https://example.com/ambiguous.png'],
  fetchImpl: (async () =>
    new Response(
      JSON.stringify({
        model: 'omni-moderation-latest',
        results: [
          {
            flagged: true,
            categories: { 'sexual/minors': true, sexual: true },
            category_scores: { 'sexual/minors': 0.02, sexual: 0.99 },
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )) as typeof fetch,
});
assert.equal(categorySpecificConfidence.category, 'sexual_minors');
assert.equal(
  categorySpecificConfidence.confidence,
  2,
  'confidence must come from the selected category, not another high score'
);

const unavailable = await moderateWithOpenAI({
  apiKey: 'test-only',
  text: 'anything',
  fetchImpl: (async () =>
    new Response('down', { status: 503 })) as typeof fetch,
});
assert.equal(unavailable.decision, 'review');
assert.equal(unavailable.category, 'moderation_unavailable');

let retryCalls = 0;
const recovered = await moderateWithOpenAIRetry({
  apiKey: 'test-only',
  text: 'safe character outfit',
  fetchImpl: (async () => {
    retryCalls += 1;
    if (retryCalls === 1) return new Response('down', { status: 503 });
    return new Response(
      JSON.stringify({
        model: 'omni-moderation-latest',
        results: [
          {
            flagged: false,
            categories: {},
            category_scores: { sexual: 0.001 },
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }) as typeof fetch,
});
assert.equal(recovered.decision, 'allow');
assert.equal(retryCalls, 2);

console.log('output moderation verification passed');
