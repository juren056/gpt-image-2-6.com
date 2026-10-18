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
  '/wan-3-0',
  '/seedance-2-5-draft-mode',
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
// A representation link is not an additional English language variant.
const markdownHead = seoHead({
  locale: 'en',
  path: '/',
  title: 'Image workspace',
  description: 'Image generation and editing.',
  markdownPath: '/index.md',
});
assert.equal(
  markdownHead.links.filter(
    (item) => 'hreflang' in item && item.hreflang === 'en'
  ).length,
  1
);
const markdownLink = markdownHead.links.find(
  (item) => 'type' in item && item.type === 'text/markdown'
);
assert(markdownLink && !('hreflang' in markdownLink));
console.log(
  `Search policy passed: ${SEARCH_EXCLUDED_PATHS.size} legacy paths × ${locales.length} locales; 9 public paths × 2 reviewed locales.`
);
