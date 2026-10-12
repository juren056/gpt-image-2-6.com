import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

// This committed file contains resource identities and public vars, never keys.
// Runtime secrets remain on the existing Worker and provider keys stay in D1.
const config = JSON.parse(await readFile('wrangler.production.json', 'utf8'));
if (!existsSync('wrangler.jsonc'))
  await copyFile('wrangler.production.json', 'wrangler.jsonc');
for (const [name, value] of Object.entries(config.vars))
  process.env[name] = value;
process.env.NODE_ENV = 'production';

function run(args) {
  const result = spawnSync(
    process.execPath,
    ['scripts/cloudflare.mjs', ...args],
    {
      stdio: 'inherit',
      env: process.env,
    }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const output = path.resolve(process.env.NITRO_OUTPUT_DIR || '.output');
async function verifyIdentity() {
  const generated = JSON.parse(
    await readFile(path.join(output, 'server/wrangler.json'), 'utf8')
  );
  for (const key of ['name', 'routes', 'd1_databases', 'r2_buckets'])
    assert.deepEqual(
      generated[key],
      config[key],
      `Unexpected production ${key}`
    );
  for (const [key, value] of Object.entries(config.vars))
    assert.equal(generated.vars[key], value, `Unexpected production ${key}`);
}

const command = process.argv[2];
if (command === 'build') {
  run(['build']);
  await verifyIdentity();
  // Keep module paths and named functions while reducing upload size. The
  // earlier uncompressed module upload was repeatedly reset on the network.
  const viteRequire = createRequire(import.meta.resolve('vite/package.json'));
  const { transform } = viteRequire('esbuild');
  async function minify(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await minify(file);
      else if (entry.name.endsWith('.mjs')) {
        const result = await transform(await readFile(file, 'utf8'), {
          loader: 'js',
          format: 'esm',
          target: 'es2022',
          minify: true,
          keepNames: true,
          legalComments: 'inline',
          sourcefile: entry.name,
        });
        await writeFile(file, result.code);
      }
    }
  }
  await minify(path.join(output, 'server'));
  console.log('Production identity verified; Worker modules minified.');
} else if (command === 'deploy') {
  await verifyIdentity();
  run(['deploy', '--prebuilt']);
} else {
  throw new Error('Expected build or deploy');
}
