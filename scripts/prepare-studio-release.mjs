import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
const build = path.resolve(process.env.NITRO_OUTPUT_DIR || '.output');
const config = JSON.parse(
  await readFile(path.join(build, 'server/wrangler.json'), 'utf8')
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
assert(
  config.r2_buckets?.some(
    (bucket) =>
      bucket.binding === 'IMAGE_BUCKET' &&
      bucket.bucket_name === 'nanobanana21pro-uploads'
  ),
  'The production image upload bucket must be retained in every release'
);
const catalog = JSON.parse(
  await readFile(path.join(build, 'public/data/prompt-library-v1.json'), 'utf8')
).data;
assert.equal(
  catalog.revision,
  JSON.parse(await readFile('public/data/prompt-library-v1.json', 'utf8')).data
    .revision
);
assert.equal(catalog.total, 1488);
const hash = createHash('sha256');
for (const file of [
  'src/blocks/studio-desk.tsx',
  'src/components/dedicated-tool-workspace.tsx',
  'src/components/studio-tool-stage.tsx',
  'src/lib/studio-desk.ts',
  'src/styles/studio-desk.css',
  'docs/homepage-baseline.json',
])
  hash.update(await readFile(file));
// A checkout/backend-only change must also produce a new immutable release.
// The built entry references the versioned server/client chunks for this build.
hash.update(await readFile(path.join(build, 'server/index.mjs')));
const releaseId = hash.digest('hex').slice(0, 12);
const destination = path.join(
  root,
  '.artifacts/studio-redesign',
  `release-${releaseId}`
);
assert(destination.startsWith(root + path.sep));
await mkdir(destination, { recursive: true });
await cp(path.join(build, 'server'), path.join(destination, 'server'), {
  recursive: true,
});
await cp(path.join(build, 'public'), path.join(destination, 'public'), {
  recursive: true,
});
const previous = path.join(
  root,
  `.artifacts/prompt-research/release-${catalog.revision}`
);
const previousConfig = JSON.parse(
  await readFile(path.join(previous, 'wrangler.json'), 'utf8')
);
assert.equal(previousConfig.name, config.name);
assert.equal(
  previousConfig.d1_databases[0].database_id,
  config.d1_databases[0].database_id
);
let retained = 0;
const previousReleases = [previous];
try {
  const lastConfigPath = (
    await readFile('.artifacts/studio-redesign/release-config-path.txt', 'utf8')
  ).trim();
  const lastRelease = path.dirname(path.resolve(lastConfigPath));
  const allowedPrefix = path.join(root, '.artifacts/studio-redesign/release-');
  assert(
    lastRelease.startsWith(allowedPrefix),
    'Previous studio release must stay within this workspace'
  );
  const lastConfig = JSON.parse(await readFile(lastConfigPath, 'utf8'));
  assert.equal(lastConfig.name, config.name);
  assert.equal(
    lastConfig.d1_databases[0].database_id,
    config.d1_databases[0].database_id
  );
  if (lastRelease !== destination) previousReleases.push(lastRelease);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
for (const previousRelease of previousReleases) {
  for (const file of await readdir(
    path.join(previousRelease, 'public/assets')
  )) {
    const target = path.join(destination, 'public/assets', file);
    try {
      await stat(target);
    } catch {
      await cp(path.join(previousRelease, 'public/assets', file), target);
      retained++;
    }
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
const releaseConfigPath = path.join(destination, 'wrangler.json');
await writeFile(releaseConfigPath, JSON.stringify(releaseConfig, null, 2));
await writeFile(
  '.artifacts/studio-redesign/release-config-path.txt',
  releaseConfigPath
);
console.log(
  JSON.stringify({
    releaseId,
    releaseConfig: releaseConfigPath,
    name: config.name,
    domain: config.vars.VITE_APP_URL,
    prompts: catalog.total,
    retainedBrowserAssets: retained,
  })
);
