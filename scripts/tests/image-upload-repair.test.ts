import assert from 'node:assert/strict';

import {
  MEDIA_KEY_PATTERN,
  R2BindingProvider,
  type ImageBucket,
} from '../../src/core/storage/r2-binding';
import { apiPostForm } from '../../src/lib/api-client';
import { uploadImageFile } from '../../src/lib/image-upload-client';

const writes: Array<{ key: string; body: Uint8Array; type: string }> = [];
const bucket: ImageBucket = {
  put: async (key, body, options) => {
    writes.push({ key, body, type: options.httpMetadata.contentType });
    return {};
  },
  get: async () => null,
};
const provider = new R2BindingProvider(bucket, 'https://nanobanana21pro.com/');
const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const first = await provider.uploadFile({
  body: bytes,
  key: 'known-hash.png',
  contentType: 'image/png',
});
const second = await provider.uploadFile({
  body: bytes,
  key: 'known-hash.png',
  contentType: 'image/png',
});
assert(first.success && first.url && first.key);
assert(MEDIA_KEY_PATTERN.test(first.key));
assert.notEqual(
  first.key,
  second.key,
  'Identical images cannot reveal another upload URL'
);
assert.deepEqual(writes[0].body, bytes);
assert.equal(writes[0].type, 'image/png');
assert.equal(
  first.url,
  `https://nanobanana21pro.com/api/storage/media/${first.key}`
);
assert.equal(
  (
    await provider.uploadFile({
      body: bytes,
      key: 'x.svg',
      contentType: 'image/svg+xml',
    })
  ).success,
  false
);
for (const key of ['../secret', 'known-hash.png', 'a.svg', 'uploads/test.png'])
  assert(!MEDIA_KEY_PATTERN.test(key));

const originalFetch = globalThis.fetch;
const times: number[] = [];
let failNext = false;
let rateLimitNext = 0;
globalThis.fetch = async (_input, init) => {
  assert(init?.body instanceof FormData);
  assert.equal(
    new Headers(init.headers).get('content-type'),
    null,
    'Browser must set multipart boundary'
  );
  times.push(Date.now());
  if (rateLimitNext > 0) {
    rateLimitNext--;
    return Response.json(
      { code: -1, message: 'Please retry after 1s.' },
      { status: 429 }
    );
  }
  if (failNext) {
    failNext = false;
    return Response.json(
      { code: -1, message: 'Storage unavailable' },
      { status: 503 }
    );
  }
  return Response.json({
    code: 0,
    data: { urls: ['https://nanobanana21pro.com/api/storage/media/test.png'] },
  });
};
try {
  const form = new FormData();
  form.append('files', new File([bytes], 'test.png', { type: 'image/png' }));
  await apiPostForm('/api/storage/upload-image', form);
  times.length = 0;
  const file = new File([bytes], 'fixture.png', { type: 'image/png' });
  await Promise.all([
    uploadImageFile(file),
    uploadImageFile(file),
    uploadImageFile(file),
  ]);
  assert.equal(times.length, 3);
  assert(
    times[1] - times[0] >= 1000 && times[2] - times[1] >= 1000,
    'Multiple references must not race the rate limiter'
  );
  failNext = true;
  await assert.rejects(uploadImageFile(file), /Storage unavailable/);
  await uploadImageFile(file); // A failed upload must not poison subsequent requests.
  times.length = 0;
  rateLimitNext = 1;
  await uploadImageFile(file);
  assert.equal(times.length, 2);
  assert(
    times[1] - times[0] >= 1000,
    'Cross-tab rate limits must wait before retry'
  );
  times.length = 0;
  rateLimitNext = 2;
  await assert.rejects(uploadImageFile(file), /Please retry after 1s/);
  assert.equal(times.length, 2, 'Rate-limit retries must stay bounded');
  await assert.rejects(
    uploadImageFile(new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' })),
    /JPG, PNG or WebP/
  );
  await assert.rejects(
    uploadImageFile(new File([], 'empty.png', { type: 'image/png' })),
    /10MB/
  );
} finally {
  globalThis.fetch = originalFetch;
}
console.log(
  'PASS: private R2 persistence, unguessable URLs, MIME rejection, multipart boundary, multi-image queue and retry recovery'
);
