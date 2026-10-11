import handler from '@tanstack/react-start/server-entry';
import * as Sentry from '@sentry/tanstackstart-react';

import { paraglideMiddleware } from './paraglide/server.js';

// On Cloudflare Workers, stash the binding env (D1, ASSETS, …) on globalThis
// so synchronous code paths (e.g. the db() singleton with DATABASE_PROVIDER=d1)
// can reach bindings without threading the request context through every call.
// The specifier is kept non-literal so bundlers leave the import to runtime;
// outside workerd the import rejects and we just move on.
const CF_WORKERS_MODULE = 'cloudflare:workers';
let cfEnvPromise: Promise<void> | null = null;

function ensureCloudflareEnv(): Promise<void> {
  if (!cfEnvPromise) {
    cfEnvPromise = import(/* @vite-ignore */ CF_WORKERS_MODULE)
      .then((mod) => {
        (globalThis as any).__CF_ENV__ = mod.env;
      })
      .catch(() => {
        // Not running on Cloudflare Workers — nothing to stash.
      });
  }
  return cfEnvPromise;
}

// Custom server entry — wraps every request in Paraglide's middleware so
// getLocale() resolves per-request (AsyncLocalStorage) during SSR.
const sentryDsn = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN;
const buildVersion = (
  process.env.APP_BUILD_VERSION ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT_SHA ||
  ''
)
  .trim()
  .slice(0, 12);

function markBuild(response: Response) {
  if (!buildVersion) return response;
  const headers = new Headers(response.headers);
  headers.set('x-app-version', buildVersion);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const KNOWN_SCANNER_PATHS = [
  /^\/\.env(?:\/|$)/i,
  /^\/\.git(?:\/|$)/i,
  /^\/wp-admin(?:\/|$)/i,
  /^\/wp-login\.php$/i,
  /^\/xmlrpc\.php$/i,
  /^\/phpmyadmin(?:\/|$)/i,
  /^\/vendor\/phpunit(?:\/|$)/i,
];

function rejectKnownScannerPath(pathname: string): Response | null {
  if (!KNOWN_SCANNER_PATHS.some((pattern) => pattern.test(pathname))) {
    return null;
  }
  return new Response('Not found', {
    status: 404,
    headers: {
      'Cache-Control': 'public, max-age=86400, immutable',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'production',
    sendDefaultPii: false,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
  });
}

const serverEntry = {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const scannerResponse = rejectKnownScannerPath(url.pathname);
    if (scannerResponse) return markBuild(scannerResponse);

    await ensureCloudflareEnv();
    if (
      req.method === 'GET' &&
      url.pathname !== '/' &&
      url.pathname.endsWith('/') &&
      (url.pathname === '/api/' || !url.pathname.startsWith('/api/'))
    ) {
      url.pathname = url.pathname.replace(/\/+$/, '');
      return markBuild(
        new Response(null, {
          status: 308,
          headers: { Location: `${url.pathname}${url.search}${url.hash}` },
        })
      );
    }
    return markBuild(await paraglideMiddleware(req, () => handler.fetch(req)));
  },
};

export default sentryDsn
  ? Sentry.wrapFetchWithSentry(serverEntry)
  : serverEntry;
