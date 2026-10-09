import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const settings = JSON.parse(
  await readFile('project.inlang/settings.json', 'utf8')
);
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:4319';
const path = '/remove-matcha-filter';

const slug = (locale) => (locale === 'zh-TW' ? 'zh-tw' : locale);

await Promise.all(
  settings.locales.map(async (locale) => {
    const prefix = locale === settings.baseLocale ? '' : `/${slug(locale)}`;
    const response = await fetch(`${origin}${prefix}${path}`, {
      signal: AbortSignal.timeout(30_000),
    });
    assert.equal(response.status, 200, `${locale} tool route must return 200`);
    const html = await response.text();
    assert.match(html, new RegExp(`<html lang="${locale}"`));
    assert.doesNotMatch(html, /\?{3,}/, `${locale} contains corrupted copy`);
  })
);

await Promise.all(
  settings.locales
    .filter((candidate) => candidate !== settings.baseLocale)
    .map(async (locale) => {
      const prefix = `/${slug(locale)}`;
      const response = await fetch(`${origin}${prefix}/`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(30_000),
      });
      assert.equal(
        response.status,
        308,
        `${locale} slash redirect must be permanent`
      );
      assert.equal(response.headers.get('location'), prefix);
    })
);

console.log(`Verified ${settings.locales.length} localized tool routes.`);
