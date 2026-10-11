import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

import {
  filterPromptExamples,
  promptHandoff,
  type PromptCatalog,
} from '../src/lib/prompt-library';

const catalog: PromptCatalog = JSON.parse(
  await readFile('public/data/prompt-library-v1.json', 'utf8')
).data;
assert(catalog.total >= 100, 'Minimum 100 paired examples');
assert.equal(catalog.total, catalog.items.length);
assert.equal(new Set(catalog.items.map((item) => item.id)).size, catalog.total);
assert.equal(
  new Set(catalog.items.map((item) => item.sourceUrl)).size,
  catalog.total,
  'Each example must have its own source publication'
);
assert.equal(
  new Set(
    catalog.items.map(
      (item) => (item as typeof item & { imageSha256: string }).imageSha256
    )
  ).size,
  catalog.total,
  'Do not inflate the count by repeating one image'
);
assert.equal(
  new Set(
    catalog.items.map((item) =>
      item.prompt.toLowerCase().replace(/\s+/g, ' ').trim()
    )
  ).size,
  catalog.total
);
assert.equal(
  Object.values(catalog.categories).reduce((sum, count) => sum + count, 0),
  catalog.total
);
let bytes = 0;
for (const item of catalog.items) {
  assert(item.author && item.sourceUrl && item.collectionUrl);
  assert.equal(item.license, 'CC BY 4.0');
  assert(item.licenseUrl.startsWith('https://creativecommons.org/'));
  assert(item.changes);
  assert(item.prompt.length <= 32000);
  assert(
    /^\/imgs\/prompt-library\/originals\/prompt-[a-f0-9]{16}\.(jpg|png|webp)$/.test(
      item.originalImage
    )
  );
  assert(
    /^\/imgs\/prompt-library\/previews\/prompt-[a-f0-9]{16}\.webp$/.test(
      item.image
    )
  );
  const original = await readFile(`public${item.originalImage}`);
  const image = await sharp(original).metadata();
  assert.equal(image.width, item.width);
  assert.equal(image.height, item.height);
  const preview = await sharp(await readFile(`public${item.image}`)).metadata();
  assert.equal(preview.format, 'webp');
  assert(Math.max(preview.width!, preview.height!) <= 600);
  const record = item as typeof item & { imageSha256: string };
  assert.equal(
    createHash('sha256').update(original).digest('hex'),
    record.imageSha256,
    'Original image bytes must be retained'
  );
  assert.equal(
    promptHandoff(item).operation,
    item.referenceRequired ? 'edit' : 'generate'
  );
  assert.deepEqual(
    promptHandoff(item).imageUrls,
    [],
    'Example outputs are not automatically uploaded as user references'
  );
  bytes += original.byteLength;
}
const base = {
  search: '',
  category: 'all',
  operation: 'all',
  model: 'all',
  favoritesOnly: false,
  sort: 'featured',
};
for (const [category, count] of Object.entries(catalog.categories))
  assert.equal(
    filterPromptExamples(catalog.items, { ...base, category }, []).length,
    count
  );
const sample = catalog.items[0];
assert.equal(
  filterPromptExamples(catalog.items, { ...base, favoritesOnly: true }, [
    sample.id,
  ])[0].id,
  sample.id
);
assert.equal(
  filterPromptExamples(catalog.items, { ...base, favoritesOnly: true }, [])
    .length,
  0
);
assert.equal(
  filterPromptExamples(
    catalog.items,
    { ...base, search: 'xyzw-does-not-exist-9428' },
    []
  ).length,
  0
);
assert(
  filterPromptExamples(
    catalog.items,
    { ...base, search: sample.author },
    []
  ).some((item) => item.id === sample.id)
);
const edits = filterPromptExamples(
  catalog.items,
  { ...base, operation: 'edit' },
  []
);
assert(edits.length && edits.every((item) => item.referenceRequired));
const newest = filterPromptExamples(
  catalog.items,
  { ...base, sort: 'newest' },
  []
);
for (let i = 1; i < newest.length; i++)
  assert(
    (Date.parse(newest[i - 1].date) || 0) >= (Date.parse(newest[i].date) || 0),
    'Mixed date formats must sort chronologically'
  );
console.log(
  JSON.stringify({
    verified: catalog.total,
    categories: catalog.categories,
    originalsMiB: Math.round(bytes / 1024 / 1024),
    referencesRequired: edits.length,
  })
);
