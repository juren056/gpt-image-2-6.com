import assert from 'node:assert/strict';
import {
  cp,
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, '.output');
const catalog = JSON.parse(
  await readFile(
    path.join(source, 'public/data/prompt-library-v1.json'),
    'utf8'
  )
).data;
const manifest = JSON.parse(
  await readFile('public/data/prompt-library-v1.json', 'utf8')
).data;
assert.equal(
  catalog.revision,
  manifest.revision,
  'Build catalog must match source catalog'
);
assert.equal(catalog.total, manifest.total);
assert(catalog.total >= 100);
const config = JSON.parse(
  await readFile(path.join(source, 'server/wrangler.json'), 'utf8')
);
assert.equal(config.name, 'nanobanana21pro-com');
assert.equal(config.vars.VITE_APP_URL, 'https://nanobanana21pro.com');
assert(
  config.routes.every(
    (route) => route.pattern === 'nanobanana21pro.com' && route.custom_domain
  )
);
assert.equal(
  config.d1_databases[0].database_id,
  '342759c0-6eec-465f-a80c-717c500ab546'
);
assert.equal(config.d1_databases[0].database_name, 'nanobanana21pro-db');
const html = await readFile(path.join(source, 'public/prompts.html'), 'utf8');
assert(
  html.includes('Product campaign contact sheet'),
  'Latest curated library must be in static HTML'
);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert(!html.includes('noindex'), 'Public prompt gallery must be indexable');
const destination = path.join(
  root,
  `.artifacts/prompt-research/release-${catalog.revision}`
);
assert(destination.startsWith(root + path.sep));
await mkdir(destination, { recursive: true });
await cp(path.join(source, 'server'), path.join(destination, 'server'), {
  recursive: true,
});
await cp(path.join(source, 'public'), path.join(destination, 'public'), {
  recursive: true,
});
// Preserve old content-hashed browser files for users with already-open tabs.
// Only cached JS/CSS/font assets are merged; old HTML, routes and brand icons are not.
const previous = path.join(root, '.artifacts/account/open-commerce-release');
const previousConfig = JSON.parse(
  await readFile(path.join(previous, 'wrangler.json'), 'utf8')
);
assert.equal(previousConfig.name, config.name);
assert.equal(
  previousConfig.d1_databases[0].database_id,
  config.d1_databases[0].database_id
);
let retained = 0;
for (const file of await readdir(path.join(previous, 'public/assets'))) {
  const target = path.join(destination, 'public/assets', file);
  try {
    await stat(target);
  } catch {
    await cp(path.join(previous, 'public/assets', file), target);
    retained++;
  }
}
const releaseConfig = {
  ...config,
  main: 'server/index.mjs',
  assets: { directory: 'public', binding: 'ASSETS' },
  no_bundle: true,
  find_additional_modules: true,
  rules: [
    { type: 'ESModule', globs: ['**/*.mjs'], fallthrough: true },
    { type: 'CompiledWasm', globs: ['**/*.wasm'], fallthrough: true },
  ],
};
delete releaseConfig.keep_assets;
await writeFile(
  path.join(destination, 'wrangler.json'),
  JSON.stringify(releaseConfig, null, 2)
);
console.log(
  JSON.stringify({
    releaseConfig: path.join(destination, 'wrangler.json'),
    name: config.name,
    domain: config.vars.VITE_APP_URL,
    prompts: catalog.total,
    retainedBrowserAssets: retained,
  })
);
