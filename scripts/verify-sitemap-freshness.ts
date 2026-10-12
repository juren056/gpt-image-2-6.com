import assert from 'node:assert/strict';

import { sitemapLastModified } from '../src/config/sitemap-updates';

assert.equal(sitemapLastModified('', '2026-10-10'), '2026-10-12');
assert.equal(sitemapLastModified('/', '2026-10-10'), '2026-10-12');
assert.equal(sitemapLastModified('/pricing', '2026-10-10'), '2026-10-11');
assert.equal(sitemapLastModified('/models', '2026-10-06'), '2026-10-12');
assert.equal(sitemapLastModified('/nano-banana-2', '2026-10-06'), '2026-10-12');
assert.equal(
  sitemapLastModified('/nano-banana-pro', '2026-10-10'),
  '2026-10-10'
);
assert.equal(sitemapLastModified('/contact', '2026-09-01'), '2026-09-01');
assert.equal(sitemapLastModified('/contact'), undefined);
assert.equal(
  sitemapLastModified('/blog/example', '2026-10-09T12:00:00Z'),
  '2026-10-09T12:00:00Z'
);
assert.equal(
  sitemapLastModified('/', '2026-10-13T12:00:00Z'),
  '2026-10-13T12:00:00Z'
);
console.log(
  'Sitemap freshness: known updates, unchanged paths and later dates passed.'
);
