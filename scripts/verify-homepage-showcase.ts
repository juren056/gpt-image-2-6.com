import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

import {
  mixHomepageShowcase,
  wrapShowcaseIndex,
  type SiteTestShowcaseItem,
} from '../src/lib/homepage-showcase';

const payload = JSON.parse(
  await readFile('public/data/homepage-showcase-v1.json', 'utf8')
);
const catalog = payload.data;

assert.equal(payload.code, 0, 'Showcase JSON must use the public API envelope');
assert.equal(catalog.total, 1488, 'Showcase must include all community items');
assert.equal(catalog.items.length, 1488);
assert.equal(
  new Set(catalog.items.map((item: { id: string }) => item.id)).size,
  1488
);
assert(
  catalog.items.every(
    (item: Record<string, unknown>) =>
      item.kind === 'community' &&
      typeof item.image === 'string' &&
      !('author' in item) &&
      !('authorUrl' in item) &&
      !('prompt' in item) &&
      !('originalImage' in item) &&
      !('sourceUrl' in item)
  ),
  'Homepage index must stay lightweight and contain no prompt bodies or originals'
);
assert((await stat('public/data/homepage-showcase-v1.json')).size < 500_000);

const siteTest = {
  id: 'site-test',
  title: 'Site test',
  image: '/test.webp',
  width: 1,
  height: 1,
  category: 'test',
  sourceModel: 'Nano Banana 2.1',
  kind: 'site-test',
  originalOutput: '/test.png',
  prompt: 'test',
  operation: 'generate',
  resolution: '1K',
  inputs: [],
} satisfies SiteTestShowcaseItem;
const mixed = mixHomepageShowcase(catalog.items, [siteTest]);
assert.equal(mixed.length, 1489);
assert.equal(mixed[0].id, siteTest.id);
assert.equal(wrapShowcaseIndex(-1, mixed.length), mixed.length - 1);
assert.equal(wrapShowcaseIndex(mixed.length, mixed.length), 0);

console.log('Homepage showcase manifest, mixing, and wrapping verified.');
