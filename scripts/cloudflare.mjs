import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

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

if (process.argv.includes('--prebuilt')) {
  // Retry an interrupted upload without rebuilding the already checked bundle.
  const config = JSON.parse(
    readFileSync('.output/server/wrangler.json', 'utf8')
  );
  if (!config.d1_databases && !config.hyperdrive) {
    throw new Error(
      'The prepared build is missing Cloudflare database bindings.'
    );
  }
} else {
  run('scripts/db-setup.mjs', []);
  run('node_modules/vite/bin/vite.js', ['build']);
}
if (process.argv[2] === 'deploy') {
  run('node_modules/wrangler/bin/wrangler.js', ['deploy']);
}
