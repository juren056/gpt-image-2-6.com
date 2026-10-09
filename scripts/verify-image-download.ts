import assert from 'node:assert/strict';

import {
  assertSafeImageDownloadUrl,
  fetchImageForDownload,
  getImageDownloadFilename,
} from '../src/modules/images/download';

assert.equal(
  assertSafeImageDownloadUrl('https://cdn.example.com/image.png').hostname,
  'cdn.example.com'
);

for (const unsafeUrl of [
  'http://cdn.example.com/image.png',
  'https://localhost/image.png',
  'https://127.0.0.1/image.png',
  'https://user:pass@cdn.example.com/image.png',
]) {
  assert.throws(() => assertSafeImageDownloadUrl(unsafeUrl));
}

assert.equal(
  getImageDownloadFilename('abc/../123', 'image/webp'),
  'image-abc123.webp'
);
assert.equal(
  getImageDownloadFilename('', 'image/png; charset=binary'),
  'image-generated.png'
);

const originalFetch = globalThis.fetch;
try {
  const requests: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = input.toString();
    requests.push(url);
    if (requests.length === 1) {
      return new Response(null, {
        status: 302,
        headers: { location: 'https://media.example.com/final.png' },
      });
    }
    return new Response(new Uint8Array([137, 80, 78, 71]), {
      status: 200,
      headers: { 'content-type': 'image/png' },
    });
  }) as typeof fetch;

  const response = await fetchImageForDownload(
    'https://cdn.example.com/start.png'
  );
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.deepEqual(requests, [
    'https://cdn.example.com/start.png',
    'https://media.example.com/final.png',
  ]);

  globalThis.fetch = (async () =>
    new Response(null, {
      status: 302,
      headers: { location: 'https://127.0.0.1/private.png' },
    })) as typeof fetch;
  await assert.rejects(
    () => fetchImageForDownload('https://cdn.example.com/start.png'),
    /Unsafe image URL/
  );
} finally {
  globalThis.fetch = originalFetch;
}

console.log('image download verification passed');
