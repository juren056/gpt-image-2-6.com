import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { bananaText } from '../../src/blocks/banana-messages';

const source = readFileSync('src/blocks/banana-home.tsx', 'utf8');
const list = source
  .split('export const BANANA_GENERATOR_KEYS = [')[1]
  ?.split('] as const;')[0];
assert(list);
const keys = [...list.matchAll(/'([^']+)'/g)].map((match) => match[1]);
for (const locale of ['en', 'zh'])
  for (const key of keys)
    assert(bananaText(key, locale).trim(), locale + '/' + key);
console.log('All generator copy accessors resolve in English and Chinese.');
