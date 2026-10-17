import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(
  await readFile('public/data/prompt-library-v1.json', 'utf8')
).data;

const items = source.items
  .map((item) => ({
    id: item.id,
    title: item.title,
    image: item.image,
    width: item.width,
    height: item.height,
    category: item.category,
    sourceModel: item.sourceModel,
    kind: 'community',
  }))
  .sort((left, right) => {
    const key = (id) =>
      createHash('sha256').update(`${source.revision}:${id}`).digest('hex');
    return key(left.id).localeCompare(key(right.id));
  });

const payload = {
  code: 0,
  message: 'ok',
  data: {
    revision: `${source.revision}-homepage-v1`,
    total: items.length,
    items,
  },
};

await writeFile(
  'public/data/homepage-showcase-v1.json',
  `${JSON.stringify(payload)}\n`
);
console.log(`Wrote ${items.length} lightweight homepage showcase items.`);
