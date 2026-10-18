import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

// Load production settings before Vite or db-setup can load local defaults.
if (existsSync('.env.production')) {
  for (const line of readFileSync('.env.production', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}
process.env.NODE_ENV = 'production';
process.env.NITRO_PRESET = 'cloudflare_module';

function run(entry, args) {
  const result = spawnSync(process.execPath, [entry, ...args], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('scripts/generate-dynamic-message-lookups.mjs', ['--check']);
run(
  'scripts/verify-homepage-baseline.mjs',
  process.argv.includes('--prebuilt') ? ['--built'] : []
);
if (process.argv.includes('--prebuilt')) {
  // Retry an interrupted upload without rebuilding the already checked bundle.
  const config = JSON.parse(
    readFileSync(
      `${process.env.NITRO_OUTPUT_DIR || '.output'}/server/wrangler.json`,
      'utf8'
    )
  );
  if (!config.d1_databases && !config.hyperdrive) {
    throw new Error(
      'The prepared build is missing Cloudflare database bindings.'
    );
  }
} else {
  run('scripts/db-setup.mjs', []);
  run('node_modules/vite/bin/vite.js', ['build']);
  run('scripts/prerender-public.mjs', []);
  run('scripts/verify-homepage-baseline.mjs', ['--built']);
}
if (process.argv[2] === 'deploy') {
  const productionConfig = JSON.parse(
    readFileSync(
      `${process.env.NITRO_OUTPUT_DIR || '.output'}/server/wrangler.json`,
      'utf8'
    )
  );
  if (
    !productionConfig.r2_buckets?.some(
      (bucket) =>
        bucket.binding === 'IMAGE_BUCKET' &&
        bucket.bucket_name === 'nanobanana21pro-uploads'
    )
  ) {
    throw new Error(
      'Deployment blocked: the production image upload bucket is missing or belongs to another site'
    );
  }
  const releaseConfigIndex = process.argv.indexOf('--release-config');
  const releaseConfigPath =
    releaseConfigIndex >= 0 ? process.argv[releaseConfigIndex + 1] : undefined;
  if (releaseConfigIndex >= 0 && !releaseConfigPath)
    throw new Error('Missing release config path');
  if (releaseConfigPath) {
    const release = JSON.parse(readFileSync(releaseConfigPath, 'utf8'));
    run('scripts/verify-homepage-baseline.mjs', [
      '--built',
      '--public-dir',
      path.resolve(path.dirname(releaseConfigPath), release.assets.directory),
    ]);
    const generated = JSON.parse(
      readFileSync(
        `${process.env.NITRO_OUTPUT_DIR || '.output'}/server/wrangler.json`,
        'utf8'
      )
    );
    if (
      release.name !== generated.name ||
      JSON.stringify(release.routes) !== JSON.stringify(generated.routes) ||
      JSON.stringify(release.d1_databases) !==
        JSON.stringify(generated.d1_databases) ||
      JSON.stringify(release.r2_buckets) !==
        JSON.stringify(generated.r2_buckets) ||
      release.vars.VITE_APP_URL !== generated.vars.VITE_APP_URL
    ) {
      throw new Error(
        'Prepared release identity does not match this project build'
      );
    }
  }
  run(
    'node_modules/wrangler/bin/wrangler.js',
    releaseConfigPath ? ['deploy', '--config', releaseConfigPath] : ['deploy']
  );
}
