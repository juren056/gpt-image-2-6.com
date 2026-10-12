import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';

const baseline = JSON.parse(await readFile('docs/homepage-baseline.json', 'utf8'));
for (const [file, expected] of Object.entries(baseline.files)) {
  const actual = createHash('sha256').update(await readFile(file)).digest('hex');
  assert.equal(actual, expected, `Homepage baseline changed: ${file}. Review the homepage with the owner before updating the baseline.`);
}
for (const [locale, expected] of Object.entries(baseline.copy)) {
  const messages = JSON.parse(await readFile(`messages/${locale}.json`, 'utf8'));
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(messages[key], value, `Homepage copy changed: ${locale}/${key}`);
  }
}
if (process.argv.includes('--built')) {
  const directoryIndex = process.argv.indexOf('--public-dir');
  if (directoryIndex >= 0) assert(process.argv[directoryIndex + 1], 'Missing public artifact directory');
  const publicDir = directoryIndex >= 0 ? path.resolve(process.argv[directoryIndex + 1]) : path.resolve(process.env.NITRO_OUTPUT_DIR || '.output', 'public');
  const html = await readFile(path.join(publicDir, 'index.html'), 'utf8');
  for (const name of ['feature-references', 'feature-text', 'feature-ratios', 'case-product', 'case-character', 'case-localize', 'case-social']) {
    assert(html.includes(`/images/banana21/${name}.webp`), `Built homepage missing approved photograph: ${name}`);
    assert(!html.includes(`/images/workflows/${name}.svg`), `Rejected illustration returned to built homepage: ${name}`);
    const imageFile = `public/images/banana21/${name}.webp`;
    const imageHash = createHash('sha256').update(await readFile(path.join(publicDir, 'images/banana21', `${name}.webp`))).digest('hex');
    assert.equal(imageHash, baseline.files[imageFile], `Built homepage photograph changed: ${name}`);
  }
  assert(html.includes(baseline.copy.en['banana.features.heading']), 'Built homepage heading does not match approved baseline');
  if (baseline.generatorReference) {
    assert(html.includes('role="radio" aria-label="×4"'), 'Built generator is missing the reviewed four-output control');
    assert(html.includes(baseline.copy.en['banana.studio_title']), 'Built generator contains the old studio card');
    assert((html.match(/class="banana-model-selected"/g) || []).length >= 5, 'Built model table is missing the full highlighted column');
    const stylesheetPaths = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"|<link[^>]*href="([^"]+)"[^>]*rel="stylesheet"/g)].map(match => match[1] || match[2]).filter(value => value.startsWith('/assets/'));
    const stylesheets = (await Promise.all(stylesheetPaths.map(value => readFile(path.join(publicDir, value.split('?')[0]), 'utf8')))).join('').replace(/\s/g, '');
    assert(stylesheets.includes('--font-ui:ui-sans-serif,system-ui,sans-serif'), 'Built homepage still contains the old primary font stack');
  }
  if (baseline.originalExamples) {
    assert(html.includes('banana-generator__example-grid'), 'Built generator lost the approved original example layout');
    assert(html.includes(baseline.copy.en['banana.example_label']), 'Built generator lost the example disclosure');
    assert(html.includes(`?v=${baseline.originalExamples.revision}`), 'Built homepage uses an older image revision');
  }
  if (baseline.generatorOptions) {
    assert(html.includes('banana-generator__ratio-grid'), 'Built generator lost the inline ratio controls');
    assert(html.includes('banana-generator__resolution-grid'), 'Built generator lost the selectable resolutions');
    for (const resolution of Object.keys(baseline.generatorOptions.resolutionCredits)) {
      assert(html.includes(`role="radio" data-value="${resolution}" aria-label="${resolution}"`), `Built generator missing resolution: ${resolution}`);
    }
    assert(html.includes('aria-label="Model" aria-expanded="false"'), 'Built generator lost the inline model picker');
  }
  if (baseline.characterReplacement) {
    assert(html.includes(`/images/banana21/case-character.webp?v=${baseline.characterReplacement.revision}`), 'Built homepage contains the old character image URL');
    assert(html.includes(baseline.copy.en['banana.cases.1.alt']), 'Built homepage contains the old character description');
  }
  if (baseline.cardPolish) {
    for (const className of ['banana-steps-section', 'banana-step-topline', 'banana-model-topline', 'banana-comparison-visual', 'banana-capability-grid', 'banana-capability-artwork']) {
      assert(html.includes(className), `Built homepage lost the reviewed card design: ${className}`);
    }
    assert.equal((html.match(/class="banana-step-card"/g) || []).length, 4, 'Built homepage lost the four-step sequence');
    assert.equal((html.match(/class="banana-capability-card banana-capability-card-/g) || []).length, 4, 'Built homepage lost a creative capability card');
    const stylesheetPaths = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"|<link[^>]*href="([^"]+)"[^>]*rel="stylesheet"/g)].map(match => match[1] || match[2]).filter(value => value.startsWith('/assets/'));
    const stylesheets = (await Promise.all(stylesheetPaths.map(value => readFile(path.join(publicDir, value.split('?')[0]), 'utf8')))).join('').replace(/\s/g, '');
    assert(stylesheets.includes('prefers-reduced-motion:reduce'), 'Built homepage lost reduced-motion support');
    assert(stylesheets.includes('banana-card-entry'), 'Built homepage lost reviewed card entry motion');
  }
  if (baseline.capabilityGallery) {
    assert(!html.includes('banana-capability-sketch'), 'Rejected capability line art returned');
    assert.equal((html.match(/class="banana-capability-action"/g) || []).length, 4, 'Capability example actions are missing');
    for (const file of baseline.capabilityGallery.assets) {
      const assetPath = file.replace(/^public\//, '/');
      const builtHash = createHash('sha256').update(await readFile(path.join(publicDir, assetPath))).digest('hex');
      assert.equal(builtHash, baseline.files[file], `Capability artwork differs from the reviewed source: ${file}`);
      if (!file.includes('-source-')) assert(html.includes(assetPath), `Capability artwork missing from homepage: ${file}`);
    }
    assert(html.includes(baseline.copy.en['banana.capabilities.before']), 'Capability source label missing');
    assert(html.includes(baseline.copy.en['banana.capabilities.after']), 'Capability result label missing');
  }
}
console.log('Approved homepage source, copy and image baseline verified.');
