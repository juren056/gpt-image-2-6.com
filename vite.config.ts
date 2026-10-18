import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import mdx from '@mdx-js/rollup';
import { sentryTanstackStart } from '@sentry/tanstackstart-react/vite';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

import { directMessageImports } from './scripts/direct-message-imports';
import { loadEnvFiles } from './src/lib/env';

// Populate process.env from .env.local / .env.{NODE_ENV} / .env for the
// dev server and build process (Vite only exposes VITE_* via import.meta.env;
// server code reads secrets from process.env). In production, env comes
// from the actual host/container environment.
loadEnvFiles();

// Cloudflare Workers build (pnpm cf:build / cf:deploy): stub out unused DB
// drivers — mysql2 crashes workerd at module evaluation (node:net,
// node:process requires); postgres.js runs fine under nodejs_compat but is
// dead weight when the backend is D1. Which driver the bundle keeps follows
// wrangler.jsonc `vars.DATABASE_PROVIDER` (the runtime truth on workerd) —
// d1 stubs both, postgresql keeps postgres.js for the Hyperdrive binding.
const isCloudflareBuild = (process.env.NITRO_PRESET || '').includes(
  'cloudflare'
);
const driverStub = new URL('./src/core/db/driver-stub.ts', import.meta.url)
  .pathname;
// Resolve from better-auth's dependency tree, including a clean pnpm install.
const betterAuthRequire = createRequire(import.meta.resolve('better-auth'));

// Prefer wrangler.jsonc over the build-time env, which can be polluted by
// .env.local (e.g. DATABASE_PROVIDER=sqlite for local dev).
function workersDbProvider(): string {
  try {
    const raw = readFileSync(
      new URL('./wrangler.jsonc', import.meta.url),
      'utf8'
    );
    const m = raw.match(/"DATABASE_PROVIDER"\s*:\s*"([^"]+)"/);
    if (m) return m[1];
  } catch {
    // no wrangler.jsonc yet (fresh clone) — fall through
  }
  return process.env.DATABASE_PROVIDER || 'd1';
}

const workersDb = isCloudflareBuild ? workersDbProvider() : '';
const keepPostgres = workersDb === 'postgresql' || workersDb === 'postgres';

export default defineConfig(({ command }) => ({
  server: {
    port: 3000,
    watch: {
      ignored: ['**/.artifacts/**', '**/.wrangler/**', '**/.output/**'],
    },
  },
  resolve: {
    tsconfigPaths: true,
    alias: isCloudflareBuild
      ? {
          mysql2: driverStub,
          ...(keepPostgres ? {} : { postgres: driverStub }),
        }
      : {},
  },
  plugins: [
    // MDX must run before the react plugin so JSX in compiled MDX gets transformed.
    { enforce: 'pre', ...mdx({ providerImportSource: '@mdx-js/react' }) },
    tailwindcss(),
    directMessageImports(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      // Small message modules let production routes load only their own copy.
      // Keep fewer locale modules for the development server's rebuild cost.
      outputStructure:
        command === 'build' ? 'message-modules' : 'locale-modules',
      cookieName: 'PARAGLIDE_LOCALE',
      strategy: ['url', 'cookie', 'baseLocale'],
      urlPatterns: [
        // The exact /api page is an editorial guide, not a server endpoint.
        {
          pattern: '/api',
          localized: [
            ['en', '/api'],
            ['ko', '/ko/api'],
            ['ja', '/ja/api'],
            ['es', '/es/api'],
            ['de', '/de/api'],
            ['fr', '/fr/api'],
            ['zh', '/zh/api'],
            ['zh-TW', '/zh-tw/api'],
            ['ru', '/ru/api'],
            ['ar', '/ar/api'],
            ['pt', '/pt/api'],
            ['it', '/it/api'],
            ['tr', '/tr/api'],
            ['vi', '/vi/api'],
            ['nl', '/nl/api'],
            ['th', '/th/api'],
            ['pl', '/pl/api'],
            ['hu', '/hu/api'],
          ],
        },
        // API endpoints are never locale-prefixed.
        {
          pattern: '/api/:path*',
          localized: [
            ['en', '/api/:path*'],
            ['ko', '/api/:path*'],
            ['ja', '/api/:path*'],
            ['es', '/api/:path*'],
            ['de', '/api/:path*'],
            ['fr', '/api/:path*'],
            ['zh', '/api/:path*'],
            ['zh-TW', '/api/:path*'],
            ['ru', '/api/:path*'],
            ['ar', '/api/:path*'],
            ['pt', '/api/:path*'],
            ['it', '/api/:path*'],
            ['tr', '/api/:path*'],
            ['vi', '/api/:path*'],
            ['nl', '/api/:path*'],
            ['th', '/api/:path*'],
            ['pl', '/api/:path*'],
            ['hu', '/api/:path*'],
          ],
        },
        // Bare locale homes match without a trailing-slash redirect.
        {
          pattern: '/',
          localized: [
            ['en', '/'],
            ['ko', '/ko'],
            ['ja', '/ja'],
            ['es', '/es'],
            ['de', '/de'],
            ['fr', '/fr'],
            ['zh', '/zh'],
            ['zh-TW', '/zh-tw'],
            ['ru', '/ru'],
            ['ar', '/ar'],
            ['pt', '/pt'],
            ['it', '/it'],
            ['tr', '/tr'],
            ['vi', '/vi'],
            ['nl', '/nl'],
            ['th', '/th'],
            ['pl', '/pl'],
            ['hu', '/hu'],
          ],
        },
        // "as-needed" prefix: non-default locales are prefixed; English stays unprefixed.
        {
          pattern: '/:path*',
          localized: [
            ['ko', '/ko/:path*'],
            ['ja', '/ja/:path*'],
            ['es', '/es/:path*'],
            ['de', '/de/:path*'],
            ['fr', '/fr/:path*'],
            ['zh', '/zh/:path*'],
            ['zh-TW', '/zh-tw/:path*'],
            ['ru', '/ru/:path*'],
            ['ar', '/ar/:path*'],
            ['pt', '/pt/:path*'],
            ['it', '/it/:path*'],
            ['tr', '/tr/:path*'],
            ['vi', '/vi/:path*'],
            ['nl', '/nl/:path*'],
            ['th', '/th/:path*'],
            ['pl', '/pl/:path*'],
            ['hu', '/hu/:path*'],
            // The base-locale catch-all must stay last: it also matches
            // localized paths such as /ko/pricing.
            ['en', '/:path*'],
          ],
        },
      ],
    }),
    tanstackStart({
      srcDirectory: 'src',
    }),
    ...sentryTanstackStart({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      silent: !process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        disable: process.env.SENTRY_AUTH_TOKEN ? false : 'disable-upload',
        filesToDeleteAfterUpload: ['.output/**/*.map'],
      },
    }),
    viteReact(),
    nitro({
      buildDir: process.env.NITRO_BUILD_DIR || undefined,
      output: process.env.NITRO_OUTPUT_DIR
        ? { dir: process.env.NITRO_OUTPUT_DIR }
        : undefined,
      // nf3 can misread libsql's Windows package entry while tracing pnpm's
      // dependency tree. Local output resolves it from the workspace; Linux
      // deployment builds keep normal tracing and package the dependency.
      traceDeps:
        process.platform === 'win32'
          ? [
              '!libsql',
              '!@sentry/tanstackstart-react',
              '!@sentry/*',
              '!@opentelemetry/*',
              '!import-in-the-middle',
              '!require-in-the-middle',
            ]
          : undefined,
      // Pin these imports to the version installed for better-auth; a clean
      // pnpm checkout need not expose this transitive package at the root.
      alias: {
        '@noble/ciphers/chacha.js': betterAuthRequire.resolve(
          '@noble/ciphers/chacha.js'
        ),
        '@noble/ciphers/utils.js': betterAuthRequire.resolve(
          '@noble/ciphers/utils.js'
        ),
      },
    }),
  ],
}));
