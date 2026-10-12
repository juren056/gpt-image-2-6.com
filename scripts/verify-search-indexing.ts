import assert from 'node:assert/strict';

import {
  isSearchExcludedPath,
  SEARCH_EXCLUDED_PATHS,
} from '../src/config/search-indexing';
import { seoHead } from '../src/lib/seo';
import { locales } from '../src/paraglide/runtime.js';

for (const path of SEARCH_EXCLUDED_PATHS) {
  assert(isSearchExcludedPath(`${path}/`));
  for (const locale of locales) {
    const head = seoHead({
      locale,
      path,
      title: 'Legacy video workspace',
      description: 'Existing video functionality remains accessible.',
    });
    assert(
      head.meta.some(
        (item) =>
          'name' in item &&
          item.name === 'robots' &&
          item.content === 'noindex, follow'
      )
    );
    assert.equal(
      head.links.filter((item) => item.rel === 'alternate').length,
      0
    );
    const canonical = head.links.find((item) => item.rel === 'canonical');
    assert(
      canonical?.href.endsWith(path),
      'Excluded pages must retain their own canonical, not point to the homepage'
    );
  }
}
for (const path of [
  '/',
  '/nano-banana-pro',
  '/ai-image-generator',
  '/ai-image-editor',
  '/ai-image-upscaler',
  '/image-background-remover',
  '/prompts',
]) {
  assert(!isSearchExcludedPath(path));
  for (const locale of ['en', 'zh']) {
    const head = seoHead({
      locale,
      path,
      title: 'Image workspace',
      description: 'Image generation and editing.',
    });
    assert(!head.meta.some((item) => 'name' in item && item.name === 'robots'));
    assert.equal(
      head.links.filter((item) => item.rel === 'alternate').length,
      3
    );
  }
}
console.log(
  `Search policy passed: ${SEARCH_EXCLUDED_PATHS.size} legacy paths × ${locales.length} locales; 7 image paths × 2 reviewed locales.`
);
