import assert from 'node:assert/strict';

import { serveUploadedImage } from '../../src/routes/api/storage/media/$key';

const key = 'ca2266ec-88c3-40c8-a8a1-53a6f9255157.png';
const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const runtime = globalThis as typeof globalThis & { __CF_ENV__?: unknown };
const previous = runtime.__CF_ENV__;
let calls = 0;
let contentType = 'image/png';
runtime.__CF_ENV__ = {
  IMAGE_BUCKET: {
    get: async (storedKey: string) => {
      calls++;
      if (storedKey !== `uploads/${key}`) return null;
      return {
        body: new Blob([bytes]).stream(),
        httpEtag: '"fixture"',
        httpMetadata: { contentType },
      };
    },
  },
};
try {
  const response = await serveUploadedImage(key);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(
    response.headers.get('x-robots-tag'),
    'noindex, nofollow, noarchive'
  );
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
  assert.equal((await serveUploadedImage(key, 'HEAD')).body, null);
  const before = calls;
  assert.equal((await serveUploadedImage('../config')).status, 404);
  assert.equal(calls, before, 'Invalid paths must never reach storage');
  contentType = 'image/svg+xml';
  assert.equal(
    (await serveUploadedImage(key)).status,
    404,
    'Active image formats cannot be served inline'
  );
  runtime.__CF_ENV__ = {};
  assert.equal((await serveUploadedImage(key)).status, 503);
} finally {
  runtime.__CF_ENV__ = previous;
}
console.log(
  'PASS: image GET bytes/headers, HEAD, path traversal guard, active content rejection, missing binding'
);
