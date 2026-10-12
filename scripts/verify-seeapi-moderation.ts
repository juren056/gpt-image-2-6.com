import assert from 'node:assert/strict';

import {
  moderateConfiguredImages,
  moderateConfiguredInput,
} from '../src/core/ai/image-moderation';
import { moderateWithSeeAPI } from '../src/core/ai/seeapi-moderation';
import {
  imageModerationConfig,
  validateImageModerationSettings,
} from '../src/lib/image-moderation-config';
import {
  filterPublicConfigs,
  isSecretConfigKey,
} from '../src/modules/config/service';
import { getSettings } from '../src/modules/config/settings';
import { getTestSpec, runTest } from '../src/modules/config/settings-test';
import {
  automatedSafetyReviewStatus,
  resolveExternalInputModeration,
  shouldQuarantineGeneratedOutput,
} from '../src/modules/images/content-safety';

const apiKey = 'test-only-seeapi';
const imageUrl = 'https://example.com/photo.png';
const noDelay = async () => {};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });
const completed = (id: string, flagged = false) => ({
  id,
  status: 'succeeded',
  error: null,
  result: {
    type: 'json',
    data: {
      flagged,
      categories: {
        nsfw: flagged ? ['explicit'] : [],
        special_care: ['example-label'],
      },
    },
  },
});

type Call = { url: string; init?: RequestInit };
function mockReview(flaggedUrls: string[] = []) {
  const calls: Call[] = [];
  const tasks = new Map<string, string>();
  const fetchImpl = (async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    assert.equal(init?.redirect, 'manual');
    if (init?.method === 'POST') {
      const body = JSON.parse(String(init.body));
      assert.equal(body.model, 'nsfw-filter');
      assert.equal(body.endpoint, 'image-moderation');
      assert.equal(body.provider, 'seeapi');
      assert.equal(body.callback_url, undefined);
      assert.equal(
        new Headers(init.headers).get('authorization'),
        `Bearer ${apiKey}`
      );
      assert.doesNotMatch(String(init.body), /test-only-seeapi/);
      const id = `task_${tasks.size}`;
      tasks.set(id, body.input.image_url);
      return json({ id, status: 'queued', result: null }, 202);
    }
    const id = decodeURIComponent(url.split('/').at(-1)!);
    return json(completed(id, flaggedUrls.includes(tasks.get(id)!)));
  }) as typeof fetch;
  return { calls, fetchImpl };
}

const safeMock = mockReview();
const safe = await moderateWithSeeAPI({
  apiKey,
  imageUrls: [imageUrl],
  fetchImpl: safeMock.fetchImpl,
});
assert.equal(safe.decision, 'allow');
assert.equal(safeMock.calls.length, 2);
assert.equal(
  safeMock.calls[1].url,
  'https://api.seeapi.com/v1/inferences/task_0'
);
assert.equal(
  JSON.parse(String(safeMock.calls[0].init?.body)).input.threshold_offset,
  0.02
);
assert.equal(
  JSON.parse(String(safeMock.calls[0].init?.body)).input.strict_special_care,
  true
);
assert.equal(
  safe.labels?.special_care[0],
  'example-label',
  'special-care labels alone do not mean flagged'
);

const blocked = await moderateWithSeeAPI({
  apiKey,
  imageUrls: [imageUrl],
  fetchImpl: mockReview([imageUrl]).fetchImpl,
});
assert.equal(blocked.decision, 'block');
assert.equal(blocked.confidence, 0);
assert.equal(shouldQuarantineGeneratedOutput(blocked), true);
assert.equal(resolveExternalInputModeration(blocked, true).allowed, false);
assert.equal(
  automatedSafetyReviewStatus(
    {
      allowed: false,
      category: blocked.category,
      severity: blocked.severity,
      confidence: blocked.confidence,
      source: 'external',
    },
    { corroborated: true }
  ),
  'not_required'
);

for (const data of [
  { id: 'task_x', status: 'succeeded', result: null },
  {
    ...completed('task_x'),
    result: { type: 'json', data: { flagged: 'false' } },
  },
  {
    ...completed('task_x'),
    result: {
      type: 'json',
      data: { flagged: false, categories: { nsfw: [1], special_care: [] } },
    },
  },
  { id: 'task_x', status: 'failed', error: { message: apiKey } },
  completed('wrong_id'),
  null,
]) {
  const result = await moderateWithSeeAPI({
    apiKey,
    imageUrls: [imageUrl],
    fetchImpl: (async (_input, init) =>
      init?.method === 'POST'
        ? json({ id: 'task_x' }, 202)
        : json(data)) as typeof fetch,
  });
  assert.equal(result.category, 'moderation_unavailable');
  assert.equal(resolveExternalInputModeration(result, true).allowed, false);
  assert.equal(
    shouldQuarantineGeneratedOutput(result),
    false,
    'retain output-outage fallback'
  );
  assert.doesNotMatch(result.reasonCode, /test-only-seeapi/);
}

let posts = 0;
const retryKeys: string[] = [];
const retryBodies: string[] = [];
const delays: number[] = [];
let polls = 0;
const recovered = await moderateWithSeeAPI({
  apiKey,
  imageUrls: [imageUrl],
  sleepImpl: async (ms) => {
    delays.push(ms);
  },
  fetchImpl: (async (_input, init) => {
    if (init?.method === 'POST') {
      posts++;
      retryKeys.push(new Headers(init.headers).get('Idempotency-Key')!);
      retryBodies.push(String(init.body));
      if (posts === 1) throw new Error('network');
      if (posts === 2) return json({}, 429);
      return json({ id: 'task_x', result: null }, 202);
    }
    polls++;
    return json(
      polls < 3
        ? {
            id: 'task_x',
            status: polls === 1 ? 'queued' : 'processing',
            result: null,
          }
        : completed('task_x')
    );
  }) as typeof fetch,
});
assert.equal(recovered.decision, 'allow');
assert.equal(new Set(retryKeys).size, 1);
assert.equal(new Set(retryBodies).size, 1);
assert.deepEqual(delays, [500, 1000, 500, 1000]);

let unauthorizedCalls = 0;
const unauthorized = await moderateWithSeeAPI({
  apiKey,
  imageUrls: [imageUrl],
  sleepImpl: noDelay,
  fetchImpl: (async () => {
    unauthorizedCalls++;
    return new Response(apiKey, { status: 401 });
  }) as typeof fetch,
});
assert.equal(unauthorizedCalls, 1);
assert.equal(unauthorized.reasonCode, 'seeapi_http_401');

const timedOut = await moderateWithSeeAPI({
  apiKey,
  imageUrls: [imageUrl],
  timeoutMs: 10,
  fetchImpl: (async (_input, init) =>
    init?.method === 'POST'
      ? json({ id: 'task_x' }, 202)
      : json({
          id: 'task_x',
          status: 'processing',
          result: null,
        })) as typeof fetch,
});
assert.equal(timedOut.reasonCode, 'seeapi_timeout');
const hanging = await moderateWithSeeAPI({
  apiKey,
  imageUrls: [imageUrl],
  timeoutMs: 10,
  fetchImpl: ((_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener(
        'abort',
        () => reject(new Error('abort')),
        { once: true }
      );
    })) as typeof fetch,
});
assert.equal(hanging.reasonCode, 'seeapi_timeout');

const batchUrls = Array.from(
  { length: 14 },
  (_, i) => `https://example.com/${i}.png`
);
const batchMock = mockReview([batchUrls[13]]);
const batch = await moderateWithSeeAPI({
  apiKey,
  imageUrls: batchUrls,
  fetchImpl: batchMock.fetchImpl,
});
assert.equal(batch.decision, 'block', 'the last image must be reviewed too');
assert.equal(
  batchMock.calls.filter((call) => call.init?.method === 'POST').length,
  14
);
const partial = await moderateWithSeeAPI({
  apiKey,
  imageUrls: batchUrls.slice(0, 2),
  sleepImpl: noDelay,
  fetchImpl: (async (input, init) => {
    if (init?.method === 'POST')
      return json(
        {
          id: JSON.parse(String(init.body)).input.image_url.endsWith('/0.png')
            ? 'bad'
            : 'safe',
        },
        202
      );
    return String(input).endsWith('/bad')
      ? new Response('', { status: 503 })
      : json(completed('safe'));
  }) as typeof fetch,
});
assert.equal(
  partial.category,
  'moderation_unavailable',
  'one pass cannot override an incomplete batch'
);
const blockAndOutage = await moderateWithSeeAPI({
  apiKey,
  imageUrls: batchUrls.slice(0, 2),
  sleepImpl: noDelay,
  fetchImpl: (async (input, init) => {
    if (init?.method === 'POST')
      return json(
        {
          id: JSON.parse(String(init.body)).input.image_url.endsWith('/0.png')
            ? 'outage'
            : 'flagged',
        },
        202
      );
    return String(input).endsWith('/outage')
      ? new Response('', { status: 503 })
      : json(completed('flagged', true));
  }) as typeof fetch,
});
assert.equal(
  blockAndOutage.decision,
  'block',
  'an outage cannot erase another image’s confirmed detector flag'
);
let excessCalls = 0;
assert.equal(
  (
    await moderateWithSeeAPI({
      apiKey,
      imageUrls: [...batchUrls, imageUrl],
      fetchImpl: (async () => {
        excessCalls++;
        return json({});
      }) as typeof fetch,
    })
  ).category,
  'moderation_unavailable'
);
assert.equal(excessCalls, 0, 'oversized batches must not silently truncate');

const dedup = mockReview();
await moderateWithSeeAPI({
  apiKey,
  imageUrls: [imageUrl, imageUrl],
  fetchImpl: dedup.fetchImpl,
});
assert.equal(dedup.calls.length, 2);
const stableKeys: string[] = [];
for (const prefix of ['task-local-1', 'task-local-1', 'task-local-2']) {
  const stable = mockReview();
  await moderateWithSeeAPI({
    apiKey,
    imageUrls: [imageUrl],
    idempotencyPrefix: prefix,
    fetchImpl: stable.fetchImpl,
  });
  stableKeys.push(
    new Headers(stable.calls[0].init?.headers).get('Idempotency-Key')!
  );
}
assert.equal(
  stableKeys[0],
  stableKeys[1],
  'polling and webhooks reuse one logical review'
);
assert.notEqual(stableKeys[0], stableKeys[2]);

for (const image of [
  'data:image/png;base64,abc',
  '/uploads/file.png',
  'https://user:password@example.com/a.png',
]) {
  const result = await moderateWithSeeAPI({
    apiKey,
    imageUrls: [image],
    fetchImpl: (() => {
      throw new Error('must not fetch');
    }) as typeof fetch,
  });
  assert.equal(result.category, 'moderation_unavailable');
}

const config = imageModerationConfig({
  openai_api_key: 'test-only-openai',
  seeapi_api_key: apiKey,
});
assert.equal(config.seeapi?.apiKey, apiKey);
assert.equal(
  imageModerationConfig({
    seeapi_api_key: apiKey,
    content_safety_seeapi_enabled: 'false',
  }).seeapi,
  undefined
);
assert.equal(
  imageModerationConfig({ openai_api_key: 'old-key' }).seeapi,
  undefined
);
assert.equal(
  imageModerationConfig({
    seeapi_api_key: apiKey,
    content_safety_openai_enabled: 'false',
  }).apiKey,
  ''
);
for (const offset of ['-0.01', '0.11', '0.025', 'NaN', 'Infinity'])
  assert.throws(() =>
    validateImageModerationSettings({ seeapi_threshold_offset: offset })
  );
for (const offset of ['0', '0.02', '0.1', ''])
  validateImageModerationSettings({ seeapi_threshold_offset: offset });
assert.throws(() =>
  validateImageModerationSettings({ content_safety_seeapi_enabled: 'yes' })
);
assert.throws(() =>
  validateImageModerationSettings({ seeapi_strict_special_care: 'yes' })
);
assert.equal(isSecretConfigKey('seeapi_api_key'), true);
assert.deepEqual(
  filterPublicConfigs({ seeapi_api_key: apiKey }, ['seeapi_api_key']),
  {}
);
assert.equal(
  getSettings().find((field) => field.name === 'seeapi_api_key')?.type,
  'password'
);
assert.equal(getTestSpec('seeapi')?.fields[0].required, true);
assert.equal((await runTest('seeapi', { imageUrl }, {})).success, false);
assert.equal(
  (await runTest('seeapi', { imageUrl: ' ' }, { seeapi_api_key: apiKey }))
    .success,
  false
);
const originalFetch = globalThis.fetch;
try {
  const testMock = mockReview([imageUrl]);
  globalThis.fetch = testMock.fetchImpl;
  const testResult = await runTest(
    'seeapi',
    { imageUrl },
    {
      seeapi_api_key: apiKey,
      content_safety_seeapi_enabled: 'false',
      seeapi_threshold_offset: '0.03',
      seeapi_strict_special_care: 'false',
    }
  );
  assert.equal(
    testResult.success,
    true,
    'connection tests may succeed while the image is flagged, even when generation review is disabled'
  );
  assert.equal(testResult.details?.Decision, 'block');
  const input = JSON.parse(String(testMock.calls[0].init?.body)).input;
  assert.equal(input.threshold_offset, 0.03);
  assert.equal(input.strict_special_care, false);
} finally {
  globalThis.fetch = originalFetch;
}

const routingMock = mockReview();
const textCalls: unknown[] = [];
let textFlagged = false;
let textUnavailable = false;
const routedFetch = (async (input, init) => {
  if (String(input).includes('openai.com')) {
    textCalls.push(JSON.parse(String(init?.body)).input);
    return textUnavailable
      ? new Response('', { status: 503 })
      : json({
          results: [
            {
              flagged: textFlagged,
              categories: textFlagged ? { sexual: true } : {},
              category_scores: { sexual: textFlagged ? 0.99 : 0 },
            },
          ],
        });
  }
  return routingMock.fetchImpl(input, init);
}) as typeof fetch;
assert.equal(
  (
    await moderateConfiguredInput(
      config,
      { text: 'product', imageUrls: [imageUrl] },
      { fetchImpl: routedFetch, sleepImpl: noDelay }
    )
  )?.decision,
  'allow'
);
assert.deepEqual(
  textCalls,
  ['product'],
  'OpenAI prompt review remains and SeeAPI handles the image'
);
textFlagged = true;
const beforeBlock = routingMock.calls.length;
assert.equal(
  (
    await moderateConfiguredInput(
      config,
      { text: 'blocked', imageUrls: [imageUrl] },
      { fetchImpl: routedFetch }
    )
  )?.detector,
  'openai'
);
assert.equal(
  routingMock.calls.length,
  beforeBlock,
  'blocked prompts never reach image inference'
);
textFlagged = false;
textUnavailable = true;
assert.equal(
  (
    await moderateConfiguredInput(
      config,
      { text: 'product', imageUrls: [imageUrl] },
      { fetchImpl: routedFetch, sleepImpl: noDelay }
    )
  )?.decision,
  'allow',
  'text-only outage does not override a completed image check'
);
assert.equal(
  (
    await moderateConfiguredInput(
      config,
      { text: 'product' },
      { fetchImpl: routedFetch }
    )
  )?.category,
  'moderation_unavailable'
);

const outputMock = mockReview();
assert.equal(
  (
    await moderateConfiguredImages(config, [imageUrl], {
      fetchImpl: outputMock.fetchImpl,
    })
  )?.detector,
  'seeapi'
);
assert.equal(
  (
    await moderateConfiguredImages({ apiKey: 'old-key' }, [imageUrl], {
      fetchImpl: (async (_url, init) => {
        assert.equal(JSON.parse(String(init?.body)).input[0].type, 'image_url');
        return json({
          results: [{ flagged: false, categories: {}, category_scores: {} }],
        });
      }) as typeof fetch,
    })
  )?.detector,
  'openai',
  'legacy image fallback is unchanged'
);
assert.equal(await moderateConfiguredImages({}, [imageUrl]), null);

console.log(
  'SeeAPI moderation verification passed: async tasks, batches, retries, configuration, secret filtering, routing and policy boundaries'
);
