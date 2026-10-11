import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { NANO_SITE_PAGES } from '../src/config/nano-site';

const messages = Object.fromEntries(
  ['en', 'zh'].map((locale) => [
    locale,
    JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Record<
      string,
      string
    >,
  ])
);
for (const locale of ['en', 'zh']) {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const [id, page] of Object.entries(NANO_SITE_PAGES)) {
    const keys = [
      'title',
      'description',
      'heading',
      'intro',
      ...Array.from({ length: page.sections }, (_, i) => [
        `section_${i}.title`,
        `section_${i}.body`,
      ]).flat(),
      ...Array.from({ length: page.faqs }, (_, i) => [
        `faq_${i}.question`,
        `faq_${i}.answer`,
      ]).flat(),
    ];
    for (const key of keys) {
      const value = messages[locale][`nano_site.${id}.${key}`];
      assert(value?.trim(), `${locale}/${id}: missing ${key}`);
      assert(
        !/qwen|gemini 3\.6|2026-10-29/i.test(value),
        `${locale}/${id}: excluded claim in ${key}`
      );
    }
    const title = messages[locale][`nano_site.${id}.title`];
    const description = messages[locale][`nano_site.${id}.description`];
    assert(!titles.has(title), `${locale}: duplicate title`);
    assert(!descriptions.has(description), `${locale}: duplicate description`);
    titles.add(title);
    descriptions.add(description);
  }
}
const aliases = {
  '/vs-pro': '/posts/nano-banana-21-vs-pro',
  '/how-to-use': '/guide',
  '/migration': '/guide/nano-banana-2-to-2-1',
  '/maker': '/editor',
  '/claude': '/mcp',
};
const base = process.argv[2];
if (base) {
  const sitemap = await (await fetch(new URL('/sitemap.xml', base))).text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1]).pathname
  );
  assert.equal(
    new Set(locations).size,
    locations.length,
    'Sitemap has duplicate locations'
  );
  const titles = new Set<string>();
  const checks = Object.values(NANO_SITE_PAGES).flatMap((page) =>
    ['en', 'zh'].map((locale) => ({ page, locale }))
  );
  for (let start = 0; start < checks.length; start += 3) {
    await Promise.all(
      checks.slice(start, start + 3).map(async ({ page, locale }) => {
        const path = `${locale === 'zh' ? '/zh' : ''}${page.path}`;
        const response = await fetch(new URL(path, base));
        assert.equal(response.status, 200, `${path}: HTTP status`);
        const html = await response.text();
        assert.equal(
          (html.match(/<h1(?:\s|>)/g) || []).length,
          1,
          `${path}: H1 count`
        );
        const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
        assert(title, `${path}: title missing`);
        assert(!titles.has(title), `${path}: duplicate rendered title`);
        titles.add(title);
        const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0];
        const href = canonical?.match(/href="([^"]+)"/)?.[1];
        assert(href, `${path}: canonical missing`);
        assert.equal(
          new URL(href).pathname.replace(/\/$/, ''),
          path.replace(/\/$/, ''),
          `${path}: canonical path`
        );
        assert(
          /<meta\b[^>]*name="description"[^>]*content="[^"]+"/.test(html),
          `${path}: description missing`
        );
        assert(
          /hreflang="zh-Hans"/.test(html) && /hreflang="en"/.test(html),
          `${path}: alternates missing`
        );
        assert(/application\/ld\+json/.test(html), `${path}: schema missing`);
        assert(
          !/<meta[^>]*name="robots"[^>]*content="noindex/.test(html),
          `${path}: unexpected noindex`
        );
        assert(
          locations.some(
            (entry) => entry.replace(/\/$/, '') === path.replace(/\/$/, '')
          ),
          `${path}: missing from sitemap`
        );
      })
    );
  }
  for (const [alias, target] of Object.entries(aliases)) {
    for (const prefix of ['', '/zh']) {
      const response = await fetch(
        new URL(`${prefix}${alias}?ref=editorial`, base),
        { redirect: 'manual' }
      );
      assert.equal(
        response.status,
        301,
        `${prefix}${alias}: permanent redirect`
      );
      assert.equal(
        response.headers.get('location'),
        `${prefix}${target}?ref=editorial`,
        `${prefix}${alias}: redirect target`
      );
      assert(
        !locations.includes(`${prefix}${alias}`),
        `${alias}: alias in sitemap`
      );
    }
  }
  const robots = await (await fetch(new URL('/robots.txt', base))).text();
  assert(/Sitemap:/.test(robots), 'Robots sitemap declaration');
  console.log(
    'HTTP passed: 42 EN/ZH pages, metadata, canonical/hreflang, one H1, schemas, sitemap and 10 permanent redirects.'
  );
}
console.log(
  'Editorial passed: 21 pages with complete, unique EN/ZH copy and no excluded claims.'
);
