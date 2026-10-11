import assert from 'node:assert/strict';

import { apiGet } from '../src/lib/api-client';
import { respData } from '../src/lib/resp';

const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => respData(null);
  const subscription = await apiGet<{ id: string } | null>(
    '/api/user/subscriptions/current'
  );
  assert.equal(
    subscription,
    null,
    'An account without a subscription must select the free-plan branch'
  );
  assert.deepEqual(await respData(undefined).json(), {
    code: 0,
    message: 'ok',
    data: [],
  });
  assert.deepEqual(await respData({ id: 'sub-active' }).json(), {
    code: 0,
    message: 'ok',
    data: { id: 'sub-active' },
  });
} finally {
  globalThis.fetch = originalFetch;
}
console.log(
  'Nullable subscription API contract and omitted-payload compatibility passed.'
);
