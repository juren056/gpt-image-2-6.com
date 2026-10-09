import assert from 'node:assert/strict';

import { verifyTurnstileToken } from '../src/lib/turnstile';

const originalFetch = globalThis.fetch;

async function main() {
  const requests: URLSearchParams[] = [];
  globalThis.fetch = async (_input, init) => {
    requests.push(new URLSearchParams(String(init?.body || '')));
    return Response.json({
      success: true,
      action: 'anonymous_generation',
    });
  };

  assert.equal(
    await verifyTurnstileToken({
      token: 'valid-token',
      secretKey: 'secret',
      remoteIp: '203.0.113.10',
      expectedAction: 'anonymous_generation',
    }),
    true
  );
  assert.equal(requests[0]?.get('secret'), 'secret');
  assert.equal(requests[0]?.get('response'), 'valid-token');
  assert.equal(requests[0]?.get('remoteip'), '203.0.113.10');

  globalThis.fetch = async () =>
    Response.json({ success: true, action: 'signup' });
  assert.equal(
    await verifyTurnstileToken({
      token: 'wrong-action',
      secretKey: 'secret',
      expectedAction: 'anonymous_generation',
    }),
    false
  );

  globalThis.fetch = async () => Response.json({ success: false });
  assert.equal(
    await verifyTurnstileToken({
      token: 'rejected-token',
      secretKey: 'secret',
    }),
    false
  );
  assert.equal(
    await verifyTurnstileToken({ token: '', secretKey: 'secret' }),
    false
  );

  globalThis.fetch = async () => {
    throw new Error('network unavailable');
  };
  assert.equal(
    await verifyTurnstileToken({
      token: 'network-error',
      secretKey: 'secret',
    }),
    false
  );

  console.log('Turnstile verification passed.');
}

main().finally(() => {
  globalThis.fetch = originalFetch;
});
