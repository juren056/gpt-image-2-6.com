import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';

const base = new URL(process.argv[2] || 'http://127.0.0.1:4321');
const pages = [
  { path: '/', maxGzip: 900_000 },
  { path: '/posts/nano-banana-21-vs-pro', maxGzip: 900_000 },
  { path: '/prompts/chinese', maxGzip: 1_200_000 },
];
const measured = new Map();
const results = [];

for (const page of pages) {
  const response = await fetch(new URL(page.path, base), {
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200, page.path);
  const html = await response.text();
  const urls = new Set();
  for (const tag of html.match(/<(?:link|script)\b[^>]*>/gi) || []) {
    const attributes = Object.fromEntries(
      [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [
        key,
        value.replaceAll('&amp;', '&'),
      ])
    );
    const href =
      attributes.rel === 'modulepreload'
        ? attributes.href
        : /^<script\b/i.test(tag) && attributes.type === 'module'
          ? attributes.src
          : undefined;
    if (!href) continue;
    const url = new URL(href, base);
    if (
      url.origin === base.origin &&
      url.pathname.startsWith('/assets/') &&
      url.pathname.endsWith('.js')
    )
      urls.add(url.href);
  }
  assert.ok(urls.size > 0, `${page.path}: expected compiled module assets`);
  const queue = [...urls];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (cursor < queue.length) {
        const url = queue[cursor++];
        if (measured.has(url)) continue;
        const asset = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        assert.equal(asset.status, 200, new URL(url).pathname);
        const bytes = Buffer.from(await asset.arrayBuffer());
        measured.set(url, {
          raw: bytes.length,
          gzip: gzipSync(bytes, { level: 9 }).length,
        });
      }
    })
  );
  const raw = [...urls].reduce((sum, url) => sum + measured.get(url).raw, 0);
  const gzip = [...urls].reduce((sum, url) => sum + measured.get(url).gzip, 0);
  results.push({
    path: page.path,
    modules: urls.size,
    raw,
    normalizedGzip: gzip,
    budget: page.maxGzip,
  });
  assert.ok(
    gzip <= page.maxGzip,
    `${page.path}: startup JS ${gzip} exceeds ${page.maxGzip} gzip bytes`
  );
}
console.log(JSON.stringify({ base: base.origin, results }, null, 2));
