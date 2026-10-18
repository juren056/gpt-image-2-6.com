import assert from 'node:assert/strict';

// Exercise generated HTTP output, not source-string copies of editorial prose.
const base = process.argv[2] || 'http://127.0.0.1:3120';
const production = 'https://nanobanana21pro.com';
const sitemapResponse = await fetch(`${base}/sitemap.xml`);
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
assert(
  sitemap.includes(
    'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'
  )
);
const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(
  (match) => match[1]
);
const locs = new Set();
const images = new Set();
const pages = new Map();
let imagePages = 0;
for (const entry of entries) {
  const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
  assert(loc, 'Every sitemap entry needs a location');
  const url = new URL(loc);
  assert.equal(url.origin, production);
  assert(
    !url.search && !url.hash,
    'Only clean canonical URLs belong in sitemap'
  );
  assert(!locs.has(loc), 'Duplicate sitemap URL');
  locs.add(loc);
  const date = entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  if (date) assert(Date.parse(date) <= Date.now(), 'Future lastmod');
  const imageLocs = [...entry.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(
    (match) => match[1]
  );
  if (!imageLocs.length) continue;
  imagePages++;
  const response = await fetch(base + url.pathname);
  assert.equal(response.status, 200);
  const html = await response.text();
  pages.set(url.pathname, html);
  for (const image of imageLocs) {
    assert.equal(new URL(image).origin, production);
    const path = new URL(image).pathname;
    assert(
      html.includes(path),
      `${url.pathname} must expose its image source or original link`
    );
    images.add(path);
  }
}
assert(
  imagePages >= 10,
  'Reviewed EN/ZH evidence pages must expose image sitemap entries'
);
for (const image of images) {
  const response = await fetch(base + image, { method: 'HEAD' });
  assert.equal(response.status, 200, `Missing original: ${image}`);
  assert(response.headers.get('content-type')?.includes('image/'));
}
for (const prefix of ['', '/zh']) {
  for (const path of ['/wan-3-0', '/seedance-2-5-draft-mode']) {
    assert(locs.has(production + prefix + path));
    const response = await fetch(base + prefix + path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert(!/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html));
  }
}
let schemas = 0;
for (const html of pages.values()) {
  for (const match of html.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  )) {
    JSON.parse(match[1]);
    schemas++;
  }
}
assert(schemas > 0, 'Evidence pages need readable schema output');
console.log(
  JSON.stringify(
    {
      sitemapUrls: locs.size,
      imagePages,
      uniqueOriginalImages: images.size,
      readableSchemas: schemas,
      restoredIndexableVideoPages: 4,
    },
    null,
    2
  )
);
