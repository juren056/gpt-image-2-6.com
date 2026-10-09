import assert from 'node:assert/strict';

import { ANONYMOUS_IMAGE_GENERATION_ENABLED } from '../src/lib/product-policy';
import {
  enforceMinIntervalRateLimit,
  releaseDailyBudgetReservation,
  releaseRateLimitReservation,
  reserveDailyDistributedBudget,
  reserveMinIntervalRateLimit,
} from '../src/lib/rate-limit';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const kvUrl = process.env.KV_REST_API_URL;
const kvToken = process.env.KV_REST_API_TOKEN;
const originalFetch = globalThis.fetch;

function restoreEnvironment() {
  const entries = [
    ['UPSTASH_REDIS_REST_URL', redisUrl],
    ['UPSTASH_REDIS_REST_TOKEN', redisToken],
    ['KV_REST_API_URL', kvUrl],
    ['KV_REST_API_TOKEN', kvToken],
  ] as const;
  for (const [key, value] of entries) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = originalFetch;
}

async function main() {
  assert.equal(
    ANONYMOUS_IMAGE_GENERATION_ENABLED,
    false,
    'anonymous image generation must remain disabled'
  );
  const { POST: postAnonymousImage } =
    await import('../src/routes/api/images/anonymous');
  const blockedResponse = await postAnonymousImage({
    request: new Request('https://example.test/api/images/anonymous', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'a harmless landscape' }),
    }),
  });
  assert.deepEqual(await blockedResponse.json(), {
    code: -1,
    message: 'Sign in to generate images',
  });
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;

  const request = new Request('https://example.test/api/images/anonymous', {
    method: 'POST',
    headers: { 'cf-connecting-ip': '203.0.113.10' },
  });
  const unavailable = await enforceMinIntervalRateLimit(request, {
    intervalMs: 60_000,
    keyPrefix: 'anonymous-rate-limit-test-missing',
    keyBy: 'ip',
    requireDistributedStore: true,
  });
  assert.equal(unavailable?.status, 503);
  assert.equal((await unavailable?.json())?.error, 'rate_limit_unavailable');

  process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.test';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  globalThis.fetch = async () => Response.json({ result: 'OK' });
  const acquired = await enforceMinIntervalRateLimit(request, {
    intervalMs: 60_000,
    keyPrefix: 'anonymous-rate-limit-test-acquired',
    keyBy: 'ip',
    requireDistributedStore: true,
  });
  assert.equal(acquired, null);

  globalThis.fetch = async () => Response.json({ result: null });
  const limited = await enforceMinIntervalRateLimit(request, {
    intervalMs: 60_000,
    keyPrefix: 'anonymous-rate-limit-test-limited',
    keyBy: 'ip',
    requireDistributedStore: true,
  });
  assert.equal(limited?.status, 429);

  const commands: unknown[][] = [];
  globalThis.fetch = async (_input, init) => {
    const command = JSON.parse(String(init?.body)) as unknown[];
    commands.push(command);
    return Response.json({ result: command[0] === 'SET' ? 'OK' : 1 });
  };
  const reserved = await reserveMinIntervalRateLimit(request, {
    intervalMs: 60_000,
    keyPrefix: 'anonymous-rate-limit-test-release',
    keyBy: 'ip',
    requireDistributedStore: true,
    owner: 'owner-a',
  });
  assert.equal(reserved.response, null);
  assert.ok(reserved.reservation);
  assert.equal(await releaseRateLimitReservation(reserved.reservation), true);
  assert.equal(commands[0]?.[2], 'owner-a');
  assert.equal(commands[1]?.at(-1), 'owner-a');

  globalThis.fetch = async () => Response.json({ result: [1, 1] });
  const budget = await reserveDailyDistributedBudget({
    key: 'anonymous-budget-test|2026-09-11',
    owner: 'budget-owner',
    limit: 25,
    ttlMs: 60_000,
  });
  assert.equal(budget.response, null);
  assert.ok(budget.reservation);
  globalThis.fetch = async () => Response.json({ result: 1 });
  assert.equal(await releaseDailyBudgetReservation(budget.reservation), true);

  globalThis.fetch = async () => Response.json({ result: 0 });
  assert.equal(await releaseDailyBudgetReservation(budget.reservation), false);

  globalThis.fetch = async () => Response.json({ result: [0, 25] });
  const exhausted = await reserveDailyDistributedBudget({
    key: 'anonymous-budget-test|2026-09-11',
    owner: 'budget-owner-2',
    limit: 25,
    ttlMs: 60_000,
    windowLabel: 'this hour',
  });
  assert.equal(exhausted.response?.status, 429);
  assert.match(
    String((await exhausted.response?.json())?.message),
    /this hour/
  );

  globalThis.fetch = async () => Response.json({ result: [0, 0] });
  const disabled = await reserveDailyDistributedBudget({
    key: 'anonymous-budget-test|2026-09-12',
    owner: 'budget-owner-3',
    limit: 0,
    ttlMs: 60_000,
  });
  assert.equal(disabled.response?.status, 429);

  console.log(
    'Anonymous distributed reservation and daily-budget verification passed.'
  );
}

main().finally(restoreEnvironment);
